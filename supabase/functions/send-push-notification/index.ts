import { createClient } from 'npm:@supabase/supabase-js@2';
import { getFirebaseAccessToken, sendFCMv1 } from '../_shared/fcm.ts';

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

    // Store notification in database
    try {
      await supabase.from('notifications').insert({
        user_id: userId, title, message: body,
        notification_type: data?.type || 'push', is_read: false,
      });
    } catch (storeError) {
      console.error('Error storing notification:', storeError);
    }

    // Get device tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens').select('token, platform').eq('user_id', userId);

    if (tokensError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch device tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens?.length) {
      return new Response(
        JSON.stringify({ message: 'No device tokens found for user', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Firebase access token
    const saJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!saJson) {
      console.log('FIREBASE_SERVICE_ACCOUNT_JSON not configured');
      return new Response(
        JSON.stringify({ success: true, message: `FCM not configured. Logged for ${tokens.length} device(s)`, sent: 0, logged: tokens.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { accessToken, projectId } = await getFirebaseAccessToken(saJson);

    let successCount = 0;
    let failureCount = 0;
    const results: Array<{ token: string; success: boolean; error?: string }> = [];

    const fcmData: Record<string, string> = {};
    if (data) {
      Object.entries(data).forEach(([k, v]) => { fcmData[k] = String(v); });
    }

    for (const { token } of tokens) {
      const result = await sendFCMv1(accessToken, projectId, token, title, body, fcmData);

      if (result.success) {
        successCount++;
        results.push({ token: token.substring(0, 20) + '...', success: true });
      } else {
        failureCount++;
        results.push({ token: token.substring(0, 20) + '...', success: false, error: result.error });
        if (result.unregistered) {
          await supabase.from('device_tokens').delete().eq('token', token);
        }
      }
    }

    console.log(`Push sent: ${successCount} success, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ success: true, sent: successCount, failed: failureCount, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in send-push-notification:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
