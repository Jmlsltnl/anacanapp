import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserForNotification {
  user_id: string;
  life_stage: string;
  role: string;
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
    const currentHour = now.getUTCHours() + 4; // Azerbaijan is UTC+4
    const adjustedHour = currentHour >= 24 ? currentHour - 24 : currentHour;

    if (adjustedHour < 9 || adjustedHour >= 24) {
      console.log(`Outside notification hours: ${adjustedHour}:00 (Baku time)`);
      return new Response(
        JSON.stringify({ message: 'Outside notification hours (09:00-00:00)', skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get FCM server key
    const fcmKey = Deno.env.get('FCM_SERVER_KEY');
    if (!fcmKey) {
      console.log('FCM_SERVER_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'FCM not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active scheduled notifications
    const { data: notifications, error: notifError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (notifError || !notifications?.length) {
      console.log('No active notifications found');
      return new Response(
        JSON.stringify({ message: 'No active notifications', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get users with push enabled
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, life_stage, role');

    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('user_id, push_enabled, daily_push_enabled, last_push_sent_at');

    // Get all device tokens
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token, user_id, platform');

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
        user_id: p.user_id,
        life_stage: p.life_stage || 'flow',
        role: p.role || 'user',
        daily_push_enabled: true,
        last_push_sent_at: null,
      });
    });

    preferences?.forEach((pref: any) => {
      const user = userMap.get(pref.user_id);
      if (user) {
        user.daily_push_enabled = pref.daily_push_enabled ?? pref.push_enabled ?? true;
        user.last_push_sent_at = pref.last_push_sent_at;
      }
    });

    // Filter users who can receive notifications (2-3 hour gap)
    const minGapMs = 2 * 60 * 60 * 1000; // 2 hours
    const eligibleUsers = Array.from(userMap.values()).filter(user => {
      if (!user.daily_push_enabled) return false;
      if (!user.last_push_sent_at) return true;
      
      const lastSent = new Date(user.last_push_sent_at).getTime();
      const gap = Date.now() - lastSent;
      return gap >= minGapMs;
    });

    console.log(`Eligible users: ${eligibleUsers.length}`);

    let sentCount = 0;
    const results: Array<{ userId: string; success: boolean; error?: string }> = [];

    for (const user of eligibleUsers) {
      // Find matching notification for this user
      const userNotification = notifications.find((n: ScheduledNotification) => {
        if (n.target_audience === 'all') return true;
        if (n.target_audience === user.life_stage) return true;
        if (n.target_audience === 'partner' && user.role === 'partner') return true;
        return false;
      });

      if (!userNotification) continue;

      // Get user's device tokens
      const userTokens = tokens.filter((t: DeviceToken) => t.user_id === user.user_id);
      if (!userTokens.length) continue;

      // Send to all user's devices
      for (const deviceToken of userTokens) {
        try {
          const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Authorization': `key=${fcmKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: deviceToken.token,
              notification: {
                title: userNotification.title,
                body: userNotification.body,
                sound: 'default',
              },
              data: {
                type: userNotification.target_audience,
                notification_id: userNotification.id,
              },
              priority: 'high',
            }),
          });

          const fcmResult = await fcmResponse.json();
          
          if (fcmResult.success > 0) {
            sentCount++;
            results.push({ userId: user.user_id, success: true });

            // Update last_push_sent_at
            await supabase
              .from('user_preferences')
              .upsert({
                user_id: user.user_id,
                last_push_sent_at: new Date().toISOString(),
              }, { onConflict: 'user_id' });

            // Log the notification
            await supabase
              .from('notification_send_log')
              .insert({
                user_id: user.user_id,
                notification_id: userNotification.id,
                title: userNotification.title,
                body: userNotification.body,
                status: 'sent',
              });
          } else {
            const errorMsg = fcmResult.results?.[0]?.error || 'Unknown';
            results.push({ userId: user.user_id, success: false, error: errorMsg });

            // Remove invalid tokens
            if (['InvalidRegistration', 'NotRegistered'].includes(errorMsg)) {
              await supabase
                .from('device_tokens')
                .delete()
                .eq('token', deviceToken.token);
            }
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          console.error(`Error sending to ${user.user_id}:`, err);
          results.push({ userId: user.user_id, success: false, error: errorMsg });
        }
      }
    }

    console.log(`Daily notifications sent: ${sentCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${sentCount} notifications`,
        sent: sentCount,
        eligible: eligibleUsers.length,
        results: results.slice(0, 10), // First 10 for debugging
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in send-daily-notifications:', err);
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
