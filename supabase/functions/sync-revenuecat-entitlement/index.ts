// ============================================================
// sync-revenuecat-entitlement — TƏK etibarlı yol subscriptions/profiles
// cədvəllərinə "Premium" statusu yazmaq üçün.
//
// NİYƏ LAZIMDIR: əvvəllər klient (useInAppPurchase.ts) öz RevenueCat SDK
// nəticəsinə əsasən BİRBAŞA `subscriptions`/`profiles` cədvəllərinə yazırdı.
// RLS bunu icazə verirdi (auth.uid()=user_id yoxlaması ilə) — yəni istənilən
// istifadəçi öz sessiyası ilə eyni upsert-i əl ilə çağırıb, HEÇ BİR real
// ödəniş olmadan özünə sonsuz Premium Plus verə bilərdi.
//
// Bu funksiya RevenueCat-ın SERVER-tərəfi REST API-sini (məxfi API açarı ilə,
// yalnız serverdə mövcuddur) çağıraraq istifadəçinin HƏQİQİ entitlement
// vəziyyətini RevenueCat-ın öz bazasından (Apple/Google-la server-server
// sinxron olan) müstəqil öyrənir — klientin sözünə deyil, RC-nin öz
// tərəfindən təsdiqlənmiş vəziyyətə əsaslanır. subscriptions cədvəli artıq
// yalnız service-role tərəfindən yazıla bilir (bax Duzelis33.sql) — bu
// funksiya həmin YEGANƏ etibarlı yazı yoludur.
//
// Tələb olunan Supabase Edge Function Secret:
//   REVENUECAT_SECRET_API_KEY — RC Dashboard → Project Settings → API Keys →
//   "Secret API keys" bölməsindən (sk_... ilə başlayır). DİQQƏT: bu, artıq
//   src/lib/revenuecat.ts-də olan goog_/appl_ PUBLIC SDK açarlarından TAMAMİLƏ
//   FƏRQLİDİR — həmin açarlar client-side, bu isə yalnız server-side olmalıdır.
//
// Auth: real istifadəçi tələb olunur (requireUser).
// Cavab: { isPro, planType, status, expiresAt, productId, willRenew }
// ============================================================
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireUser } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ENTITLEMENT_ID = 'Anacan LLC Pro';

interface RCSubscription {
  expires_date: string | null;
  period_type?: 'normal' | 'trial' | 'intro';
  unsubscribe_detected_at?: string | null;
  billing_issues_detected_at?: string | null;
}

interface RCSubscriberResponse {
  subscriber?: {
    entitlements?: Record<string, { expires_date: string | null; product_identifier: string }>;
    subscriptions?: Record<string, RCSubscription>;
  };
}

interface RCFetchResult {
  data: RCSubscriberResponse | null;
  // Diaqnostika üçün — DİQQƏT: heç vaxt açarın özünü daşımır, yalnız
  // "niyə uğursuz oldu" məlumatını. Müvəqqəti debug sonra silinəcək.
  debugReason?: 'no_secret_key' | 'rc_api_error';
  debugStatus?: number;
  debugDetail?: string;
}

async function fetchRevenueCatSubscriber(appUserId: string): Promise<RCFetchResult> {
  const secretKey = Deno.env.get('REVENUECAT_SECRET_API_KEY');
  if (!secretKey) {
    console.error('[sync-revenuecat-entitlement] REVENUECAT_SECRET_API_KEY not configured');
    return { data: null, debugReason: 'no_secret_key' };
  }
  const resp = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!resp.ok) {
    const bodyText = await resp.text();
    console.error('[sync-revenuecat-entitlement] RC API error:', resp.status, bodyText);
    return { data: null, debugReason: 'rc_api_error', debugStatus: resp.status, debugDetail: bodyText.slice(0, 300) };
  }
  return { data: await resp.json() };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const rcResult = await fetchRevenueCatSubscriber(userId);
    if (!rcResult.data) {
      // RC əlçatan deyil (açar yoxdur / şəbəkə xətası) — mövcud DB vəziyyətinə
      // toxunmuruq (yanlış "expired" yazmaqdansa heç nə etməmək daha təhlükəsizdir).
      return json({
        error: 'revenuecat_unavailable',
        reason: rcResult.debugReason,
        rcStatus: rcResult.debugStatus,
        rcDetail: rcResult.debugDetail,
      }, 503);
    }
    const rc = rcResult.data;

    const entitlement = rc.subscriber?.entitlements?.[ENTITLEMENT_ID];
    const now = Date.now();
    const isPro = !!entitlement && (!entitlement.expires_date || new Date(entitlement.expires_date).getTime() > now);

    const productId = entitlement?.product_identifier || null;
    const sub = productId ? rc.subscriber?.subscriptions?.[productId] : undefined;
    const willRenew = isPro ? !sub?.unsubscribe_detected_at : false;
    const periodType = (sub?.period_type || null); // 'normal' | 'trial' | 'intro' | null
    const expiresAt = entitlement?.expires_date || null;

    const planType = productId?.includes('yearly') || productId?.includes('annual') || productId?.includes('lifetime')
      ? 'premium_plus'
      : 'premium';
    const status = !isPro ? 'expired' : willRenew === false ? 'cancelled' : 'active';

    const expiresAtIso = expiresAt
      ? new Date(expiresAt).toISOString()
      : (() => {
          // Real ödəniş amma expires_date yoxdur (məs. lifetime) — uzaq gələcək.
          const d = new Date();
          d.setFullYear(d.getFullYear() + 100);
          return d.toISOString();
        })();

    const { error: subError } = await admin.from('subscriptions').upsert({
      user_id: userId,
      plan_type: isPro ? planType : 'free',
      status,
      started_at: new Date().toISOString(),
      expires_at: isPro ? expiresAtIso : null,
    }, { onConflict: 'user_id' });
    if (subError) console.error('[sync-revenuecat-entitlement] subscriptions upsert error:', subError);

    const { error: profileError } = await admin.from('profiles').update({
      is_premium: isPro,
      premium_until: isPro ? expiresAtIso : null,
    }).eq('user_id', userId);
    if (profileError) console.error('[sync-revenuecat-entitlement] profiles update error:', profileError);

    // Referral: YALNIZ burada, RC-nin öz REST API-sindən müstəqil təsdiqləndikdən
    // sonra — klient artıq 'converted' göndərə bilmir (bax Duzelis33.sql).
    if (isPro && periodType === 'normal') {
      const { error: refError } = await admin.rpc('confirm_referral_conversion', {
        p_referred_user_id: userId,
      });
      if (refError) console.log('[sync-revenuecat-entitlement] referral confirm skipped:', refError.message);
    }

    return json({
      isPro,
      planType: isPro ? planType : 'free',
      status,
      expiresAt: isPro ? expiresAtIso : null,
      productId,
      willRenew,
      periodType,
    });
  } catch (err) {
    console.error('[sync-revenuecat-entitlement] error:', err);
    return json({ error: (err as Error).message }, 500);
  }
});
