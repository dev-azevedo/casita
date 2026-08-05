-- Casita — schema do banco
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute.
-- Seguro para rodar mais de uma vez.

create table if not exists public.items (
  id             uuid primary key default gen_random_uuid(),
  categoria      text not null,
  item           text not null,
  prioridade     text not null default 'Essencial'
                 check (prioridade in ('Essencial', 'Importante', 'Desejável')),
  status         text not null default 'A comprar'
                 check (status in ('A comprar', 'Comprado')),
  tipo           text not null default 'Chá de Panela'
                 check (tipo in ('Chá de Panela', 'Compra pessoal')),
  quantidade     integer not null default 1 check (quantidade > 0),
  -- 4 casas, nao 2: com 2 o total da casa mudava sozinho. "Pano de pratos"
  -- (7 un. por R$ 20,00) da 2,857142... e arredondar em 2 casas jogava o total
  -- geral de R$ 37.040,00 para R$ 37.040,02.
  preco_unitario numeric(12, 4) not null default 0,
  -- Coluna GERADA: nao se escreve nela. Assim e impossivel o total discordar de
  -- quantidade x unitario, venha a escrita de onde vier.
  preco_estimado numeric(10, 2)
                 generated always as (round(quantidade * preco_unitario, 2)) stored,
  preco_real     numeric(10, 2),
  link           text,
  observacoes    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- MIGRACAO: preco_unitario
--
-- O `create table if not exists` acima nao toca numa tabela que ja existe, entao
-- esta parte cuida das bases que ja tinham `preco_estimado` como campo digitado.
-- Nao faz nada se a coluna nova ja estiver la.
--
-- A ORDEM IMPORTA: o backfill roda ANTES do drop. Invertido, os valores somem.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'items'
       and column_name = 'preco_unitario'
  ) then
    alter table public.items add column preco_unitario numeric(12, 4) not null default 0;

    -- Deriva o unitario do total que ja estava la.
    update public.items
       set preco_unitario = round(preco_estimado / greatest(quantidade, 1), 4);

    alter table public.items drop column preco_estimado;

    alter table public.items
      add column preco_estimado numeric(10, 2)
      generated always as (round(quantidade * preco_unitario, 2)) stored;

    raise notice 'preco_unitario criado e preco_estimado virou coluna gerada.';
  end if;
end
$$;

create index if not exists items_categoria_idx  on public.items (categoria);
create index if not exists items_status_idx     on public.items (status);
create index if not exists items_prioridade_idx on public.items (prioridade);

-- updated_at automatico
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Sem policy para o papel `anon`: sem sessao valida, a tabela nao devolve nada.
-- Esta e a unica protecao real dos dados — nao ha senha escondida no front-end.
-- ---------------------------------------------------------------------------
alter table public.items enable row level security;

drop policy if exists "acesso total autenticado" on public.items;
create policy "acesso total autenticado"
  on public.items
  for all
  to authenticated
  using (true)
  with check (true);

-- PostgREST guarda o schema em cache; sem isto, a API responde
-- "Could not find the '<coluna>' column in the schema cache" ate reiniciar.
notify pgrst, 'reload schema';

-- Depois de rodar: crie os 2 usuarios em Authentication > Users > Add user
-- (marque "Auto Confirm User"). Nao existe cadastro pelo app, de proposito.

-- Conferencia da migracao — as duas devem bater:
--   select sum(preco_estimado) from public.items;                        -> 37040.00
--   select count(*) from public.items
--    where round(quantidade * preco_unitario, 2) <> preco_estimado;      -> 0
