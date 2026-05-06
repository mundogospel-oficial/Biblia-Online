-- SCRIPT DE SEGURANÇA: POLÍTICAS RLS (Row Level Security)
-- Este script habilita RLS e define políticas robustas para todas as tabelas.

--------------------------------------------------------------------------------
-- 1. TABELA: profiles
--------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis são visíveis publicamente" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
  ON public.profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

--------------------------------------------------------------------------------
-- 2. TABELA: posts
--------------------------------------------------------------------------------
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts são visíveis publicamente" 
  ON public.posts FOR SELECT 
  USING (true);

CREATE POLICY "Usuários autenticados podem criar posts" 
  ON public.posts FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar/excluir seus próprios posts" 
  ON public.posts FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 3. TABELA: post_likes
--------------------------------------------------------------------------------
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes são visíveis publicamente" 
  ON public.post_likes FOR SELECT 
  USING (true);

CREATE POLICY "Usuários autenticados podem dar like" 
  ON public.post_likes FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover seu próprio like" 
  ON public.post_likes FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 4. TABELA: post_comments
--------------------------------------------------------------------------------
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentários são visíveis publicamente" 
  ON public.post_comments FOR SELECT 
  USING (true);

CREATE POLICY "Usuários autenticados podem comentar" 
  ON public.post_comments FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar/excluir seus próprios comentários" 
  ON public.post_comments FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 5. TABELA: stories
--------------------------------------------------------------------------------
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories são visíveis publicamente" 
  ON public.stories FOR SELECT 
  USING (true);

CREATE POLICY "Usuários autenticados podem criar stories" 
  ON public.stories FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios stories" 
  ON public.stories FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 6. TABELA: messages
--------------------------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver mensagens enviadas ou recebidas" 
  ON public.messages FOR SELECT 
  TO authenticated 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Usuários podem enviar mensagens" 
  ON public.messages FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = sender_id);

--------------------------------------------------------------------------------
-- 7. TABELA: user_ai_usage
--------------------------------------------------------------------------------
ALTER TABLE public.user_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio uso" 
  ON public.user_ai_usage FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Inserção via RPC (Security Definer) ou direta
CREATE POLICY "Usuários podem registrar seu próprio uso" 
  ON public.user_ai_usage FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 8. STORAGE: media bucket
--------------------------------------------------------------------------------
-- Garante que o bucket 'media' esteja seguro
CREATE POLICY "Apenas usuários autenticados podem fazer upload" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "Acesso público de leitura ao bucket media" 
  ON storage.objects FOR SELECT 
  TO public 
  USING (bucket_id = 'media');

CREATE POLICY "Usuários podem excluir seus próprios arquivos" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'media' AND auth.uid() = owner);
