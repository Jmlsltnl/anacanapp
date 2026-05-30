import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
import bcrypt from 'npm:bcryptjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function maskName(name?: string | null): string {
  if (!name) return 'İstifadəçi';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const pin = typeof body?.pin === 'string' ? body.pin.trim() : '';

    if (!token || !pin) {
      return new Response(JSON.stringify({ error: 'missing_params' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: red } = await admin
      .from('partner_redemptions')
      .select('id, venue_id, user_id, status, expires_at, verified_at')
      .eq('token', token)
      .maybeSingle();

    if (!red) {
      return new Response(JSON.stringify({ error: 'invalid_token' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (red.status === 'verified') {
      return new Response(JSON.stringify({ error: 'already_verified', verified_at: red.verified_at }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (new Date(red.expires_at) < new Date()) {
      await admin.from('partner_redemptions').update({ status: 'expired' }).eq('id', red.id).eq('status', 'pending');
      return new Response(JSON.stringify({ error: 'expired' }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: venue } = await admin
      .from('partner_venues')
      .select('id, name, pin_hash, discount_label, logo_url')
      .eq('id', red.venue_id)
      .maybeSingle();

    if (!venue) {
      return new Response(JSON.stringify({ error: 'venue_missing' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!venue.pin_hash) {
      return new Response(JSON.stringify({ error: 'pin_not_configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const okPin = await bcrypt.compare(pin, venue.pin_hash);
    if (!okPin) {
      return new Response(JSON.stringify({ error: 'invalid_pin' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('cf-connecting-ip') || null;

    const verifiedAt = new Date().toISOString();

    const { data: updatedRows, error: updErr } = await admin
      .from('partner_redemptions')
      .update({ status: 'verified', verified_at: verifiedAt, verified_ip: ip })
      .select('verified_at')
      .eq('id', red.id)
      .eq('status', 'pending');

    if (updErr) {
      return new Response(JSON.stringify({ error: 'update_failed', details: updErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('name, is_premium')
      .eq('user_id', red.user_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        status: 'verified',
        venue_name: venue.name,
        venue_logo_url: venue.logo_url,
        discount_label: venue.discount_label,
        user_name: maskName(profile?.name),
        is_premium: !!profile?.is_premium,
        verified_at: updatedRows?.[0]?.verified_at ?? verifiedAt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: 'internal', details: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
