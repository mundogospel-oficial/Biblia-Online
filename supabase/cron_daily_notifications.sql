-- ==============================================================================
-- SUPABASE CRON: NOTIFICAÇÕES DIÁRIAS (VERSÍCULO DO DIA E DA NOITE)
-- Executa com o aplicativo 100% fechado, enviando Web Push via OneSignal
-- ==============================================================================

-- 1. Habilita as extensões nativas do Supabase para agendamento (cron) e requisições HTTP (net)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Concede permissões para o schema cron ao usuário de serviço
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- 3. Remove agendamentos antigos para evitar duplicações caso re-executado
DO $$
BEGIN
  PERFORM cron.unschedule('daily-verse-morning');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('daily-verse-evening');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ==============================================================================
-- 4. AGENDAMENTO DOS CRON JOBS
--
-- Horários calculados em UTC:
-- • Manhã: 08:00 Horário de Brasília (BRT / UTC-3) = 11:00 UTC
-- • Noite: 20:00 Horário de Brasília (BRT / UTC-3) = 23:00 UTC
-- ==============================================================================

-- Disparo Matinal: 08:00 BRT (11:00 UTC) todos os dias
SELECT cron.schedule(
  'daily-verse-morning',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uhsmgsghktvmfvewmnml.supabase.co/functions/v1/daily-verse-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'slot', 'morning'
    )
  );
  $$
);

-- Disparo Noturno: 20:00 BRT (23:00 UTC) todos os dias
SELECT cron.schedule(
  'daily-verse-evening',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uhsmgsghktvmfvewmnml.supabase.co/functions/v1/daily-verse-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'slot', 'evening'
    )
  );
  $$
);

-- ==============================================================================
-- 5. COMO TESTAR O DISPARO IMEDIATAMENTE (SEM ESPERAR O HORÁRIO):
--
-- Para testar agora mesmo e ver a notificação chegar no celular/computador:
-- Execute o comando abaixo no SQL Editor do Supabase:
--
-- SELECT net.http_post(
--   url := 'https://uhsmgsghktvmfvewmnml.supabase.co/functions/v1/daily-verse-push',
--   headers := jsonb_build_object('Content-Type', 'application/json'),
--   body := jsonb_build_object('slot', 'morning')
-- );
--
-- Para verificar os cron jobs ativos no seu banco:
-- SELECT * FROM cron.job;
--
-- Para verificar o histórico de execuções dos jobs:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
-- ==============================================================================
