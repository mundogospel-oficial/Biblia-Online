-- Cria a tabela oficial de entidades banidas (IPs/Fingerprints) de forma segura
CREATE TABLE IF NOT EXISTS public.banned_entities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  identity text UNIQUE NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativa Row Level Security (RLS)
ALTER TABLE public.banned_entities ENABLE ROW LEVEL SECURITY;

-- Como as entidades banidas são sensíveis e gerenciadas apenas pelo servidor backend (via admin SDK),
-- não criamos políticas públicas de SELECT, INSERT, UPDATE ou DELETE.
-- Dessa forma, apenas a Service Role Key tem acesso direto ao gerenciamento dessa tabela.
