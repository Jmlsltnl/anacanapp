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
  last_push_sent_at: string | null;
}

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  target_audience: string;
  priority: number;
}

interface PregnancyDayNotification {
  id: string;
  day_number: number;
  title: string;
  body: string;
  emoji: string;
  is_active: boolean;
}

interface MommyDayNotification {
  id: string;
  day_number: number;
  title: string;
  body: string;
  emoji: string;
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

    // Check current time - only send between 9:00 and 00:00
    const now = new Date();
    const currentHour = now.getUTCHours() + 4;
    const adjustedHour = currentHour >= 24 ? currentHour - 24 : currentHour;

    let body: { manual?: boolean } = {};
    try { body = await req.json(); } catch { /* No body */ }

    if (!body.manual && (adjustedHour < 9 || adjustedHour >= 24)) {
      return new Response(
        JSON.stringify({ message: 'Outside notification hours', skipped: true }),
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

    const { accessToken, projectId } = await getFirebaseAccessToken(saJson);

    // Get active scheduled notifications
    const { data: scheduledNotifications } = await supabase
      .from('scheduled_notifications').select('*').eq('is_active', true).order('priority', { ascending: true });

    // Get pregnancy day notifications
    const { data: pregnancyNotifications } = await supabase
      .from('pregnancy_day_notifications').select('*').eq('is_active', true);

    const pregnancyNotifMap = new Map<number, PregnancyDayNotification>();
    pregnancyNotifications?.forEach((n: PregnancyDayNotification) => { pregnancyNotifMap.set(n.day_number, n); });

    // Get mommy day notifications
    const { data: mommyNotifications } = await supabase
      .from('mommy_day_notifications').select('*').eq('is_active', true);

    const mommyNotifMap = new Map<number, MommyDayNotification>();
    mommyNotifications?.forEach((n: MommyDayNotification) => {
      if (!mommyNotifMap.has(n.day_number)) mommyNotifMap.set(n.day_number, n);
    });

    // Get users
    const { data: profiles } = await supabase
      .from('profiles').select('user_id, life_stage, role, due_date, last_period_date');

    const { data: children } = await supabase
      .from('user_children').select('user_id, birth_date').order('birth_date', { ascending: false });

    const { data: preferences } = await supabase
      .from('user_preferences').select('user_id, push_enabled, daily_push_enabled, last_push_sent_at');

    const { data: tokens } = await supabase
      .from('device_tokens').select('token, user_id, platform');

    if (!tokens?.length) {
      return new Response(
        JSON.stringify({ message: 'No device tokens', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build user map
    const userMap = new Map<string, UserForNotification>();
    profiles?.forEach((p: any) => {
      userMap.set(p.user_id, {
        user_id: p.user_id, life_stage: p.life_stage || 'flow', role: p.role || 'user',
        due_date: p.due_date, last_period_date: p.last_period_date,
        daily_push_enabled: true, last_push_sent_at: null,
      });
    });

    preferences?.forEach((pref: any) => {
      const user = userMap.get(pref.user_id);
      if (user) {
        user.daily_push_enabled = pref.daily_push_enabled ?? pref.push_enabled ?? true;
        user.last_push_sent_at = pref.last_push_sent_at;
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

    const minGapMs = 2 * 60 * 60 * 1000;
    const eligibleUsers = Array.from(userMap.values()).filter(user => {
      if (!user.daily_push_enabled) return false;
      if (!user.last_push_sent_at) return true;
      return Date.now() - new Date(user.last_push_sent_at).getTime() >= minGapMs;
    });

    console.log(`Eligible users: ${eligibleUsers.length}`);

    let sentCount = 0;
    const results: Array<{ userId: string; success: boolean; type?: string; error?: string }> = [];

    for (const user of eligibleUsers) {
      let notificationToSend: { title: string; body: string; id: string; type: string } | null = null;

      // Priority 1a: pregnancy day
      if (user.life_stage === 'bump' && user.last_period_date) {
        const pregnancyDay = calculatePregnancyDay(user.last_period_date);
        if (pregnancyDay !== null) {
          const dayNotification = pregnancyNotifMap.get(pregnancyDay);
          if (dayNotification) {
            notificationToSend = {
              id: dayNotification.id,
              title: `${dayNotification.emoji} ${dayNotification.title}`,
              body: dayNotification.body, type: 'pregnancy_day',
            };
          }
        }
      }

      // Priority 1b: mommy day
      if (!notificationToSend && user.life_stage === 'mommy') {
        const userChildren = children?.filter((c: any) => c.user_id === user.user_id) || [];
        if (userChildren.length > 0 && userChildren[0].birth_date) {
          const birthDate = new Date(userChildren[0].birth_date);
          const today = new Date();
          birthDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          const childAgeDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          if (childAgeDays >= 1 && childAgeDays <= 1460) {
            const mommyNotif = mommyNotifMap.get(childAgeDays);
            if (mommyNotif) {
              notificationToSend = {
                id: mommyNotif.id,
                title: `${mommyNotif.emoji} ${mommyNotif.title}`,
                body: mommyNotif.body, type: 'mommy_day',
              };
            }
          }
        }
      }

      // Priority 2: scheduled
      if (!notificationToSend && scheduledNotifications?.length) {
        const match = scheduledNotifications.find((n: ScheduledNotification) => {
          if (n.target_audience === 'all') return true;
          if (n.target_audience === user.life_stage) return true;
          if (n.target_audience === 'partner' && user.role === 'partner') return true;
          return false;
        });
        if (match) {
          notificationToSend = { id: match.id, title: match.title, body: match.body, type: 'scheduled' };
        }
      }

      if (!notificationToSend) continue;

      const userTokens = tokens.filter((t: DeviceToken) => t.user_id === user.user_id);
      if (!userTokens.length) continue;

      for (const deviceToken of userTokens) {
        const result = await sendFCMv1(accessToken, projectId, deviceToken.token, notificationToSend.title, notificationToSend.body, {
          type: notificationToSend.type, notification_id: notificationToSend.id,
        });

        if (result.success) {
          sentCount++;
          results.push({ userId: user.user_id, success: true, type: notificationToSend.type });

          await supabase.from('user_preferences').upsert({
            user_id: user.user_id, last_push_sent_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

          await supabase.from('notification_send_log').insert({
            user_id: user.user_id,
            notification_id: notificationToSend.type === 'scheduled' ? notificationToSend.id : null,
            title: notificationToSend.title, body: notificationToSend.body, status: 'sent',
          });

          break;
        } else {
          results.push({ userId: user.user_id, success: false, error: result.error });
          if (result.unregistered) {
            await supabase.from('device_tokens').delete().eq('token', deviceToken.token);
          }
        }
      }
    }

    console.log(`Daily notifications sent: ${sentCount}`);

    return new Response(
      JSON.stringify({
        success: true, sent: sentCount, eligible: eligibleUsers.length,
        pregnancyNotificationsAvailable: pregnancyNotifMap.size,
        mommyNotificationsAvailable: mommyNotifMap.size,
        results: results.slice(0, 10),
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
