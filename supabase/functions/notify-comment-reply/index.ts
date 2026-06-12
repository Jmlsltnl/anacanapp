import { createClient } from 'npm:@supabase/supabase-js@2';
import { getFirebaseAccessToken, sendFCMv1 } from '../_shared/fcm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { comment_id } = await req.json();
    if (!comment_id) {
      return new Response(JSON.stringify({ error: 'comment_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Load the reply
    const { data: reply, error: replyErr } = await supabase
      .from('post_comments')
      .select('id, post_id, user_id, parent_comment_id, content, is_anonymous')
      .eq('id', comment_id)
      .maybeSingle();

    if (replyErr || !reply || !reply.parent_comment_id) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no parent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load parent comment
    const { data: parent } = await supabase
      .from('post_comments')
      .select('id, user_id')
      .eq('id', reply.parent_comment_id)
      .maybeSingle();

    if (!parent || parent.user_id === reply.user_id) {
      return new Response(JSON.stringify({ skipped: true, reason: 'self or missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Author name (respect anonymity)
    let authorName = 'Bir istifadəçi';
    if (!reply.is_anonymous) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', reply.user_id)
        .maybeSingle();
      if (prof?.name) authorName = prof.name;
    }

    const title = `${authorName} rəyinizə cavab yazdı`;
    const body = (reply.content || '').slice(0, 120);

    // Idempotency: avoid duplicate notifications for the same reply
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', parent.user_id)
      .eq('notification_type', 'community_reply')
      .eq('message', body)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ skipped: true, reason: 'duplicate' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store in-app notification
    await supabase.from('notifications').insert({
      user_id: parent.user_id,
      title,
      message: body,
      notification_type: 'community_reply',
      is_read: false,
    });

    // Get device tokens
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', parent.user_id);

    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0, stored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const saJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!saJson) {
      return new Response(JSON.stringify({ sent: 0, stored: true, fcm: 'not_configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { accessToken, projectId } = await getFirebaseAccessToken(saJson);
    const fcmData = {
      type: 'community_reply',
      post_id: String(reply.post_id),
      comment_id: String(reply.id),
      parent_comment_id: String(reply.parent_comment_id),
    };

    let success = 0, failed = 0;
    const errors: string[] = [];
    console.log(`[notify-comment-reply] Sending to ${tokens.length} tokens for user ${parent.user_id}`);
    for (const { token } of tokens) {
      const r = await sendFCMv1(accessToken, projectId, token, title, body, fcmData);
      if (r.success) success++;
      else {
        failed++;
        errors.push(`${r.errorCode}:${r.httpStatus}`);
        if (r.unregistered) await supabase.from('device_tokens').delete().eq('token', token);
      }
    }
    console.log(`[notify-comment-reply] sent=${success} failed=${failed} errors=${errors.join(',')}`);

    return new Response(JSON.stringify({ sent: success, failed, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('notify-comment-reply error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
