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
-- BU FAYLDA: Duzelis39.sql-in özündə əvvəllər TÖVSİYƏ OLUNMUŞ (amma heç bir
-- cron job-a köçürülməmiş) dəyər artıq aşağıda BÜTÜN 4 job-a birbaşa
-- yazılıb:  z-bKLs4Vj5-JrH6vHhBkVRlJks46ATkql-6GPCS9M6c
--
-- ⚠️ QALAN YEGANƏ ADDIM (bunu MƏN edə bilmirəm — Supabase Dashboard-a
-- girişim yoxdur): Supabase Dashboard → Edge Functions → Secrets bölməsinə
-- gedin və "CRON_SECRET" adlı secret-in dəyərinin DƏQİQ bu olduğunu
-- təsdiqləyin (və ya bu dəyərlə YARADIN/YENİLƏYİN):
--
--   z-bKLs4Vj5-JrH6vHhBkVRlJks46ATkql-6GPCS9M6c
--
-- Əgər orada ARTIQ FƏRQLİ bir CRON_SECRET dəyəri varsa və onu saxlamaq
-- istəyirsinizsə, ƏVƏZİNƏ bu faylda AŞAĞIDAKI 4 "x-cron-secret" sətrini
-- (find & replace all) öz mövcud dəyərinizlə əvəz edin — vacib olan
-- YALNIZ bu fayldakı dəyər ilə Dashboard-dakı CRON_SECRET-in EYNİ olmasıdır.
--
-- Bunu təsdiqlədikdən/etdikdən sonra bu SQL-i Supabase SQL Editor-də işə salın.
-- Idempotentdir (təkrar işlətmək təhlükəsizdir — pg_cron eyni ad üzrə mövcud
-- planı əvəzləyir, yeni/dublikat job yaratmır).

-- 1) send-daily-notifications — gündəlik hamiləlik/mommy məzmunu + admin "Günlük" tabındakı
--    scheduled_notifications sətirləri (Bakı ~09:00,10:00,14:00,15:00,19:00)
SELECT cron.schedule(
  'send-daily-notifications-slots-secure',
  '0 5,6,10,11,15 * * *',
  $c$
  SELECT net.http_post(
    url:='https://tntbjulojatnrqmylorp.supabase.co/functions/v1/send-daily-notifications',
    headers:='{"Content-Type": "application/json", "x-cron-secret": "z-bKLs4Vj5-JrH6vHhBkVRlJks46ATkql-6GPCS9M6c"}'::jsonb,
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
    headers:='{"Content-Type": "application/json", "x-cron-secret": "z-bKLs4Vj5-JrH6vHhBkVRlJks46ATkql-6GPCS9M6c"}'::jsonb,
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
    headers:='{"Content-Type": "application/json", "x-cron-secret": "z-bKLs4Vj5-JrH6vHhBkVRlJks46ATkql-6GPCS9M6c"}'::jsonb,
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
    headers:='{"Content-Type": "application/json", "x-cron-secret": "z-bKLs4Vj5-JrH6vHhBkVRlJks46ATkql-6GPCS9M6c"}'::jsonb,
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
-- "command" sütununda "z-bKLs4Vj5-JrH6vHhBkVRlJks46ATkql-6GPCS9M6c" görünməlidir
-- (bu, artıq bu SQL-in özündə yazılıb — dəyişməyə ehtiyac yoxdur). Əsl
-- yoxlanmalı şey: Supabase Dashboard-dakı CRON_SECRET secret-i DƏQİQ bu
-- dəyərlə uyğun olmalıdır (yuxarıdakı qeydə bax).
--
-- Bir neçə saat sonra real göndərişləri təsdiqləmək üçün:
--   SELECT function_name, started_at, sent_count, failed_count, skipped_count
--   FROM public.notification_run_log
--   ORDER BY started_at DESC LIMIT 20;
-- (sent_count/failed_count > 0 olan sətirlər görünürsə, cron artıq həqiqətən
--  edge function-a çatır — 401 mərhələsini keçib.)
-- ─────────────────────────────────────────────────────────────
