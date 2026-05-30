import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function randomToken(len = 40) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, len);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const adminAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const jwt = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await adminAuth.auth.getUser(jwt);
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const venueId = body?.venue_id as string;
    if (!venueId || typeof venueId !== 'string') {
      return new Response(JSON.stringify({ error: 'venue_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Premium check
    const { data: profile } = await admin
      .from('profiles')
      .select('is_premium, premium_until, name')
      .eq('user_id', userId)
      .maybeSingle();

    const isPremium = !!profile?.is_premium && (!profile?.premium_until || new Date(profile.premium_until) > new Date());
    if (!isPremium) {
      return new Response(JSON.stringify({ error: 'premium_required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch venue
    const { data: venue, error: venueErr } = await admin
      .from('partner_venues')
      .select('id, name, qr_ttl_seconds, is_active, discount_label')
      .eq('id', venueId)
      .maybeSingle();

    if (venueErr || !venue || !venue.is_active) {
      return new Response(JSON.stringify({ error: 'venue_not_found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // can_redeem check
    const { data: canData, error: canErr } = await admin.rpc('can_redeem_partner_venue', { _user_id: userId, _venue_id: venueId });
    if (canErr) {
      return new Response(JSON.stringify({ error: 'check_failed', details: canErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!canData?.allowed) {
      return new Response(JSON.stringify({ error: canData?.reason || 'not_allowed', next_available_at: canData?.next_available_at }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tok = randomToken(40);
    const expiresAt = new Date(Date.now() + venue.qr_ttl_seconds * 1000).toISOString();

    const { error: insErr } = await admin.from('partner_redemptions').insert({
      venue_id: venueId,
      user_id: userId,
      token: tok,
      status: 'pending',
      expires_at: expiresAt,
      client_meta: { ua: req.headers.get('user-agent') || null },
    });
    if (insErr) {
      return new Response(JSON.stringify({ error: 'insert_failed', details: insErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const origin = req.headers.get('origin') || 'https://app.anacan.az';
    return new Response(
      JSON.stringify({
        token: tok,
        verify_url: `${origin}/p/v/${tok}`,
        expires_at: expiresAt,
        ttl_seconds: venue.qr_ttl_seconds,
        venue_name: venue.name,
        discount_label: venue.discount_label,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: 'internal', details: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
