-- ---------------------------------------------------------------------------
-- Casita — migracao: preco_unitario
--
-- Cole ESTE ARQUIVO INTEIRO no SQL Editor do Supabase e clique em Run.
-- Pode rodar mais de uma vez: se ja tiver sido aplicada, nao faz nada.
--
-- O QUE ELA FAZ COM OS SEUS DADOS
--   Nada se perde. O preco unitario e DERIVADO do total que ja esta la:
--       preco_unitario = preco_estimado / quantidade
--   Depois preco_estimado passa a ser calculado de volta a partir dele.
--   Os 59 itens e o total de R$ 37.040,00 continuam iguais.
--
-- POR QUE 4 CASAS DECIMAIS
--   "Pano de pratos" sao 7 unidades por R$ 20,00 -> 2,857142... por unidade.
--   Com 2 casas o total geral viraria R$ 37.040,02. Com 4, volta exato.
-- ---------------------------------------------------------------------------

do $$
declare
  dono text;
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'items'
       and column_name = 'preco_unitario'
  ) then
    raise notice 'Migracao ja aplicada. Nada a fazer.';
    return;
  end if;

  -- 0. ALTER TABLE exige ser dono da tabela. O SQL Editor nem sempre roda com o
  --    papel que criou a tabela — daí o erro "must be owner of table items".
  --    Se o papel atual for membro do dono, `set role` resolve.
  select tableowner into dono
    from pg_tables where schemaname = 'public' and tablename = 'items';

  if dono is null then
    raise exception 'Tabela public.items nao encontrada.';
  end if;

  if dono <> current_user then
    begin
      execute format('set local role %I', dono);
      raise notice 'Assumindo o papel do dono da tabela: %', dono;
    exception when others then
      raise exception
        'A tabela public.items pertence a "%", e o papel atual ("%") nao pode assumi-lo. '
        'Rode supabase/diagnostico.sql e me mande o resultado.', dono, current_user;
    end;
  end if;

  -- 1. Coluna nova.
  alter table public.items add column preco_unitario numeric(12, 4) not null default 0;

  -- 2. Backfill a partir do total que ja existe. TEM que vir antes do drop.
  update public.items
     set preco_unitario = round(preco_estimado / greatest(quantidade, 1), 4);

  -- 3. preco_estimado deixa de ser digitado...
  alter table public.items drop column preco_estimado;

  -- 4. ...e volta como coluna GERADA. Assim e impossivel o total discordar de
  --    quantidade x unitario. Em troca, ninguem escreve nela (o app ja sabe).
  alter table public.items
    add column preco_estimado numeric(10, 2)
    generated always as (round(quantidade * preco_unitario, 2)) stored;

  raise notice 'Migracao aplicada.';
end
$$;

-- O erro "Could not find the 'preco_unitario' column in the schema cache" vem do
-- PostgREST guardando o schema antigo em cache. Isto forca o recarregamento.
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- CONFERENCIA — rode depois e compare:
--
--   select count(*) from public.items;
--     -> 59
--
--   select sum(preco_estimado) from public.items;
--     -> 37040.00
--
--   select count(*) from public.items
--    where round(quantidade * preco_unitario, 2) <> preco_estimado;
--     -> 0
--
--   select item, quantidade, preco_unitario, preco_estimado
--     from public.items where quantidade > 1 order by quantidade desc limit 3;
--     -> Cabides         40   1.5000     60.00
--        Lâmpadas         7  10.0000     70.00
--        Pano de pratos   7   2.8571     20.00
-- ---------------------------------------------------------------------------
