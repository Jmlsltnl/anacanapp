import { createClient } from 'npm:@supabase/supabase-js@2';
import { getFirebaseAccessToken, sendFCMv1 } from '../_shared/fcm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current time + 5 minutes window
    // We look for vitamins scheduled between now+4min and now+6min (1-minute cron window)
    const now = new Date();
    const targetTime = new Date(now.getTime() + 5 * 60 * 1000);
    const targetHour = targetTime.getUTCHours().toString().padStart(2, '0');
    const targetMinute = targetTime.getUTCMinutes().toString().padStart(2, '0');
    const targetTimeStr = `${targetHour}:${targetMinute}:00`;

    // Also check +/- 1 minute for cron tolerance
    const targetTimeMinus = new Date(targetTime.getTime() - 60 * 1000);
    const targetTimePlus = new Date(targetTime.getTime() + 60 * 1000);
    const timeMin = `${targetTimeMinus.getUTCHours().toString().padStart(2, '0')}:${targetTimeMinus.getUTCMinutes().toString().padStart(2, '0')}:00`;
    const timeMax = `${targetTimePlus.getUTCHours().toString().padStart(2, '0')}:${targetTimePlus.getUTCMinutes().toString().padStart(2, '0')}:00`;

    const currentDayOfWeek = now.getUTCDay(); // 0=Sunday

    console.log(`Checking vitamin reminders for time range ${timeMin}-${timeMax}, day: ${currentDayOfWeek}`);

    // Get active schedules with notification enabled in time window
    const { data: schedules, error: schedError } = await supabase
      .from('user_vitamin_schedules')
      .select('*')
      .eq('is_active', true)
      .eq('notification_enabled', true)
      .gte('scheduled_time', timeMin)
      .lte('scheduled_time', timeMax)
      .contains('days_of_week', [currentDayOfWeek]);

    if (schedError) {
      console.error('Error fetching schedules:', schedError);
      throw schedError;
    }

    if (!schedules?.length) {
      console.log('No vitamin reminders to send');
      return new Response(
        JSON.stringify({ message: 'No reminders', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${schedules.length} vitamin reminders to process`);

    // Check which users already took their vitamin today
    const today = now.toISOString().split('T')[0];
    const scheduleIds = schedules.map(s => s.id);
    
    const { data: takenLogs } = await supabase
      .from('vitamin_intake_logs')
      .select('schedule_id')
      .in('schedule_id', scheduleIds)
      .eq('log_date', today);

    const takenScheduleIds = new Set(takenLogs?.map(l => l.schedule_id) || []);
    const pendingSchedules = schedules.filter(s => !takenScheduleIds.has(s.id));

    if (!pendingSchedules.length) {
      console.log('All vitamins already taken');
      return new Response(
        JSON.stringify({ message: 'All taken', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Firebase access token
    const saJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!saJson) {
      console.log('FIREBASE_SERVICE_ACCOUNT_JSON not configured');
      return new Response(
        JSON.stringify({ message: 'FCM not configured', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { accessToken, projectId } = await getFirebaseAccessToken(saJson);

    let sentCount = 0;
    let failedCount = 0;

    // Group by user
    const userSchedules = pendingSchedules.reduce((acc, s) => {
      if (!acc[s.user_id]) acc[s.user_id] = [];
      acc[s.user_id].push(s);
      return acc;
    }, {} as Record<string, typeof pendingSchedules>);

    for (const [userId, userVitamins] of Object.entries(userSchedules)) {
      // Get device tokens
      const { data: tokens } = await supabase
        .from('device_tokens')
        .select('token, platform')
        .eq('user_id', userId);

      if (!tokens?.length) continue;

      // Build notification
      const vitaminNames = userVitamins.map(v => `${v.icon_emoji} ${v.vitamin_name}`).join(', ');
      const title = '💊 Vitamin qəbulu vaxtıdır!';
      const body = userVitamins.length === 1
        ? `${userVitamins[0].vitamin_name} qəbul etmə vaxtıdır`
        : `${userVitamins.length} vitamin qəbul etmə vaxtıdır: ${vitaminNames}`;

      // Store notification
      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          title,
          message: body,
          notification_type: 'vitamin_reminder',
          is_read: false,
        });
      } catch (e) {
        console.error('Error storing notification:', e);
      }

      // Send to each device
      for (const { token } of tokens) {
        const result = await sendFCMv1(accessToken, projectId, token, title, body, {
          type: 'vitamin_reminder',
          screen: 'vitamin-tracker',
        });

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
          if (result.unregistered) {
            await supabase.from('device_tokens').delete().eq('token', token);
          }
        }
      }
    }

    console.log(`Vitamin reminders sent: ${sentCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, failed: failedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in send-vitamin-reminders:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
