-- Casita — modulo publico (lista de presentes do Cha de Panela)
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute.
-- Seguro para rodar mais de uma vez. Depende de supabase/schema.sql.
--
-- O QUE ESTE ARQUIVO RESOLVE
--   Os convidados precisam ver a lista e reservar um item sem login. A chave
--   publicavel vai no bundle do front, entao "esconder o preco no template" nao
--   protege nada: qualquer um abre o DevTools e chama a API direto.
--   A garantia tem que ser aqui embaixo — uma view que simplesmente NAO TEM as
--   colunas de preco, e uma funcao que e a unica porta de escrita do anonimo.

-- ---------------------------------------------------------------------------
-- RESERVAS
-- Uma reserva por item, mesmo quando quantidade > 1: o convidado leva o item
-- inteiro. Foi decisao de produto, nao limitacao — dividir "7 panos de prato"
-- entre quatro pessoas gera mais confusao do que presente.
-- ---------------------------------------------------------------------------
create table if not exists public.reservas (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.items (id) on delete cascade,
  nome       text not null check (char_length(trim(nome)) between 2 and 80),
  -- So digitos, DDD junto: '11988887777'. A mascara e coisa de exibicao e vive
  -- no front (src/lib/format.js). Guardar formatado quebraria o link do wa.me.
  --
  -- O check aceita 10 ou 11, mas reservar_presente() so grava 11 (celular). A
  -- folga existe para nao quebrar linha ja gravada com fixo — apertar o check
  -- de uma tabela com dados falha, e nao ha o que ganhar com isso: quem escreve
  -- e a funcao.
  telefone   text not null check (telefone ~ '^[0-9]{10,11}$'),
  created_at timestamptz not null default now()
);

-- E ESTE INDICE que impede reserva dupla — nao o `if not exists` da funcao.
-- Duas abas clicando no mesmo item no mesmo segundo: uma grava, a outra bate
-- em unique_violation. Checagem no app perde essa corrida.
create unique index if not exists reservas_item_unico
  on public.reservas (item_id);

-- ---------------------------------------------------------------------------
-- RLS das reservas
-- Nenhuma policy para `anon`, de proposito: o convidado nao le nem escreve
-- direto nesta tabela. Sem isso, um convidado curioso listaria o telefone de
-- todos os outros. Ele so chega aqui pela funcao reservar_presente().
-- ---------------------------------------------------------------------------
alter table public.reservas enable row level security;

drop policy if exists "reservas: acesso total autenticado" on public.reservas;
create policy "reservas: acesso total autenticado"
  on public.reservas
  for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- A LISTA PUBLICA
--
-- `security_invoker = off` faz a view rodar como dona (postgres) e passar por
-- cima da RLS de `items` — e por isso que ela responde sem sessao.
--
-- A LINHA MAIS IMPORTANTE DESTE ARQUIVO e a lista de colunas abaixo:
-- preco_unitario, preco_estimado, preco_real, status e tipo NAO estao nela.
-- Nao existe select, filtro ou header que as traga de volta. O preco e controle
-- interno e some no banco, nao no template.
--
-- `reservado` e booleano: diz que o item saiu, nao quem levou. Nome e telefone
-- do convidado ficam do lado de ca da fronteira.
-- ---------------------------------------------------------------------------
drop view if exists public.presentes_publicos;
create view public.presentes_publicos
with (security_invoker = off) as
  select
    i.id,
    i.item,
    i.categoria,
    i.prioridade,
    i.quantidade,
    i.link,
    i.observacoes,
    i.created_at,
    (r.id is not null) as reservado
  from public.items i
  left join public.reservas r on r.item_id = i.id
  where i.tipo = 'Chá de Panela'
    and i.status = 'A comprar';

grant select on public.presentes_publicos to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RESERVAR
--
-- `security definer` porque o anonimo nao tem insert em `reservas` — e nem deve
-- ganhar. Esta funcao e a unica porta, e ela valida antes de abrir.
-- `set search_path = public` fecha o buraco classico de security definer: sem
-- isso, um schema plantado no search_path do chamador sequestra os nomes.
--
-- As excecoes sobem como string curta (JA_RESERVADO, TELEFONE_INVALIDO...) e o
-- front traduz para portugues, no mesmo molde de MENSAGENS_ERRO em useAuth.js.
--
-- DIVISAO DE TRABALHO com o formulario: aqui e o PISO, la e o GUIA. O front
-- explica o que fazer e cobra nome com sobrenome de 2+ letras cada; aqui so
-- exigimos duas palavras. Validacao de servidor recusando nome legitimo e pior
-- do que uma deixando passar nome estranho — a lista e de convidados de
-- casamento, nao de cadastro bancario.
-- ---------------------------------------------------------------------------
create or replace function public.reservar_presente(
  p_item_id  uuid,
  p_nome     text,
  p_telefone text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text := trim(coalesce(p_nome, ''));
  v_tel  text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
begin
  -- Colapsa espaco repetido antes de contar palavras: "Ana   Souza" tem duas.
  v_nome := regexp_replace(v_nome, '\s+', ' ', 'g');

  -- Duas palavras, no minimo. Sem sobrenome o casal fica com cinco "Ana" na
  -- lista e nenhuma forma de saber quem e quem na hora de agradecer.
  if char_length(v_nome) > 80 or v_nome !~ '^\S+ \S+' then
    raise exception 'NOME_INVALIDO';
  end if;

  -- 11 digitos: DDD + o 9. Fixo nao recebe WhatsApp, e e por ali que a entrega
  -- vai ser combinada.
  if v_tel !~ '^[0-9]{11}$' then
    raise exception 'TELEFONE_INVALIDO';
  end if;

  -- Repete o filtro da view: item que virou 'Comprado' ou 'Compra pessoal'
  -- entre o carregamento da pagina e o clique nao pode ser reservado.
  if not exists (
    select 1 from public.items
     where id = p_item_id
       and tipo = 'Chá de Panela'
       and status = 'A comprar'
  ) then
    raise exception 'ITEM_INDISPONIVEL';
  end if;

  insert into public.reservas (item_id, nome, telefone)
  values (p_item_id, v_nome, v_tel);

exception
  when unique_violation then
    raise exception 'JA_RESERVADO';
end;
$$;

-- `public` inclui todo mundo. Revoga geral e devolve so para os dois papeis da
-- API — deixa explicito quem pode chamar.
revoke all on function public.reservar_presente(uuid, text, text) from public;
grant execute on function public.reservar_presente(uuid, text, text)
  to anon, authenticated;

-- PostgREST guarda o schema em cache; sem isto, a API responde
-- "Could not find the function public.reservar_presente" ate reiniciar.
notify pgrst, 'reload schema';

-- Conferencia depois de rodar (no SQL Editor, que roda como postgres):
--   select count(*) from public.presentes_publicos;   -- deve bater com:
--   select count(*) from public.items
--    where tipo = 'Chá de Panela' and status = 'A comprar';
--
-- E o teste que importa, este NAO da para fazer aqui — tem que ser numa janela
-- anonima do navegador, com a chave publicavel:
--   supabase.from('items').select('*')     -> [] (RLS)
--   supabase.from('reservas').select('*')  -> [] (sem policy para anon)
--   supabase.from('presentes_publicos').select('*') -> lista, sem nenhum preco

-- ---------------------------------------------------------------------------
-- "QUAIS SAO AS MINHAS?"
--
-- O convidado nao tem conta. Ate aqui, quem reservou algo so era lembrado no
-- proprio navegador (localStorage, src/composables/useConvidado.js): trocou de
-- aparelho, perdeu o rastro do que ja tinha escolhido — e nao tinha como
-- desfazer sem falar com o casal.
--
-- A tabela `reservas` continua fechada para `anon` (bloco de RLS la em cima) e
-- a view publica continua devolvendo so o booleano. O que muda e que existem
-- duas portas novas, `security definer`, e as duas exigem O TELEFONE EXATO como
-- credencial. Sem `like`, sem busca parcial, sem listagem: ou a pessoa digita os
-- 11 digitos daquela reserva, ou nao ve nada.
--
-- E uma credencial fraca, e isso foi decidido de olho aberto: quem ja tem o
-- celular de um convidado descobre o que ele reservou e pode soltar o item.
-- O que esta em jogo e uma lista de presentes, e o custo da alternativa (pedir
-- senha para dar presente) e alto demais para o que protege.
-- ---------------------------------------------------------------------------
create or replace function public.minhas_reservas(p_telefone text)
returns table (
  item_id    uuid,
  nome       text,
  telefone   text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  -- Telefone invalido cai no filtro e sai lista vazia, nao excecao: resposta
  -- vazia para numero errado e para numero que nao existe tem que ser a MESMA,
  -- senao a funcao vira um detector de "esse celular reservou algo?".
  select r.item_id, r.nome, r.telefone, r.created_at
    from public.reservas r
    join public.items i on i.id = r.item_id
   where regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g') ~ '^[0-9]{11}$'
     and r.telefone = regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g')
     -- Mesmo filtro da view. Sem ele, esta funcao seria uma janela para itens
     -- que o convidado nunca deveria enxergar.
     and i.tipo = 'Chá de Panela'
     and i.status = 'A comprar';
$$;

-- ---------------------------------------------------------------------------
-- DESFAZER A PROPRIA RESERVA
--
-- A autorizacao e a propria clausula do delete: `r.telefone = v_tel`. Telefone
-- errado casa zero linhas e a funcao levanta RESERVA_NAO_ENCONTRADA — nao ha
-- caminho, com nenhum argumento, para apagar a reserva de outra pessoa.
--
-- Apaga a linha em vez de marcar cancelada. E a mesma coisa que o painel ja faz
-- (useItems.cancelarReserva) e o indice unico por item depende disso: reserva
-- cancelada que continuasse na tabela impediria o proximo convidado de reservar.
-- ---------------------------------------------------------------------------
create or replace function public.cancelar_reserva(
  p_item_id  uuid,
  p_telefone text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tel      text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_apagadas int;
begin
  if v_tel !~ '^[0-9]{11}$' then
    raise exception 'TELEFONE_INVALIDO';
  end if;

  delete from public.reservas r
   using public.items i
   where r.item_id = p_item_id
     and i.id = r.item_id
     and r.telefone = v_tel
     and i.tipo = 'Chá de Panela'
     and i.status = 'A comprar';

  get diagnostics v_apagadas = row_count;

  -- Zero linhas cobre tudo de uma vez: telefone de outro, item que ja saiu da
  -- lista, reserva que o casal cancelou antes. Do lado de fora e a mesma frase
  -- ("essa reserva nao e mais sua, atualiza a pagina") e nenhuma delas confirma
  -- a existencia de reserva alheia.
  if v_apagadas = 0 then
    raise exception 'RESERVA_NAO_ENCONTRADA';
  end if;
end;
$$;

revoke all on function public.minhas_reservas(text) from public;
grant execute on function public.minhas_reservas(text) to anon, authenticated;

revoke all on function public.cancelar_reserva(uuid, text) from public;
grant execute on function public.cancelar_reserva(uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';

-- Conferencia das duas funcoes novas (SQL Editor):
--   select * from public.minhas_reservas('11988887777');  -- as reservas do numero
--   select * from public.minhas_reservas('119888');       -- vazio, sem erro
--   select * from public.minhas_reservas('11900000000');  -- vazio
--   select public.cancelar_reserva('<item_id>', '00000000000');
--     -> RESERVA_NAO_ENCONTRADA, mesmo que o item tenha reserva de outro numero
