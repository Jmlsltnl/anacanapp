import { createClient } from 'npm:@supabase/supabase-js@2';
import { getFirebaseAccessToken, sendFCMv1 } from '../_shared/fcm.ts';
import { requireCronSecret, requireAdmin } from '../_shared/auth.ts';
import { startRunLog, finishRunLog, logFailedSend, bumpReason } from '../_shared/notif-logging.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlowReminder {
  id: string;
  user_id: string;
  reminder_type: string;
  days_before: number;
  time_of_day: string;
  is_enabled: boolean;
  title: string | null;
  message: string | null;
  title_en: string | null;
  message_en: string | null;
}

const EN_DEFAULTS: Record<string, { title: (d: number) => string; body: (d: number) => string }> = {
  period_start: { title: () => 'Period is coming 🔴', body: (d) => `${d} day(s) until your period!` },
  period_end: { title: () => 'Period ended ✅', body: () => 'Your period is over!' },
  ovulation: { title: () => 'Ovulation day 🌸', body: (d) => `${d} day(s) until ovulation!` },
  fertile_start: { title: () => 'Fertile window 💕', body: () => 'Your fertile window starts!' },
  fertile_end: { title: () => 'Fertile window ending 📅', body: () => 'Your fertile window is ending.' },
  pms: { title: () => 'PMS period ⚡', body: () => 'PMS is coming, take care of yourself!' },
  pill: { title: () => 'Pill time 💊', body: () => "Don't forget to take your daily pill!" },
};

function pickLang(value: string | null | undefined, valueEn: string | null | undefined, lang: string): string {
  if (lang === 'en' && valueEn && valueEn.trim()) return valueEn;
  return value || '';
}

interface UserProfile {
  user_id: string;
  life_stage: string;
  last_period_date: string | null;
  cycle_length: number | null;
  period_length: number | null;
}

interface DeviceToken {
  token: string;
  user_id: string;
  platform: string;
}

function parseBakuTimeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const [rawHour = '0', rawMinute = '0'] = value.split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
}

function getCycleInfo(lastPeriodDate: string, cycleLength: number, periodLength: number) {
  const today = new Date();
  const lmp = new Date(lastPeriodDate);
  today.setHours(0, 0, 0, 0);
  lmp.setHours(0, 0, 0, 0);

  const daysSincePeriod = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
  const currentCycleDay = (daysSincePeriod % cycleLength) + 1;
  const cyclesPassed = Math.floor(daysSincePeriod / cycleLength);
  const nextPeriodDate = new Date(lmp);
  nextPeriodDate.setDate(nextPeriodDate.getDate() + (cyclesPassed + 1) * cycleLength);
  const daysUntilPeriod = Math.floor((nextPeriodDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const ovulationDate = new Date(nextPeriodDate);
  ovulationDate.setDate(ovulationDate.getDate() - 14);
  const daysUntilOvulation = Math.floor((ovulationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const fertileStart = new Date(ovulationDate);
  fertileStart.setDate(fertileStart.getDate() - 5);
  const daysUntilFertile = Math.floor((fertileStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isPeriodDay = currentCycleDay <= periodLength;
  const daysUntilPMS = daysUntilPeriod - 7;

  return { currentCycleDay, daysUntilPeriod, daysUntilOvulation, daysUntilFertile, daysUntilPMS, isPeriodDay, cycleLength };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let runId: string | null = null;
  let runSupabase: any = null;
  const reasons: Record<string, number> = {};
  let failedCount = 0;
  let skippedCount = 0;

  try {
    // Accept scheduled calls (cron secret / project key) OR admin user (manual trigger from admin panel)
    const cronErr = requireCronSecret(req);
    let triggeredBy = 'cron';
    if (cronErr) {
      const adminCheck = await requireAdmin(req);
      if (adminCheck.error) return adminCheck.error;
      triggeredBy = 'admin';
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    runSupabase = supabase;

    const now = new Date();
    const bakuOffsetMs = 4 * 60 * 60 * 1000;
    const bakuNow = new Date(now.getTime() + bakuOffsetMs);
    const adjustedHour = bakuNow.getUTCHours();
    const bakuMinute = bakuNow.getUTCMinutes();
    const bakuTimeStr = `${String(adjustedHour).padStart(2, '0')}:${String(bakuMinute).padStart(2, '0')}`;
    const bakuMinutes = adjustedHour * 60 + bakuMinute;

    let body: { manual?: boolean; userId?: string } = {};
    try { body = await req.json(); } catch { /* No body */ }

    if (body.manual && body.userId) triggeredBy = 'admin-test';

    runId = await startRunLog(supabase, 'send-flow-reminders', triggeredBy, bakuTimeStr, body.manual ? 'manual' : null);

    if (!body.manual && (adjustedHour < 9 || adjustedHour >= 22)) {
      await finishRunLog(supabase, runId, { status: 'success', skipped_count: 1, reasons: { outside_hours: 1 } });
      return new Response(
        JSON.stringify({ message: 'Outside notification hours', skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const saJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!saJson) {
      await finishRunLog(supabase, runId, { status: 'error', error_message: 'Firebase SA not configured' });
      return new Response(
        JSON.stringify({ error: 'Firebase service account not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { accessToken, projectId } = await getFirebaseAccessToken(saJson);

    let remindersQuery = supabase.from('flow_reminders').select('*').eq('is_enabled', true);
    if (body.userId) remindersQuery = remindersQuery.eq('user_id', body.userId);
    const { data: reminders } = await remindersQuery;

    if (!reminders?.length) {
      await finishRunLog(supabase, runId, { status: 'success', skipped_count: 1, reasons: { no_active_reminders: 1 } });
      return new Response(
        JSON.stringify({ message: 'No active flow reminders', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let profilesQuery = supabase
      .from('profiles').select('user_id, life_stage, last_period_date, cycle_length, period_length').eq('life_stage', 'flow');
    if (body.userId) profilesQuery = profilesQuery.eq('user_id', body.userId);
    const { data: profiles } = await profilesQuery;

    let tokensQuery = supabase.from('device_tokens').select('token, user_id, platform');
    if (body.userId) tokensQuery = tokensQuery.eq('user_id', body.userId);
    const { data: tokens } = await tokensQuery;

    if (!tokens?.length) {
      await finishRunLog(supabase, runId, { status: 'success', skipped_count: 1, reasons: { no_device_tokens: 1 } });
      return new Response(
        JSON.stringify({ message: 'No device tokens', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user language preferences
    let prefsQuery = supabase.from('user_preferences').select('user_id, language');
    if (body.userId) prefsQuery = prefsQuery.eq('user_id', body.userId);
    const { data: prefs } = await prefsQuery;
    const langByUser = new Map<string, string>();
    prefs?.forEach((p: any) => { langByUser.set(p.user_id, p.language || 'az'); });

    const profileMap = new Map<string, UserProfile>();
    profiles?.forEach((p: UserProfile) => { if (p.last_period_date) profileMap.set(p.user_id, p); });

    const tokensByUser = new Map<string, DeviceToken[]>();
    tokens.forEach((t: DeviceToken) => {
      if (!tokensByUser.has(t.user_id)) tokensByUser.set(t.user_id, []);
      tokensByUser.get(t.user_id)!.push(t);
    });

    let sentCount = 0;
    const results: Array<{ userId: string; type: string; success: boolean }> = [];

    for (const reminder of reminders as FlowReminder[]) {
      const profile = profileMap.get(reminder.user_id);
      if (!profile?.last_period_date) { skippedCount++; bumpReason(reasons, 'flow_no_lmp'); continue; }

      const cycleLength = profile.cycle_length || 28;
      const periodLength = profile.period_length || 5;
      const cycleInfo = getCycleInfo(profile.last_period_date, cycleLength, periodLength);

      const userLang = langByUser.get(reminder.user_id) || 'az';
      let shouldSend = false;
      let notificationTitle = pickLang(reminder.title, reminder.title_en, userLang);
      let notificationBody = pickLang(reminder.message, reminder.message_en, userLang);

      const enDef = EN_DEFAULTS[reminder.reminder_type];
      const useEn = userLang === 'en' && enDef;

      switch (reminder.reminder_type) {
        case 'period_start':
          if (cycleInfo.daysUntilPeriod === reminder.days_before) {
            shouldSend = true;
            notificationTitle = notificationTitle || (useEn ? enDef.title(reminder.days_before) : 'Period yaxınlaşır 🔴');
            notificationBody = notificationBody || (useEn ? enDef.body(reminder.days_before) : `Perioda ${reminder.days_before} gün qaldı!`);
          }
          break;
        case 'period_end':
          if (cycleInfo.isPeriodDay && cycleInfo.currentCycleDay === periodLength) {
            shouldSend = true;
            notificationTitle = notificationTitle || (useEn ? enDef.title(0) : 'Period bitdi ✅');
            notificationBody = notificationBody || (useEn ? enDef.body(0) : 'Periodunuz sona çatdı!');
          }
          break;
        case 'ovulation':
          if (cycleInfo.daysUntilOvulation === reminder.days_before) {
            shouldSend = true;
            notificationTitle = notificationTitle || (useEn ? enDef.title(reminder.days_before) : 'Ovulyasiya günü 🌸');
            notificationBody = notificationBody || (useEn ? enDef.body(reminder.days_before) : `Ovulyasiyaya ${reminder.days_before} gün qaldı!`);
          }
          break;
        case 'fertile_start':
          if (cycleInfo.daysUntilFertile === reminder.days_before) {
            shouldSend = true;
            notificationTitle = notificationTitle || (useEn ? enDef.title(0) : 'Məhsuldar günlər 💕');
            notificationBody = notificationBody || (useEn ? enDef.body(0) : 'Məhsuldar günlər başlayır!');
          }
          break;
        case 'fertile_end':
          if (cycleInfo.daysUntilFertile === -(6 - reminder.days_before)) {
            shouldSend = true;
            notificationTitle = notificationTitle || (useEn ? enDef.title(0) : 'Məhsuldar günlər bitir 📅');
            notificationBody = notificationBody || (useEn ? enDef.body(0) : 'Məhsuldar günlər sona çatır.');
          }
          break;
        case 'pms':
          if (cycleInfo.daysUntilPMS === reminder.days_before) {
            shouldSend = true;
            notificationTitle = notificationTitle || (useEn ? enDef.title(0) : 'PMS dövrü ⚡');
            notificationBody = notificationBody || (useEn ? enDef.body(0) : 'PMS dövrü yaxınlaşır, özünüzə baxın!');
          }
          break;
        case 'pill':
          shouldSend = true;
          notificationTitle = notificationTitle || (useEn ? enDef.title(0) : 'Həb vaxtı 💊');
          notificationBody = notificationBody || (useEn ? enDef.body(0) : 'Gündəlik həbinizi qəbul etməyi unutmayın!');
          break;
      }

      // For admin test: bypass shouldSend / time-of-day window.
      if (!shouldSend && !body.manual) { skippedCount++; bumpReason(reasons, `flow_off_schedule:${reminder.reminder_type}`); continue; }

      const reminderMinutes = parseBakuTimeToMinutes(reminder.time_of_day);
      if (!body.manual && (reminderMinutes === null || Math.abs(bakuMinutes - reminderMinutes) > 15)) {
        skippedCount++;
        bumpReason(reasons, 'flow_wrong_time_window');
        continue;
      }

      if (body.manual) {
        notificationTitle = notificationTitle || `[TEST] Flow • ${reminder.reminder_type}`;
        notificationBody = notificationBody || 'Test bildirişi (admin paneli)';
      }

      const userTokens = tokensByUser.get(reminder.user_id);
      if (!userTokens?.length) { skippedCount++; bumpReason(reasons, 'no_device_token'); continue; }

      let delivered = false;
      let lastErr: { code?: string; msg?: string } = {};
      for (const deviceToken of userTokens) {
        const result = await sendFCMv1(accessToken, projectId, deviceToken.token, notificationTitle, notificationBody, {
          type: 'flow_reminder', reminder_type: reminder.reminder_type,
        });

        if (result.success) {
          sentCount++;
          delivered = true;
          results.push({ userId: reminder.user_id, type: reminder.reminder_type, success: true });

          await supabase.from('notification_send_log').insert({
            user_id: reminder.user_id, title: notificationTitle, body: notificationBody, status: 'sent',
            notification_type: 'flow_reminder', source_type: 'flow_reminder', source_notification_id: reminder.id,
          });

          break;
        } else {
          lastErr = { code: result.errorCode, msg: result.error };
          if (result.unregistered) {
            console.log(`[send-flow-reminders] Removing dead token (code=${result.errorCode}): ...${deviceToken.token.slice(-12)}`);
            await supabase.from('device_tokens').delete().eq('token', deviceToken.token);
          }
        }
      }
      if (!delivered) {
        failedCount++;
        bumpReason(reasons, `fcm:${lastErr.code || 'unknown'}`);
        await logFailedSend(supabase, {
          user_id: reminder.user_id,
          notification_type: 'flow_reminder',
          source_type: 'flow_reminder',
          source_notification_id: reminder.id,
          title: notificationTitle,
          body: notificationBody,
          reason: lastErr.msg || 'FCM send failed',
          error_code: lastErr.code,
        });
      }
    }

    console.log(`Flow reminders sent: ${sentCount}`);

    await finishRunLog(supabase, runId, {
      status: 'success',
      sent_count: sentCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
      eligible_count: reminders.length,
      reasons,
    });

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, failed: failedCount, skipped: skippedCount, reasons, totalReminders: reminders.length, results: results.slice(0, 10) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in send-flow-reminders:', err);
    if (runSupabase && runId) {
      await finishRunLog(runSupabase, runId, { status: 'error', error_message: err instanceof Error ? err.message : String(err) });
    }
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
