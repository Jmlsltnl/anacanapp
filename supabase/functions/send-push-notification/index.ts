import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface FCMResponse {
  success?: number;
  failure?: number;
  results?: Array<{ message_id?: string; error?: string }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, title, body, data }: PushPayload = await req.json();

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Always store the notification in the app's notifications table
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message: body,
          notification_type: data?.type || 'push',
          is_read: false,
        });
      console.log(`Notification stored in database for user ${userId}`);
    } catch (storeError) {
      console.error('Error storing notification:', storeError);
      // Continue even if storage fails - we still want to try sending the push
    }

    // Get all device tokens for the user
    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('token, platform')
      .eq('user_id', userId);

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch device tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No device tokens found for user', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get FCM server key
    const fcmKey = Deno.env.get('FCM_SERVER_KEY');
    
    if (!fcmKey) {
      console.log('FCM_SERVER_KEY not configured, logging push request only');
      console.log(`Push notification request for user ${userId}:`);
      console.log(`Title: ${title}, Body: ${body}, Tokens: ${tokens.length}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `FCM not configured. Push notification logged for ${tokens.length} device(s)`,
          sent: 0,
          logged: tokens.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notifications via FCM
    let successCount = 0;
    let failureCount = 0;
    const results: Array<{ token: string; success: boolean; error?: string }> = [];

    for (const { token, platform } of tokens) {
      try {
        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${fcmKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: token,
            notification: {
              title,
              body,
              sound: 'default',
              badge: 1,
            },
            data: {
              ...data,
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            priority: 'high',
          }),
        });

        const fcmResult: FCMResponse = await fcmResponse.json();
        
        if (fcmResult.success && fcmResult.success > 0) {
          successCount++;
          results.push({ token: token.substring(0, 20) + '...', success: true });
        } else {
          failureCount++;
          const errorMsg = fcmResult.results?.[0]?.error || 'Unknown error';
          results.push({ token: token.substring(0, 20) + '...', success: false, error: errorMsg });
          
          // If token is invalid, remove it from database
          if (['InvalidRegistration', 'NotRegistered'].includes(errorMsg)) {
            await supabase
              .from('device_tokens')
              .delete()
              .eq('token', token);
            console.log(`Removed invalid token: ${token.substring(0, 20)}...`);
          }
        }
      } catch (err) {
        failureCount++;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        results.push({ 
          token: token.substring(0, 20) + '...', 
          success: false, 
          error: errorMessage 
        });
      }
    }

    console.log(`Push notification sent: ${successCount} success, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Push notification sent to ${successCount}/${tokens.length} device(s)`,
        sent: successCount,
        failed: failureCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in send-push-notification:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
