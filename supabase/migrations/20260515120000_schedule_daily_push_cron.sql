-- Schedule send-daily-notifications at 09:00 and 14:00 Baku (UTC+4)
-- 09:00 Baku = 05:00 UTC | 14:00 Baku = 10:00 UTC
-- Edge function tolerates ±15 min around each slot.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-notifications-0900-baku') THEN
    PERFORM cron.unschedule('send-daily-notifications-0900-baku');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-notifications-1400-baku') THEN
    PERFORM cron.unschedule('send-daily-notifications-1400-baku');
  END IF;
END $$;

SELECT cron.schedule(
  'send-daily-notifications-0900-baku',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url:='https://tntbjulojatnrqmylorp.supabase.co/functions/v1/send-daily-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRudGJqdWxvamF0bnJxbXlsb3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzYyOTksImV4cCI6MjA4NDQxMjI5OX0.uwaOZsWTw8GBUg6s9GqmbA3EluGf44PmGdUI80RhGNU"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'send-daily-notifications-1400-baku',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url:='https://tntbjulojatnrqmylorp.supabase.co/functions/v1/send-daily-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRudGJqdWxvamF0bnJxbXlsb3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzYyOTksImV4cCI6MjA4NDQxMjI5OX0.uwaOZsWTw8GBUg6s9GqmbA3EluGf44PmGdUI80RhGNU"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
