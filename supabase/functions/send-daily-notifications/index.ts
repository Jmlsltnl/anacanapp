import { createClient } from 'npm:@supabase/supabase-js@2';
import { getFirebaseAccessToken, sendFCMv1 } from '../_shared/fcm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserForNotification {
  user_id: string;
  life_stage: string;
  role: string;
  due_date: string | null;
  last_period_date: string | null;
  daily_push_enabled: boolean;
}

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  target_audience: string;
  priority: number;
}

interface DayNotification {
  id: string;
  day_number: number;
  title: string;
  body: string;
  emoji: string;
  send_time: string;
  is_active: boolean;
}

interface DeviceToken {
  token: string;
  user_id: string;
  platform: string;
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

    // Calculate current Baku time (UTC+4)
    const now = new Date();
    const bakuOffsetMs = 4 * 60 * 60 * 1000;
    const bakuNow = new Date(now.getTime() + bakuOffsetMs);
    const currentHour = bakuNow.getUTCHours();
    const currentMinute = bakuNow.getUTCMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    let body: { manual?: boolean } = {};
    try { body = await req.json(); } catch { /* No body */ }

    if (!body.manual && (currentHour < 9 || currentHour >= 24)) {
      return new Response(
        JSON.stringify({ message: 'Outside notification hours', skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which send_time slot we're in (within ±5 min window)
    const timeSlots = ['09:00', '14:00'];
    const matchingSlot = timeSlots.find(slot => {
      const [h, m] = slot.split(':').map(Number);
      const slotMinutes = h * 60 + m;
      const currentMinutes = currentHour * 60 + currentMinute;
      return Math.abs(currentMinutes - slotMinutes) <= 5;
    });

    // For manual triggers, send all pending; for cron, only matching slot
    const activeSendTime = body.manual ? null : matchingSlot;

    if (!body.manual && !matchingSlot) {
      return new Response(
        JSON.stringify({ message: `Not a notification time slot. Current: ${currentTimeStr}`, skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Firebase access token
    const saJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!saJson) {
      return new Response(
        JSON.stringify({ error: 'Firebase service account not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-daily-notifications] Started. bakuTime=${currentTimeStr} activeSlot=${activeSendTime || 'manual'} manual=${!!body.manual}`);

    const { accessToken, projectId } = await getFirebaseAccessToken(saJson);
    console.log(`[send-daily-notifications] Got Firebase access token, project=${projectId}`);

    // Get active scheduled notifications
    const { data: scheduledNotifications } = await supabase
      .from('scheduled_notifications').select('*').eq('is_active', true).order('priority', { ascending: true });

    // Get pregnancy day notifications - filter by send_time if we have an active slot
    let pregnancyQuery = supabase.from('pregnancy_day_notifications').select('*').eq('is_active', true);
    if (activeSendTime) pregnancyQuery = pregnancyQuery.eq('send_time', activeSendTime);
    const { data: pregnancyNotifications } = await pregnancyQuery;

    const pregnancyNotifsByDay = new Map<number, DayNotification[]>();
    pregnancyNotifications?.forEach((n: DayNotification) => {
      const existing = pregnancyNotifsByDay.get(n.day_number) || [];
      existing.push(n);
      pregnancyNotifsByDay.set(n.day_number, existing);
    });

    // Get mommy day notifications - filter by send_time if we have an active slot
    let mommyQuery = supabase.from('mommy_day_notifications').select('*').eq('is_active', true);
    if (activeSendTime) mommyQuery = mommyQuery.eq('send_time', activeSendTime);
    const { data: mommyNotifications } = await mommyQuery;

    const mommyNotifsByDay = new Map<number, DayNotification[]>();
    mommyNotifications?.forEach((n: DayNotification) => {
      const existing = mommyNotifsByDay.get(n.day_number) || [];
      existing.push(n);
      mommyNotifsByDay.set(n.day_number, existing);
    });

    // Get users
    const { data: profiles } = await supabase
      .from('profiles').select('user_id, life_stage, role, due_date, last_period_date');

    const { data: children } = await supabase
      .from('user_children').select('user_id, birth_date').order('birth_date', { ascending: false });

    const { data: preferences } = await supabase
      .from('user_preferences').select('user_id, push_enabled, daily_push_enabled');

    const { data: tokens } = await supabase
      .from('device_tokens').select('token, user_id, platform');

    if (!tokens?.length) {
      return new Response(
        JSON.stringify({ message: 'No device tokens', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get today's already sent notifications to prevent duplicates
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { data: todaySentLogs } = await supabase
      .from('notification_send_log')
      .select('user_id, source_type, source_notification_id')
      .gte('sent_at', todayStart.toISOString())
      .eq('status', 'sent');

    // Build a set of "userId:sourceType:sourceNotifId" for dedup
    const alreadySent = new Set<string>();
    todaySentLogs?.forEach((log: any) => {
      if (log.source_type && log.source_notification_id) {
        alreadySent.add(`${log.user_id}:${log.source_type}:${log.source_notification_id}`);
      }
    });

    // Build user map
    const userMap = new Map<string, UserForNotification>();
    profiles?.forEach((p: any) => {
      userMap.set(p.user_id, {
        user_id: p.user_id, life_stage: p.life_stage || 'flow', role: p.role || 'user',
        due_date: p.due_date, last_period_date: p.last_period_date,
        daily_push_enabled: true,
      });
    });

    preferences?.forEach((pref: any) => {
      const user = userMap.get(pref.user_id);
      if (user) {
        user.daily_push_enabled = pref.daily_push_enabled ?? pref.push_enabled ?? true;
      }
    });

    const calculatePregnancyDay = (lastPeriodDate: string | null): number | null => {
      if (!lastPeriodDate) return null;
      const lmp = new Date(lastPeriodDate);
      const today = new Date();
      lmp.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return (diffDays >= 1 && diffDays <= 280) ? diffDays : null;
    };

    const eligibleUsers = Array.from(userMap.values()).filter(user => user.daily_push_enabled);

    console.log(`Eligible users: ${eligibleUsers.length}`);

    let sentCount = 0;
    const results: Array<{ userId: string; success: boolean; type?: string; day?: number; error?: string }> = [];

    for (const user of eligibleUsers) {
      const userTokens = tokens.filter((t: DeviceToken) => t.user_id === user.user_id);
      if (!userTokens.length) continue;

      // Collect all notifications to send for this user
      const notificationsToSend: Array<{ title: string; body: string; id: string; type: string; day?: number }> = [];

      // Priority 1a: pregnancy day notifications (ALL for the user's current day)
      if (user.life_stage === 'bump' && user.last_period_date) {
        const pregnancyDay = calculatePregnancyDay(user.last_period_date);
        if (pregnancyDay !== null) {
          const dayNotifications = pregnancyNotifsByDay.get(pregnancyDay) || [];
          for (const dn of dayNotifications) {
            const dedupKey = `${user.user_id}:pregnancy_day:${dn.id}`;
            if (!alreadySent.has(dedupKey)) {
              notificationsToSend.push({
                id: dn.id,
                title: `${dn.emoji || ''} ${dn.title}`.trim(),
                body: dn.body,
                type: 'pregnancy_day',
                day: pregnancyDay,
              });
            }
          }
        }
      }

      // Priority 1b: mommy day notifications (ALL for the child's current day)
      if (user.life_stage === 'mommy') {
        const userChildren = children?.filter((c: any) => c.user_id === user.user_id) || [];
        if (userChildren.length > 0 && userChildren[0].birth_date) {
          const birthDate = new Date(userChildren[0].birth_date);
          const today = new Date();
          birthDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          const childAgeDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          if (childAgeDays >= 1 && childAgeDays <= 1460) {
            const dayNotifications = mommyNotifsByDay.get(childAgeDays) || [];
            for (const dn of dayNotifications) {
              const dedupKey = `${user.user_id}:mommy_day:${dn.id}`;
              if (!alreadySent.has(dedupKey)) {
                notificationsToSend.push({
                  id: dn.id,
                  title: `${dn.emoji || ''} ${dn.title}`.trim(),
                  body: dn.body,
                  type: 'mommy_day',
                  day: childAgeDays,
                });
              }
            }
          }
        }
      }

      // Priority 2: scheduled notifications (only if no day-specific notifications were found at all for this day)
      if (notificationsToSend.length === 0 && scheduledNotifications?.length) {
        const match = scheduledNotifications.find((n: ScheduledNotification) => {
          if (n.target_audience === 'all') return true;
          if (n.target_audience === user.life_stage) return true;
          if (n.target_audience === 'partner' && user.role === 'partner') return true;
          return false;
        });
        if (match) {
          const dedupKey = `${user.user_id}:scheduled:${match.id}`;
          if (!alreadySent.has(dedupKey)) {
            notificationsToSend.push({ id: match.id, title: match.title, body: match.body, type: 'scheduled' });
          }
        }
      }

      // Send all collected notifications
      for (const notif of notificationsToSend) {
        let sent = false;
        for (const deviceToken of userTokens) {
          const result = await sendFCMv1(accessToken, projectId, deviceToken.token, notif.title, notif.body, {
            type: notif.type, notification_id: notif.id,
          });

          if (result.success) {
            sentCount++;
            sent = true;
            results.push({ userId: user.user_id, success: true, type: notif.type, day: notif.day });

            await supabase.from('notification_send_log').insert({
              user_id: user.user_id,
              notification_id: notif.type === 'scheduled' ? notif.id : null,
              title: notif.title,
              body: notif.body,
              status: 'sent',
              source_type: notif.type,
              source_notification_id: notif.id,
            });

            break; // sent to one device is enough
          } else {
            results.push({ userId: user.user_id, success: false, error: result.error });
            if (result.unregistered) {
              await supabase.from('device_tokens').delete().eq('token', deviceToken.token);
            }
          }
        }
      }
    }

    // Update last_push_sent_at for users who got notifications
    const sentUserIds = [...new Set(results.filter(r => r.success).map(r => r.userId))];
    for (const userId of sentUserIds) {
      await supabase.from('user_preferences').upsert({
        user_id: userId, last_push_sent_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }

    console.log(`Daily notifications sent: ${sentCount}`);

    return new Response(
      JSON.stringify({
        success: true, sent: sentCount, eligible: eligibleUsers.length,
        currentTime: currentTimeStr, activeSlot: activeSendTime || 'manual',
        pregnancyDaysAvailable: pregnancyNotifsByDay.size,
        mommyDaysAvailable: mommyNotifsByDay.size,
        results: results.slice(0, 20),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in send-daily-notifications:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
