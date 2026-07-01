-- ====================================================================
-- SCRIPT SQL - DESATIVAR SISTEMA ANTIGO DE NOTIFICAÇÕES (PUSH SUBSCRIPTION)
-- ====================================================================
-- Este script limpa e desativa de forma segura o sistema antigo de Push
-- baseado em VAPID / assinaturas nativas do navegador.
--
-- Como executar: Execute este script no SQL Editor do seu console Supabase.

-- 1. Limpa todas as assinaturas push antigas da tabela de perfis (profiles)
-- Isso garante que qualquer envio residual ou cron antigo não envie mais nada.
UPDATE public.profiles 
SET push_subscription = NULL 
WHERE push_subscription IS NOT NULL;

-- 2. Se houver algum gatilho (trigger) ou função legada vinculada a notificações push, remova-os de forma segura
DROP TRIGGER IF EXISTS trigger_send_push_notification ON public.profiles;
DROP FUNCTION IF EXISTS public.send_push_notification();

-- 3. Opcional: Se quiser remover completamente a coluna push_subscription do seu banco de dados,
-- desinale as duas linhas abaixo e execute o script:
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS push_subscription;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_active_at;

-- Mensagem de confirmação de desativação do sistema antigo
DO $$
BEGIN
  RAISE NOTICE 'Antigo sistema de Push Notifications desativado com sucesso!';
END $$;
