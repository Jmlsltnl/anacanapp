import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { notificationId } = await req.json();

    if (!notificationId) {
      return new Response(
        JSON.stringify({ error: 'notificationId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get FCM server key
    const fcmKey = Deno.env.get('FCM_SERVER_KEY');
    if (!fcmKey) {
      return new Response(
        JSON.stringify({ error: 'FCM not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the bulk notification
    const { data: notification, error: notifError } = await supabase
      .from('bulk_push_notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (notifError || !notification) {
      return new Response(
        JSON.stringify({ error: 'Notification not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to sending
    await supabase
      .from('bulk_push_notifications')
      .update({ status: 'sending' })
      .eq('id', notificationId);

    // Get user profiles based on target audience
    let profilesQuery = supabase
      .from('profiles')
      .select('user_id, life_stage, role');

    if (notification.target_audience !== 'all') {
      if (notification.target_audience === 'partner') {
        profilesQuery = profilesQuery.eq('role', 'partner');
      } else {
        profilesQuery = profilesQuery.eq('life_stage', notification.target_audience);
      }
    }

    const { data: profiles } = await profilesQuery;

    if (!profiles?.length) {
      await supabase
        .from('bulk_push_notifications')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString(),
          total_sent: 0,
          total_failed: 0 
        })
        .eq('id', notificationId);

      return new Response(
        JSON.stringify({ sent: 0, failed: 0, message: 'No matching users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userIds = profiles.map(p => p.user_id);

    // Get device tokens for these users
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token, user_id, platform')
      .in('user_id', userIds);

    if (!tokens?.length) {
      await supabase
        .from('bulk_push_notifications')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString(),
          total_sent: 0,
          total_failed: 0 
        })
        .eq('id', notificationId);

      return new Response(
        JSON.stringify({ sent: 0, failed: 0, message: 'No device tokens found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending bulk push to ${tokens.length} devices`);

    let sentCount = 0;
    let failedCount = 0;

    // Send notifications in batches to avoid rate limiting
    const batchSize = 100;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      
      const promises = batch.map(async (deviceToken: DeviceToken) => {
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
                title: notification.title,
                body: notification.body,
                sound: 'default',
                badge: 1,
              },
              data: {
                type: 'bulk',
                notification_id: notificationId,
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
              },
              priority: 'high',
              // Enable background/offline delivery
              content_available: true,
              mutable_content: true,
              // Android specific for high priority background delivery
              android: {
                priority: 'high',
                notification: {
                  sound: 'default',
                  default_vibrate_timings: true,
                  default_light_settings: true,
                  channel_id: 'high_importance_channel',
                },
                direct_boot_ok: true,
              },
              // iOS specific for background delivery even when app is killed
              apns: {
                headers: {
                  'apns-priority': '10',
                  'apns-push-type': 'alert',
                },
                payload: {
                  aps: {
                    alert: {
                      title: notification.title,
                      body: notification.body,
                    },
                    sound: 'default',
                    badge: 1,
                    'content-available': 1,
                    'mutable-content': 1,
                  },
                },
              },
            }),
          });

          const result = await fcmResponse.json();

          if (result.success > 0) {
            sentCount++;
            
            // Log the notification
            await supabase
              .from('notification_send_log')
              .insert({
                user_id: deviceToken.user_id,
                notification_id: null, // It's from bulk, not scheduled
                title: notification.title,
                body: notification.body,
                status: 'sent',
              });
          } else {
            failedCount++;
            
            // Remove invalid tokens
            const errorMsg = result.results?.[0]?.error;
            if (['InvalidRegistration', 'NotRegistered'].includes(errorMsg)) {
              await supabase
                .from('device_tokens')
                .delete()
                .eq('token', deviceToken.token);
            }
          }
        } catch (err) {
          console.error(`Error sending to token:`, err);
          failedCount++;
        }
      });

      await Promise.all(promises);
    }

    // Update the bulk notification with results
    await supabase
      .from('bulk_push_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        total_sent: sentCount,
        total_failed: failedCount,
      })
      .eq('id', notificationId);

    console.log(`Bulk push complete: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
        total: tokens.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in send-bulk-push:', err);
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
