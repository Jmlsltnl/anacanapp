
-- Create vault secret for service role key (used by cron to call edge functions)
DO $$
DECLARE
  v_secret_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'service_role_key') INTO v_secret_exists;
  IF NOT v_secret_exists THEN
    PERFORM vault.create_secret(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRudGJqdWxvamF0bnJxbXlsb3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzYyOTksImV4cCI6MjA4NDQxMjI5OX0.uwaOZsWTw8GBUg6s9GqmbA3EluGf44PmGdUI80RhGNU',
      'service_role_key',
      'Anon key used by cron jobs to authenticate with edge functions'
    );
  END IF;
END $$;
