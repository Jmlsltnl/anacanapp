-- Duzelis39: TƏCİLİ DÜZƏLİŞ — Duzelis33.sql '__CRON_SECRET__' yer-tutucusu
-- ƏVƏZLƏNMƏDƏN işlədilib. Nəticədə 3 cron job (gündəlik bildirişlər, flow
-- xatırlatmaları, vitamin xatırlatmaları) hazırda HƏR DƏFƏ işə düşəndə
-- edge function tərəfindən 401 (Unauthorized) ilə rədd olunur — istifadəçilərə
-- HEÇ bir bildiriş getmir, səssiz şəkildə.
--
-- Bu fayl həmin 3 cron job-u YENİDƏN planlaşdırır (pg_cron eyni job adı ilə
-- schedule() çağırıldıqda mövcud tərifi ƏVƏZLƏYİR — əlavə/dublikat job
-- yaratmır). Idempotent — safe to re-run.
--
-- !!! MÜTLƏQ ADDIM (bu faylı işlətməzdən ƏVVƏL): aşağıda 3 yerdə keçən
-- '__CRON_SECRET__' sətrini REAL bir gizli dəyərlə əvəzlə. Məsləhət olaraq
-- təhlükəsiz təsadüfi dəyər:
--
--   z-bKLs4Vj5-JrH6vHhBkVRlJks46ATkql-6GPCS9M6c
--
-- (istəsən özün fərqli bir dəyər də seçə bilərsən — vacib olan HƏR YERDƏ
-- EYNİ dəyərin işlənməsidir). Bu dəyəri:
--   1) Aşağıdakı 3 yerdə '__CRON_SECRET__' yerinə yaz,
--   2) Supabase Dashboard → Edge Functions → Secrets-də CRON_SECRET adlı
--      secret kimi ELƏ EYNİ dəyərlə əlavə et (və ya mövcud CRON_SECRET-i
--      bu dəyərlə YENİLƏ, əgər fərqli bir dəyər saxlamaq istəyirsənsə —
--      onda ORADAKI dəyəri buraya köçür, əksinə deyil).
-- Yalnız bundan sonra bu SQL-i Supabase SQL Editor-da işə sal.

SELECT cron.schedule(
  'send-daily-notifications-slots-secure',
  '0 5,6,10,11,15 * * *',
  $$
  SELECT net.http_post(
    url:='https://tntbjulojatnrqmylorp.supabase.co/functions/v1/send-daily-notifications',
    headers:='{"Content-Type": "application/json", "x-cron-secret": "__CRON_SECRET__"}'::jsonb,
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
    headers:='{"Content-Type": "application/json", "x-cron-secret": "__CRON_SECRET__"}'::jsonb,
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
    headers:='{"Content-Type": "application/json", "x-cron-secret": "__CRON_SECRET__"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- Yoxlama (bu faylı işlətdikdən sonra): job-ların REAL secret-lə düzgün
-- qeydə alındığını görmək üçün:
--   SELECT jobid, jobname, schedule, command FROM cron.job
--   WHERE jobname LIKE '%-secure';
-- "command" sütununda "__CRON_SECRET__" YOX, öz real dəyərin görünməlidir.
