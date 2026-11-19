-- Alvorecer: cada pessoa só enxerga e altera os próprios dados (RLS)
create table if not exists public.arquivos (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  path text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, path)
);
alter table public.arquivos enable row level security;
grant select, insert, update, delete on public.arquivos to authenticated;
drop policy if exists "ler os meus" on public.arquivos;
drop policy if exists "criar os meus" on public.arquivos;
drop policy if exists "alterar os meus" on public.arquivos;
drop policy if exists "apagar os meus" on public.arquivos;
create policy "ler os meus" on public.arquivos for select to authenticated using (user_id = (select auth.uid()));
create policy "criar os meus" on public.arquivos for insert to authenticated with check (user_id = (select auth.uid()));
create policy "alterar os meus" on public.arquivos for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "apagar os meus" on public.arquivos for delete to authenticated using (user_id = (select auth.uid()));

-- Excluir a própria conta (apaga dados e o login)
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.arquivos where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end; $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
-- IAlvorecer: avaliações, erros e mensagens para a criadora (qualquer pessoa envia; só a criadora lê pelo painel)
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid default auth.uid(),
  tipo text not null check (tipo in ('avaliacao','erro','contato')),
  nota int check (nota between 1 and 5),
  mensagem text check (char_length(mensagem) <= 4000),
  email text check (char_length(email) <= 200),
  pagina text check (char_length(pagina) <= 200),
  enviado boolean not null default false
);
alter table public.feedback enable row level security;
grant insert on public.feedback to anon, authenticated;
drop policy if exists "qualquer pessoa envia" on public.feedback;
create policy "qualquer pessoa envia" on public.feedback for insert to anon, authenticated with check (enviado = false);
-- IAlvorecer: economia de IA
-- 1) limite diário por pessoa (só o servidor mexe)
create table if not exists public.uso_ia (user_id uuid not null, dia date not null, n int not null default 0, primary key (user_id, dia));
alter table public.uso_ia enable row level security;
create or replace function public.contar_uso_ia(uid uuid, d date) returns int
language sql security definer set search_path = '' as $$
  insert into public.uso_ia (user_id, dia, n) values (uid, d, 1)
  on conflict (user_id, dia) do update set n = public.uso_ia.n + 1
  returning n;
$$;
revoke all on function public.contar_uso_ia(uuid, date) from public, anon, authenticated;
-- 2) aulas prontas compartilhadas (cada aula de curso é criada uma vez e serve para todos)
create table if not exists public.licoes_publicas (chave text primary key, resposta text not null, criado timestamptz not null default now());
alter table public.licoes_publicas enable row level security;

-- uso por pessoa (lido pelo site)
create or replace function public.meu_uso_ia() returns int language sql security definer set search_path = '' stable as $$ select coalesce((select n from public.uso_ia where user_id = auth.uid() and dia = (now() at time zone 'America/Sao_Paulo')::date), 0); $$;
revoke all on function public.meu_uso_ia() from public, anon;
grant execute on function public.meu_uso_ia() to authenticated;
grant execute on function public.contar_uso_ia(uuid, date) to service_role;
grant all on public.uso_ia, public.licoes_publicas, public.arquivos, public.feedback to service_role;

-- Aviso de conta nova: cada cadastro entra nesta lista e o robô de e-mails avisa a Emilly
create table if not exists public.novas_contas (
  id bigserial primary key, user_id uuid, email text,
  criado timestamptz default now(), avisado boolean default false
);
alter table public.novas_contas enable row level security;
grant all on public.novas_contas to service_role;
grant usage, select on sequence public.novas_contas_id_seq to service_role;
create or replace function public.registrar_nova_conta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin insert into public.novas_contas (user_id, email) values (new.id, new.email);
  exception when others then null; end; -- nunca atrapalha o cadastro
  return new;
end $$;
drop trigger if exists ao_criar_conta on auth.users;
create trigger ao_criar_conta after insert on auth.users for each row execute function public.registrar_nova_conta();
-- contas que já existiam entram como "já avisadas"
insert into public.novas_contas (user_id, email, criado, avisado)
select id, email, created_at, true from auth.users u
where not exists (select 1 from public.novas_contas n where n.user_id = u.id);

-- ===== Travas contra abuso (uma pessoa não consegue gastar os recursos de todo mundo) =====
-- 1) controle de e-mails: no máximo 1 e-mail do dia e 1 lembrete por pessoa por dia
create table if not exists public.emails_enviados (
  user_id uuid not null, dia date not null, tipo text not null, enviado_em timestamptz not null default now(),
  primary key (user_id, dia, tipo)
);
alter table public.emails_enviados enable row level security;
grant all on public.emails_enviados to service_role;

-- 2) mensagens para a Emilly: até 5 por hora por pessoa e 40 por hora no total
create or replace function public.limitar_feedback() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid(); new.enviado := false; new.created_at := now();
  if (select count(*) from public.feedback where created_at > now() - interval '1 hour') >= 40 then
    raise exception 'Muitas mensagens agora. Tente de novo mais tarde.';
  end if;
  if new.user_id is not null and (select count(*) from public.feedback where user_id = new.user_id and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Você já enviou várias mensagens nesta hora. Tente de novo mais tarde.';
  end if;
  return new;
end $$;
drop trigger if exists limite_feedback on public.feedback;
create trigger limite_feedback before insert on public.feedback for each row execute function public.limitar_feedback();

-- 3) espaço por conta: arquivo de até 3 MB, até 3.000 arquivos e 50 MB por pessoa
alter table public.arquivos drop constraint if exists arquivo_tamanho;
alter table public.arquivos add constraint arquivo_tamanho check (pg_column_size(data) <= 3000000 and char_length(path) <= 200) not valid;
create or replace function public.limitar_arquivos() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and (select count(*) from public.arquivos where user_id = new.user_id) >= 3000 then
    raise exception 'Sua conta atingiu o limite de arquivos.';
  end if;
  if pg_column_size(new.data) > 100000 and
     (select coalesce(sum(pg_column_size(data)), 0) from public.arquivos where user_id = new.user_id and path <> new.path) + pg_column_size(new.data) > 50000000 then
    raise exception 'Sua conta atingiu o limite de espaço.';
  end if;
  return new;
end $$;
drop trigger if exists limite_arquivos on public.arquivos;
create trigger limite_arquivos before insert or update on public.arquivos for each row execute function public.limitar_arquivos();

-- 4) IA: além do limite diário, no máximo 12 usos por minuto por pessoa
alter table public.uso_ia add column if not exists minuto timestamptz;
alter table public.uso_ia add column if not exists n_min int not null default 0;
create or replace function public.registrar_uso_ia(uid uuid, d date) returns json
language sql security definer set search_path = '' as $$
  insert into public.uso_ia as u (user_id, dia, n, minuto, n_min) values (uid, d, 1, date_trunc('minute', now()), 1)
  on conflict (user_id, dia) do update set
    n = u.n + 1,
    n_min = case when u.minuto = date_trunc('minute', now()) then u.n_min + 1 else 1 end,
    minuto = date_trunc('minute', now())
  returning json_build_object('n', n, 'n_min', n_min);
$$;
revoke all on function public.registrar_uso_ia(uuid, date) from public, anon, authenticated;
grant execute on function public.registrar_uso_ia(uuid, date) to service_role;

-- 5) aulas compartilhadas: apaga as antigas (agora a chave inclui uma impressão digital do pedido, ninguém consegue "envenenar" uma aula)
delete from public.licoes_publicas;
