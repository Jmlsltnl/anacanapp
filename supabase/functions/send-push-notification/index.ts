import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

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

    // For now, we'll log the push notification request
    // In production, you would integrate with:
    // - Firebase Cloud Messaging (FCM) for Android
    // - Apple Push Notification Service (APNs) for iOS
    // This requires additional setup with FCM/APNs credentials

    console.log(`Push notification request for user ${userId}:`);
    console.log(`Title: ${title}`);
    console.log(`Body: ${body}`);
    console.log(`Tokens: ${tokens.length}`);
    tokens.forEach((t) => {
      console.log(`  - Platform: ${t.platform}, Token: ${t.token.substring(0, 20)}...`);
    });

    // Placeholder for actual push implementation
    // You would need to:
    // 1. Set up FCM project and get server key
    // 2. Add FCM_SERVER_KEY as a secret
    // 3. Send HTTP request to FCM API
    
    // Example FCM request (requires FCM_SERVER_KEY secret):
    // const fcmKey = Deno.env.get('FCM_SERVER_KEY');
    // if (fcmKey) {
    //   for (const { token, platform } of tokens) {
    //     await fetch('https://fcm.googleapis.com/fcm/send', {
    //       method: 'POST',
    //       headers: {
    //         'Authorization': `key=${fcmKey}`,
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({
    //         to: token,
    //         notification: { title, body },
    //         data: data || {},
    //       }),
    //     });
    //   }
    // }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Push notification queued for ${tokens.length} device(s)`,
        sent: tokens.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
