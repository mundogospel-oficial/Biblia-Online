-- ====================================================================
-- SCRIPT SQL DE REPARO E CONFIGURAÇÃO DA TABELA PROFILES NO SUPABASE
-- Execute este script no SQL Editor do seu painel do Supabase
-- ====================================================================

-- 1. Cria a tabela 'profiles' se ela não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Adiciona todas as colunas necessárias caso a tabela já existisse sem elas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Garante que o username seja único (caso ainda não seja)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 4. Habilita RLS (Row Level Security) na tabela
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Remove políticas antigas se existirem para evitar conflitos
DROP POLICY IF EXISTS "Perfis são visíveis por todos" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem deletar seu próprio perfil" ON public.profiles;

-- 6. Cria Políticas RLS seguras e funcionais
CREATE POLICY "Perfis são visíveis por todos" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Usuários podem inserir seu próprio perfil" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem deletar seu próprio perfil" 
  ON public.profiles 
  FOR DELETE 
  USING (auth.uid() = id);

-- 7. Função Trigger para criar o perfil automaticamente quando um usuário se cadastrar em auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username, avatar_url, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'user_name',
      NEW.raw_user_meta_data->>'preferred_username',
      'user_' || SUBSTRING(NEW.id::text FROM 1 FOR 8)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-cria a trigger na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Preenche perfis de usuários pré-existentes que ainda não possuam registro na tabela profiles
INSERT INTO public.profiles (id, display_name, username, avatar_url, updated_at)
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    SPLIT_PART(u.email, '@', 1)
  ) AS display_name,
  COALESCE(
    u.raw_user_meta_data->>'username',
    u.raw_user_meta_data->>'user_name',
    u.raw_user_meta_data->>'preferred_username',
    'user_' || SUBSTRING(u.id::text FROM 1 FOR 8)
  ) AS username,
  COALESCE(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture'
  ) AS avatar_url,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 9. Cria índice para busca e garantia de unicidade
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (LOWER(username)) WHERE username IS NOT NULL;
