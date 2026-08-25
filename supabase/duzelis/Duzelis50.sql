-- Duzelis50.sql — Push bildirişləri (database-driven): CRON_SECRET-in QƏTİ düzəlişi
--
-- TARİXÇƏ (niyə bu, "3-cü cəhd"dir):
--   Duzelis33.sql   → 3 cron job "__CRON_SECRET__" yer-tutucusu ilə yaradıldı,
--                      əvəz edilməli idi, amma edilmədi.
--   Duzelis39.sql   → "TƏCİLİ DÜZƏLİŞ" adı ilə eyni 3 job-u yenidən yazdı, YENƏ
--                      "__CRON_SECRET__" yer-tutucusu ilə (istifadəçi özü əvəz
--                      etməli idi) — görünür bu addım ya keçirilməyib, ya da
--                      səhv icra olunub, çünki problem indi də davam edir.
--   Duzelis44.sql   → 4-cü job (expire-partner-links) əlavə edərkən EYNİ
--                      "unudulan yer-tutucu" modeli təkrarlandı.
--
--   Nəticə: "database-driven" bildirişlər (Günlük/Flow/Vitamin xatırlatmaları)
--   cron tərəfindən çağırılanda edge function 401 (Unauthorized) ilə rədd edir
--   və HEÇ bir bildiriş getmir — səssizcə. "Statik" bildirişlər (like/şərh/mesaj)
--   isə İSTİFADƏÇİNİN öz sessiyası ilə işlədiyi üçün (CRON_SECRET-dən asılı
--   deyil) normal işləyir — məhz bildirdiyiniz fərq budur.
--
-- BU DƏFƏ FƏRQİ: aşağıdakı yoxlama BLOKU bu SQL-i "__CRON_SECRET__" yer-
-- tutucusu ilə (yəni əvəz etmədən) işə salmağa İCAZƏ VERMİR — səhv XƏTA ilə
-- açıq-aşkar dayanacaq, əvvəlki kimi səssizcə "uğurla" keçib içəridə sınmayacaq.
--
-- ─────────────────────────────────────────────────────────────
-- ADDIMLAR (bu faylı işə salmazdan ƏVVƏL):
-- 1. Supabase Dashboard → Edge Functions → Secrets → "CRON_SECRET" sətrini tapın.
--    - Yoxdursa: güclü təsadüfi dəyər yaradın (məs. terminalda: openssl rand -hex 32)
--      və "CRON_SECRET" adı ilə ELƏ ORADA (Secrets bölməsində) əlavə edin.
--    - Varsa: mövcud dəyəri kopyalayın (YENİ dəyər YARATMAYIN — mövcud olanı
--      dəyişsəniz, artıq işləyən HƏR YERİ pozarsınız).
-- 2. Bu redaktorda "Find & Replace ALL" (bütün faylda) ilə HƏR YERDƏ keçən
--    __CRON_SECRET__ mətnini məhz həmin dəyərlə əvəz edin (aşağıda 5 dəfə keçir:
--    1 yoxlama blokunda + 4 cron job-un hər birində — hamısı EYNİ dəyər olmalıdır).
-- 3. Bu faylı Supabase SQL Editor-də işə salın.
-- 4. Faylın sonundakı yoxlama sorğusunu ayrıca işlədib təsdiqləyin.
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF '__CRON_SECRET__' = '__CRON_SECRET__' THEN
    RAISE EXCEPTION 'DAYANDIRILDI: "__CRON_SECRET__" yer-tutucusu hələ REAL dəyərlə əvəz olunmayıb. Bu faylı Supabase SQL Editor-a yapışdırmazdan əvvəl HƏR YERDƏ (bu yoxlama daxil, cəmi 5 yerdə) "__CRON_SECRET__" mətnini Supabase Dashboard → Edge Functions → Secrets bölməsindəki əsl CRON_SECRET dəyəri ilə əvəz edin.';
  END IF;
END $$;

-- 1) send-daily-notifications — gündəlik hamiləlik/mommy məzmunu + admin "Günlük" tabındakı
--    scheduled_notifications sətirləri (Bakı ~09:00,10:00,14:00,15:00,19:00)
SELECT cron.schedule(
  'send-daily-notifications-slots-secure',
  '0 5,6,10,11,15 * * *',
  $c$
  SELECT net.http_post(
    url:='https://tntbjulojatnrqmylorp.supabase.co/functions/v1/send-daily-notifications',
    headers:='{"Content-Type": "application/json", "x-cron-secret": "__CRON_SECRET__"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $c$
);

-- 2) send-flow-reminders — Flow (dövriyyə) istifadəçilərinin öz qurduğu xatırlatmalar
SELECT cron.schedule(
  'send-flow-reminders-every-hour-secure',
  '0 5,6,7,8,9,10,11,12,13,14,15,16,17 * * *',
  $c$
  SELECT net.http_post(
    url:='https://tntbjulojatnrqmylorp.supabase.co/functions/v1/send-flow-reminders',
    headers:='{"Content-Type": "application/json", "x-cron-secret": "__CRON_SECRET__"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $c$
);

-- 3) send-vitamin-reminders — istifadəçilərin qurduğu vitamin qəbulu xatırlatmaları
SELECT cron.schedule(
  'send-vitamin-reminders-every-5min-secure',
  '*/5 * * * *',
  $c$
  SELECT net.http_post(
    url:='https://tntbjulojatnrqmylorp.supabase.co/functions/v1/send-vitamin-reminders',
    headers:='{"Content-Type": "application/json", "x-cron-secret": "__CRON_SECRET__"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $c$
);

-- 4) expire-partner-links — premium bitmiş partnyor bağlantılarının gündəlik təmizlənməsi
SELECT cron.schedule(
  'expire-partner-links-daily-secure',
  '0 5 * * *',
  $c$
  SELECT net.http_post(
    url:='https://tntbjulojatnrqmylorp.supabase.co/functions/v1/expire-partner-links',
    headers:='{"Content-Type": "application/json", "x-cron-secret": "__CRON_SECRET__"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $c$
);

-- ─────────────────────────────────────────────────────────────
-- YOXLAMA — bu SQL-i AYRICA işlədin (yuxarıdakı bloklardan sonra):
--
--   SELECT jobid, jobname, schedule, command FROM cron.job
--   WHERE jobname LIKE '%-secure' ORDER BY jobname;
--
-- "command" sütununda "__CRON_SECRET__" YOX, sizin əsl gizli dəyəriniz
-- görünməlidir. Əgər hələ "__CRON_SECRET__" görürsünüzsə, yuxarıdakı DO $$
-- bloku sizi artıq dayandırmış olmalı idi — deməli bu faylı SQL Editor-a
-- yapışdırmazdan əvvəl əvəzləmə addımını buraxmısınız.
--
-- Bir neçə saat sonra real göndərişləri təsdiqləmək üçün:
--   SELECT function_name, started_at, sent_count, failed_count, skipped_count
--   FROM public.notification_run_log
--   ORDER BY started_at DESC LIMIT 20;
-- (sent_count/failed_count > 0 olan sətirlər görünürsə, cron artıq həqiqətən
--  edge function-a çatır — 401 mərhələsini keçib.)
-- ─────────────────────────────────────────────────────────────
