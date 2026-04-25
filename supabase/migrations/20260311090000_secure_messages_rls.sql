-- Garante que o RLS está ativado na tabela messages (por precaução)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1. Cria a política de UPDATE (Editar): O usuário só edita a própria mensagem
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias mensagens" ON public.messages;
CREATE POLICY "Usuários podem atualizar suas próprias mensagens" 
ON public.messages 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- 2. Cria a política de DELETE (Apagar): O usuário só apaga a própria mensagem
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias mensagens" ON public.messages;
CREATE POLICY "Usuários podem deletar suas próprias mensagens" 
ON public.messages 
FOR DELETE 
TO authenticated 
USING (auth.uid() = sender_id);
