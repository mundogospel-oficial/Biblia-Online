-- ====================================================================
-- SCRIPT SQL PARA SUPABASE - CONTROLE DE EXCLUSÃO DE CONTAS (30 DIAS)
-- ====================================================================
-- Este script faz o seguinte:
-- 1. Cria uma tabela para rastrear as contas excluídas e o momento da exclusão.
-- 2. Cria um gatilho (trigger) que registra automaticamente o e-mail quando o usuário é excluído da tabela `auth.users`.
-- 3. Cria um gatilho (trigger) de validação antes da inserção na tabela `auth.users`, impedindo novos registros com o mesmo e-mail antes de passarem 30 dias.

-- 1. Criar a tabela de contas excluídas
create table if not exists public.deleted_accounts (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  deleted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (opcional por segurança, nenhuma leitura pública é necessária)
alter table public.deleted_accounts enable row level security;

-- 2. Função e gatilho para registrar a exclusão
create or replace function public.on_auth_user_deleted()
returns trigger as $$
begin
  -- Registra ou atualiza o registro de e-mail excluído
  insert into public.deleted_accounts (email)
  values (old.email)
  on conflict (email) do update 
  set deleted_at = timezone('utc'::text, now());
  return old;
end;
$$ language plpgsql security definer;

-- Remover trigger antigo se existir para evitar erros de duplicidade
drop trigger if exists on_auth_user_deleted_trig on auth.users;

create trigger on_auth_user_deleted_trig
  before delete on auth.users
  for each row execute procedure public.on_auth_user_deleted();

-- 3. Função e gatilho para bloquear novos registros dentro de 30 dias
create or replace function public.check_new_user_registration()
returns trigger as $$
declare
  is_blocked boolean;
  days_remaining int;
  last_deletion timestamp with time zone;
begin
  -- Verifica se o e-mail está na lista de excluídos e se foi excluído há menos de 30 dias
  select exists (
    select 1 from public.deleted_accounts 
    where email = new.email 
    and deleted_at > timezone('utc'::text, now()) - interval '30 days'
  ) into is_blocked;

  if is_blocked then
    -- Busca a data exata da última exclusão
    select deleted_at from public.deleted_accounts 
    where email = new.email 
    into last_deletion;

    -- Calcula os dias restantes
    days_remaining := 30 - extract(day from (timezone('utc'::text, now()) - last_deletion))::int;

    if days_remaining is null or days_remaining < 1 then
      days_remaining := 1;
    end if;

    -- Lança um erro que impede o registro (Supabase retornará um erro 400 Bad Request com esta mensagem)
    raise exception 'Este e-mail está bloqueado. Você excluiu sua conta recentemente e precisa aguardar mais % dias para se registrar novamente.', days_remaining;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Remover trigger antigo se existir
drop trigger if exists on_auth_user_created_check on auth.users;

create trigger on_auth_user_created_check
  before insert on auth.users
  for each row execute procedure public.check_new_user_registration();
