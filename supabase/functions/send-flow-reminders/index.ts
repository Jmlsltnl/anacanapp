import { createClient } from 'npm:@supabase/supabase-js@2';
import { getFirebaseAccessToken, sendFCMv1 } from '../_shared/fcm.ts';

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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const currentHour = now.getUTCHours() + 4;
    const adjustedHour = currentHour >= 24 ? currentHour - 24 : currentHour;

    let body: { manual?: boolean } = {};
    try { body = await req.json(); } catch { /* No body */ }

    if (!body.manual && (adjustedHour < 9 || adjustedHour >= 22)) {
      return new Response(
        JSON.stringify({ message: 'Outside notification hours', skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const saJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!saJson) {
      return new Response(
        JSON.stringify({ error: 'Firebase service account not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { accessToken, projectId } = await getFirebaseAccessToken(saJson);

    const { data: reminders } = await supabase
      .from('flow_reminders').select('*').eq('is_enabled', true);

    if (!reminders?.length) {
      return new Response(
        JSON.stringify({ message: 'No active flow reminders', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profiles } = await supabase
      .from('profiles').select('user_id, life_stage, last_period_date, cycle_length, period_length').eq('life_stage', 'flow');

    const { data: tokens } = await supabase
      .from('device_tokens').select('token, user_id, platform');

    if (!tokens?.length) {
      return new Response(
        JSON.stringify({ message: 'No device tokens', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      if (!profile?.last_period_date) continue;

      const cycleLength = profile.cycle_length || 28;
      const periodLength = profile.period_length || 5;
      const cycleInfo = getCycleInfo(profile.last_period_date, cycleLength, periodLength);

      let shouldSend = false;
      let notificationTitle = reminder.title || '';
      let notificationBody = reminder.message || '';

      switch (reminder.reminder_type) {
        case 'period_start':
          if (cycleInfo.daysUntilPeriod === reminder.days_before) { shouldSend = true; notificationTitle = notificationTitle || 'Period yaxınlaşır 🔴'; notificationBody = notificationBody || `Perioda ${reminder.days_before} gün qaldı!`; }
          break;
        case 'period_end':
          if (cycleInfo.isPeriodDay && cycleInfo.currentCycleDay === periodLength) { shouldSend = true; notificationTitle = notificationTitle || 'Period bitdi ✅'; notificationBody = notificationBody || 'Periodunuz sona çatdı!'; }
          break;
        case 'ovulation':
          if (cycleInfo.daysUntilOvulation === reminder.days_before) { shouldSend = true; notificationTitle = notificationTitle || 'Ovulyasiya günü 🌸'; notificationBody = notificationBody || `Ovulyasiyaya ${reminder.days_before} gün qaldı!`; }
          break;
        case 'fertile_start':
          if (cycleInfo.daysUntilFertile === reminder.days_before) { shouldSend = true; notificationTitle = notificationTitle || 'Məhsuldar günlər 💕'; notificationBody = notificationBody || 'Məhsuldar günlər başlayır!'; }
          break;
        case 'fertile_end':
          if (cycleInfo.daysUntilFertile === -(6 - reminder.days_before)) { shouldSend = true; notificationTitle = notificationTitle || 'Məhsuldar günlər bitir 📅'; notificationBody = notificationBody || 'Məhsuldar günlər sona çatır.'; }
          break;
        case 'pms':
          if (cycleInfo.daysUntilPMS === reminder.days_before) { shouldSend = true; notificationTitle = notificationTitle || 'PMS dövrü ⚡'; notificationBody = notificationBody || 'PMS dövrü yaxınlaşır, özünüzə baxın!'; }
          break;
        case 'pill':
          shouldSend = true; notificationTitle = notificationTitle || 'Həb vaxtı 💊'; notificationBody = notificationBody || 'Gündəlik həbinizi qəbul etməyi unutmayın!';
          break;
      }

      if (!shouldSend) continue;

      const reminderHour = parseInt(reminder.time_of_day?.split(':')[0] || '9');
      if (Math.abs(adjustedHour - reminderHour) > 1) continue;

      const userTokens = tokensByUser.get(reminder.user_id);
      if (!userTokens?.length) continue;

      for (const deviceToken of userTokens) {
        const result = await sendFCMv1(accessToken, projectId, deviceToken.token, notificationTitle, notificationBody, {
          type: 'flow_reminder', reminder_type: reminder.reminder_type,
        });

        if (result.success) {
          sentCount++;
          results.push({ userId: reminder.user_id, type: reminder.reminder_type, success: true });

          await supabase.from('notification_send_log').insert({
            user_id: reminder.user_id, title: notificationTitle, body: notificationBody, status: 'sent',
          });

          break;
        } else if (result.unregistered) {
          await supabase.from('device_tokens').delete().eq('token', deviceToken.token);
        }
      }
    }

    console.log(`Flow reminders sent: ${sentCount}`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, totalReminders: reminders.length, results: results.slice(0, 10) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in send-flow-reminders:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
