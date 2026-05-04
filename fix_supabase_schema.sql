-- 1. Criação das novas colunas para o sistema unificado de cotas na tabela 'user_ai_usage'
ALTER TABLE public.user_ai_usage 
ADD COLUMN IF NOT EXISTS simple_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS complex_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reset_time timestamp with time zone DEFAULT now();

-- Permitir que tipo_uso seja nulo, já que não é mais o foco, ou garantir um valor default
ALTER TABLE public.user_ai_usage ALTER COLUMN tipo_uso DROP NOT NULL;

-- 2. Atualização das Políticas de Segurança RLS (Row Level Security) para 'user_ai_usage'
ALTER TABLE public.user_ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own usage" ON public.user_ai_usage;
CREATE POLICY "Users can insert their own usage" 
ON public.user_ai_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own usage" ON public.user_ai_usage;
CREATE POLICY "Users can update their own usage" 
ON public.user_ai_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can select their own usage" ON public.user_ai_usage;
CREATE POLICY "Users can select their own usage" 
ON public.user_ai_usage 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own usage" ON public.user_ai_usage;
CREATE POLICY "Users can delete their own usage" 
ON public.user_ai_usage 
FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Correção de Segurança: Remover permissão pública de funções SECURITY DEFINER vulneráveis
-- Isso resolve os avisos de segurança: "Public / Signed-In Users Can Execute SECURITY DEFINER Function"
REVOKE EXECUTE ON FUNCTION public.check_and_increment_ai_quota(integer) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_ai_quota(uuid, integer) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_uso_ia_atomico(uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_uso_ia_atomico(uuid, text, integer) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_uso_ia_seguro(integer) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_likes_count() FROM public, anon, authenticated;

-- (Opcional) Recalcular o cache de esquema do Supabase (PGRST 204/116)
NOTIFY pgrst, 'reload schema';
