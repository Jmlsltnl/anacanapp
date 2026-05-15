// Detaches partner links for users whose Premium subscription has expired,
// and sends a push notification to BOTH the woman and her partner.
// Designed to be called daily by pg_cron.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getFirebaseAccessToken, sendFCMv1 } from '../_shared/fcm.ts';
import { requireCronSecret } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const cronErr = requireCronSecret(req);
  if (cronErr) return cronErr;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const nowIso = new Date().toISOString();
  const detached: Array<{ womanUserId: string; partnerUserId: string | null }> = [];

  // 1. Find women whose subscription has expired but who still have a linked_partner_id
  const { data: expiredSubs, error: subErr } = await supabase
    .from('subscriptions')
    .select('user_id, plan_type, status, expires_at')
    .or(`status.eq.expired,and(status.eq.cancelled,expires_at.lt.${nowIso})`);

  if (subErr) {
    return new Response(JSON.stringify({ error: subErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Also pick up free-plan users who somehow still have a linked partner (defensive)
  for (const sub of expiredSubs ?? []) {
    // Get the woman's profile
    const { data: womanProfile } = await supabase
      .from('profiles')
      .select('id, user_id, linked_partner_id, is_premium')
      .eq('user_id', sub.user_id)
      .maybeSingle();

    if (!womanProfile?.linked_partner_id) continue;
    if (womanProfile.is_premium) continue; // still premium via profile flag — skip

    // Get the partner profile that the woman is linked to
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('id', womanProfile.linked_partner_id)
      .maybeSingle();

    // Detach both sides
    await supabase
      .from('profiles')
      .update({ linked_partner_id: null })
      .eq('id', womanProfile.id);

    if (partnerProfile?.id) {
      await supabase
        .from('profiles')
        .update({ linked_partner_id: null })
        .eq('id', partnerProfile.id);
    }

    detached.push({
      womanUserId: womanProfile.user_id,
      partnerUserId: partnerProfile?.user_id ?? null,
    });
  }

  // 2. Send push notification to both sides
  const saJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
  let pushSent = 0;

  if (saJson && detached.length > 0) {
    try {
      const { accessToken, projectId } = await getFirebaseAccessToken(saJson);

      for (const pair of detached) {
        const userIds = [pair.womanUserId, pair.partnerUserId].filter(Boolean) as string[];

        for (const uid of userIds) {
          // store in-app notification
          await supabase.from('notifications').insert({
            user_id: uid,
            title: 'Premium müddəti bitdi',
            message: 'Premium abunəliyiniz başa çatdı və partnyor bağlantısı dayandırıldı. Yenidən aktivləşdirmək üçün Premium-u uzadın.',
            notification_type: 'premium_expired',
            is_read: false,
          });

          const { data: tokens } = await supabase
            .from('device_tokens')
            .select('token')
            .eq('user_id', uid);

          for (const t of tokens ?? []) {
            const r = await sendFCMv1(
              accessToken,
              projectId,
              t.token,
              'Premium müddəti bitdi',
              'Partnyor bağlantınız dayandırıldı. Premium-u uzadın və yenidən qoşulun.',
              { type: 'premium_expired' }
            );
            if (r.success) pushSent++;
            if (r.unregistered) {
              await supabase.from('device_tokens').delete().eq('token', t.token);
            }
          }
        }
      }
    } catch (e) {
      console.error('FCM error:', e);
    }
  }

  return new Response(
    JSON.stringify({ detachedPairs: detached.length, pushSent }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
