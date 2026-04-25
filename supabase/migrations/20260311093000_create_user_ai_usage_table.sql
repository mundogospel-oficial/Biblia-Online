-- Cria a tabela oficial de uso de IA para o scanner reconhecer
CREATE TABLE IF NOT EXISTS public.user_ai_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  tipo_uso text DEFAULT 'chat',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativa a segurança (RLS) na tabela
ALTER TABLE public.user_ai_usage ENABLE ROW LEVEL SECURITY;

-- Cria as políticas de segurança
DROP POLICY IF EXISTS "Usuários veem apenas seus usos" ON public.user_ai_usage;
CREATE POLICY "Usuários veem apenas seus usos" 
ON public.user_ai_usage FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários inserem seus próprios usos" ON public.user_ai_usage;
CREATE POLICY "Usuários inserem seus próprios usos" 
ON public.user_ai_usage FOR INSERT 
WITH CHECK (auth.uid() = user_id);
