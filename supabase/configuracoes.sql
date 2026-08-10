-- Casita — aparencia da casa (cor e fotos)
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute.
-- Seguro para rodar mais de uma vez. Depende de supabase/schema.sql (usa o
-- trigger set_updated_at que ele cria).
--
-- POR QUE ISTO EXISTE
--   A cor da casa vivia no localStorage, entao morria no aparelho: o convidado
--   que abria o link pegava sempre o verde padrao, e os dois admins viam cores
--   diferentes. Cor e uma decisao da festa, nao preferencia de navegador.
--
--   O tema claro/escuro NAO vem para ca de proposito — aquilo e conforto de
--   quem esta olhando (luz do ambiente, ajuste do sistema), nao identidade.

-- ---------------------------------------------------------------------------
-- Uma linha, e so uma.
--
-- `id boolean check (id)` aceita unicamente o valor `true`. Como e chave
-- primaria, uma segunda linha e impossivel — o banco recusa. Mais honesto que
-- um `limit 1` no app torcendo para nunca haver duas.
-- ---------------------------------------------------------------------------
create table if not exists public.configuracoes (
  id            boolean primary key default true check (id),

  -- Id de preset em src/lib/theme.js. Sem `check` de proposito: repetir os 29
  -- ids aqui duplicaria a lista e criaria mais um ponto para sair de sincronia.
  -- Nao faz falta — corPorId() ja cai no padrao quando o id nao existe.
  cor           text not null default 'musgo',

  mostrar_fotos boolean not null default true,

  updated_at    timestamptz not null default now()
);

-- A linha nasce aqui. Este insert roda como dono da tabela, entao passa por
-- cima da RLS; pela API nao existe policy de insert nenhuma.
insert into public.configuracoes (id) values (true) on conflict (id) do nothing;

drop trigger if exists configuracoes_set_updated_at on public.configuracoes;
create trigger configuracoes_set_updated_at
  before update on public.configuracoes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Leitura publica: e uma cor e um booleano, nao ha o que proteger — e e
-- justamente o convidado sem sessao quem mais precisa ler.
--
-- Escrita so autenticada, e so `update`. Sem policy de insert nem de delete: a
-- linha unica nao pode ser apagada nem duplicada por quem passa pela API.
-- ---------------------------------------------------------------------------
alter table public.configuracoes enable row level security;

drop policy if exists "config: leitura publica" on public.configuracoes;
create policy "config: leitura publica"
  on public.configuracoes
  for select
  to anon, authenticated
  using (true);

drop policy if exists "config: escrita autenticada" on public.configuracoes;
create policy "config: escrita autenticada"
  on public.configuracoes
  for update
  to authenticated
  using (true)
  with check (true);

-- PostgREST guarda o schema em cache; sem isto a API responde
-- "Could not find the table public.configuracoes" ate reiniciar.
notify pgrst, 'reload schema';

-- Conferencia depois de rodar:
--   select * from public.configuracoes;   -- exatamente 1 linha
--
-- E numa janela anonima do navegador, com a chave publicavel:
--   await supabase.from('configuracoes').select('*')                      -> a linha
--   await supabase.from('configuracoes').update({cor:'pink'}).eq('id',true) -> nao altera
