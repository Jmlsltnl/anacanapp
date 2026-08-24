-- Duzelis44: expire-partner-links üçün pg_cron planı əlavə edilir
--
-- KOK SƏBƏB: `supabase/functions/expire-partner-links/index.ts` tam yazılıb
-- (premium müddəti bitmiş qadın+partnyor cütlüklərini ayırır, hər iki tərəfə
-- bildiriş göndərir) və artıq `requireCronSecret()` ilə düzgün qorunur - amma
-- bu funksiyanı işə salan HEÇ BİR `cron.schedule()` çağırışı repo-nun heç bir
-- yerində tapılmadı (yalnız `supabase/config.toml`-da qeydiyyatdan keçib, bu
-- isə onu YALNIZ "deploy edilə bilən funksiya" edir, "planlaşdırılıb" demək
-- deyil). Nəticədə: premium bitmiş partnyor bağlantıları heç vaxt avtomatik
-- ayrılmır (təhlükəsizlik riski deyil - sadəcə "paylaşım daha uzun davam
-- edir" effekti - amma "tam funksional" olmaq üçün düzəldilməlidir).
--
-- Günortadan əvvəl (Bakı 09:00 = UTC 05:00), gündə bir dəfə kifayətdir -
-- bu, real-vaxt təhlükə deyil, sadəcə təmizlik işidir.
--
-- !!! MÜTLƏQ ADDIM: aşağıda '__CRON_SECRET__' yerinə artıq Duzelis39.sql
-- ilə qurduğunuz REAL CRON_SECRET dəyərini yazın (Supabase Dashboard →
-- Edge Functions → Secrets-də CRON_SECRET adı ilə saxlanan dəyər - YENİ bir
-- dəyər YARATMAYIN, mövcud olanı buraya köçürün). Yalnız bundan sonra bu
-- SQL-i Supabase SQL Editor-da işə salın. İdempotentdir (təkrar işlətmək
-- təhlükəsizdir - pg_cron eyni ad üzrə mövcud planı əvəzləyir).

SELECT cron.schedule(
  'expire-partner-links-daily-secure',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url:='https://tntbjulojatnrqmylorp.supabase.co/functions/v1/expire-partner-links',
    headers:='{"Content-Type": "application/json", "x-cron-secret": "__CRON_SECRET__"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);
