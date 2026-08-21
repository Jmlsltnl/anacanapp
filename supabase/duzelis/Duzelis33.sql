-- ============================================================
-- Duzelis33: KRİTİK təhlükəsizlik düzəlişləri (audit tapıntıları)
--
-- 1) subscriptions cədvəli: istifadəçi özü UPDATE/INSERT edərək özünə
--    sonsuz Premium/Premium Plus verə bilirdi (20260611064529 bunu
--    yenidən açmışdı). İndi YENIDƏN admin/service-role-only edilir —
--    YALNIZ yeni sync-revenuecat-entitlement edge function (service-role
--    ilə) yaza bilər. Yeni istifadəçilər üçün default 'free' sətri artıq
--    klient-tərəfi insert əvəzinə profil yaradılanda avtomatik yaranır
--    (ensure_default_subscription trigger, ensure_default_user_role ilə
--    eyni sınanmış nümunə).
--
-- 2) Referral fraud: update_my_referral_status RPC klientin öz bəyanını
--    ('converted') yoxlamadan qəbul edirdi — istənilən istifadəçi dostuna
--    real alış olmadan +7 gün premium "hədiyyə" edə bilirdi. İndi
--    'converted' keçidi YALNIZ yeni confirm_referral_conversion()
--    (service-role-only, RevenueCat-ın öz REST API-sindən real yoxlamadan
--    sonra sync-revenuecat-entitlement tərəfindən çağırılır) vasitəsilə
--    baş verə bilər. _grant_premium_days də (əvvəllər PUBLIC-dən
--    çağırıla bilən) sərtləşdirilir.
--
-- 3) Cron auth: pg_cron işləri (send-daily-notifications/send-flow-reminders/
--    send-vitamin-reminders) HƏR TƏTBİQ QURULUŞUNDA olan public anon key-i
--    "cron sirri" kimi göndərirdi — bu key .env-də və hər build-də mövcud
--    olduğu üçün ISTƏNILƏN İSTİFADƏÇİ bütün istifadəçi bazasına təkrar
--    mass-bildiriş göndərə bilərdi. İndi yeganə etibarlı yol x-cron-secret
--    başlığıdır (bax _shared/auth.ts kod dəyişikliyi).
--    !!! DİQQƏT: Bu migrasiyanı tətbiq etdikdən sonra Supabase Edge Function
--    Secrets-də CRON_SECRET = 45d1febf0ad52a5bd764e24afa46051f477b1be1ac77305f3be9265f91e57ae1
--    olaraq TƏYİN EDİLMƏLİDİR, əks halda planlaşdırılan push-lar 401 ilə
--    uğursuz olacaq (supabase secrets set CRON_SECRET=... və ya Dashboard →
--    Edge Functions → Secrets).
--
-- Idempotent — safe to re-run.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1) SUBSCRIPTIONS: yalnız admin/service-role yaza bilər
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
REVOKE INSERT, UPDATE ON public.subscriptions FROM authenticated;
-- SELECT hələ də "Users can view their own subscription" (ilkin migrasiya) +
-- "Admins can manage subscriptions" (FOR ALL, admin) vasitəsilə işləyir —
-- toxunulmur, istifadəçi öz sətrini oxumağa davam edir.

-- Yeni istifadəçi qeydiyyatdan keçəndə default 'free' sətri avtomatik yaransın
-- (klient-tərəfi "yoxdursa insert et" fallback-ına artıq ehtiyac yoxdur —
-- useSubscription.ts kодunda həmin fallback silinib).
CREATE OR REPLACE FUNCTION public.ensure_default_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.user_id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_default_subscription() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_ensure_default_subscription ON public.profiles;
CREATE TRIGGER trg_ensure_default_subscription
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_default_subscription();

-- Geriyə uyğunluq: mövcud profili olub subscriptions sətri olmayan istifadəçilər
-- üçün də default 'free' sətri yaradılsın (əvvəllər klient-tərəfi yaradılırdı,
-- odur ki əksəriyyətinin artıq var — bu sadəcə əskikləri tamamlayır).
INSERT INTO public.subscriptions (user_id, plan_type, status)
SELECT p.user_id, 'free', 'active'
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.user_id
WHERE s.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 2) REFERRAL FRAUD: 'converted' keçidi server-tərəfi təsdiqsiz mümkün olmasın
-- ────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public._grant_premium_days(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._grant_premium_days(UUID, INTEGER) TO service_role;

-- Yeni: yalnız service-role çağıra bilər (sync-revenuecat-entitlement edge
-- function RevenueCat-ın öz REST API-sindən real "NORMAL" (ödənişli, trial
-- deyil) entitlement-i təsdiqlədikdən SONRA çağırır).
CREATE OR REPLACE FUNCTION public.confirm_referral_conversion(p_referred_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref RECORD;
BEGIN
  SELECT * INTO v_ref FROM public.referrals WHERE referred_user_id = p_referred_user_id;
  IF v_ref IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_referral');
  END IF;

  IF v_ref.referrer_rewarded_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'status', 'converted', 'already_rewarded', true);
  END IF;

  UPDATE public.referrals
  SET status = 'converted',
      converted_at = COALESCE(converted_at, now()),
      referrer_rewarded_at = now()
  WHERE id = v_ref.id;

  PERFORM public._grant_premium_days(v_ref.referrer_user_id, v_ref.reward_days);

  RETURN jsonb_build_object('success', true, 'status', 'converted', 'referrer_rewarded', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_referral_conversion(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_referral_conversion(UUID) TO service_role;

-- Klientə açıq RPC-də 'converted' bloklanır — 'trial' hələ də sərbəst qalır
-- (mükafatsız, sadəcə status göstəricisidir, sui-istifadə riski yoxdur).
CREATE OR REPLACE FUNCTION public.update_my_referral_status(p_state TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_state <> 'trial' THEN
    -- 'converted' artıq klientdən qəbul edilmir — yalnız server-side
    -- confirm_referral_conversion() (RevenueCat REST API təsdiqindən sonra).
    RETURN jsonb_build_object('success', false, 'error', 'server_verification_required');
  END IF;

  SELECT * INTO v_ref FROM public.referrals WHERE referred_user_id = auth.uid();
  IF v_ref IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_referral');
  END IF;

  IF v_ref.status = 'registered' THEN
    UPDATE public.referrals
    SET status = 'trial', trial_started_at = COALESCE(trial_started_at, now())
    WHERE id = v_ref.id;
  END IF;
  RETURN jsonb_build_object('success', true, 'status', 'trial');
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 3) CRON AUTH: bütün planlaşdırılmış push job-larını x-cron-secret ilə
--    yenidən qur (anon key-lə işləyən bütün köhnə variantları ləğv et)
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-notifications-0900-baku') THEN
    PERFORM cron.unschedule('send-daily-notifications-0900-baku');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-notifications-1400-baku') THEN
    PERFORM cron.unschedule('send-daily-notifications-1400-baku');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-notifications-3x-daily') THEN
    PERFORM cron.unschedule('send-daily-notifications-3x-daily');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-notifications-morning') THEN
    PERFORM cron.unschedule('send-daily-notifications-morning');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-notifications-afternoon') THEN
    PERFORM cron.unschedule('send-daily-notifications-afternoon');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-notifications-slots') THEN
    PERFORM cron.unschedule('send-daily-notifications-slots');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-flow-reminders-every-hour') THEN
    PERFORM cron.unschedule('send-flow-reminders-every-hour');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-vitamin-reminders-every-5min') THEN
    PERFORM cron.unschedule('send-vitamin-reminders-every-5min');
  END IF;
END $$;

SELECT cron.schedule(
  'send-daily-notifications-slots-secure',
  '0 5,6,10,11,15 * * *',
  $$
  SELECT net.http_post(
    url:='https://tntbjulojatnrqmylorp.supabase.co/functions/v1/send-daily-notifications',
    headers:='{"Content-Type": "application/json", "x-cron-secret": "45d1febf0ad52a5bd764e24afa46051f477b1be1ac77305f3be9265f91e57ae1"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'send-flow-reminders-every-hour-secure',
  '0 5,6,7,8,9,10,11,12,13,14,15,16,17 * * *',
  $$
  SELECT net.http_post(
    url:='https://tntbjulojatnrqmylorp.supabase.co/functions/v1/send-flow-reminders',
    headers:='{"Content-Type": "application/json", "x-cron-secret": "45d1febf0ad52a5bd764e24afa46051f477b1be1ac77305f3be9265f91e57ae1"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'send-vitamin-reminders-every-5min-secure',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://tntbjulojatnrqmylorp.supabase.co/functions/v1/send-vitamin-reminders',
    headers:='{"Content-Type": "application/json", "x-cron-secret": "45d1febf0ad52a5bd764e24afa46051f477b1be1ac77305f3be9265f91e57ae1"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);
