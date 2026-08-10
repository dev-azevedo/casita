# 🏡 Casita

Duas metades no mesmo app:

- **Pública** — o portal (`/`), a lista de presentes do chá de casa nova (`/presentes`) e a
  reserva. É o link que vai pro grupo da família. Sem login, sem cadastro, **sem preço**.
- **Privada** — o painel (`/painel`), com fotos do casal, os itens todos e as métricas que
  ficavam no rodapé da planilha. Só o casal entra.

Vue 3 + Vite + Tailwind v4 + Supabase. Sem backend próprio.

| Rota | O quê | Precisa de login |
|---|---|---|
| `/` | Portal: "Ver lista de presentes" e, discreto, "Acessar" | não |
| `/presentes` | Lista pública com filtros e reserva | não |
| `/login` | Entrada do casal | não |
| `/painel` | O app de sempre (itens, preços, métricas) | **sim** |

---

## Setup (uma vez só)

### 1. Instalar

```bash
npm install
```

### 2. Criar o projeto no Supabase

1. Crie um projeto em <https://supabase.com>.
2. Vá em **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e execute.
   Isso cria a tabela `items` e liga a RLS.
3. No mesmo SQL Editor, cole `supabase/reservas.sql` e execute.
   Isso cria a tabela `reservas`, a view pública `presentes_publicos` e a função
   `reservar_presente()` — sem isso, `/presentes` abre vazia.
4. Por fim, `supabase/configuracoes.sql`. Cria a linha única com a cor da casa e o
   interruptor de fotos.

**A ordem importa** (`reservas` e `configuracoes` dependem do que `schema.sql` cria), mas
os três podem rodar de novo quantas vezes quiser.

### 3. Configurar o `.env`

Copie `.env.example` para `.env` e preencha com os dados de
**Project Settings → API Keys**:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

O painel mostra quatro valores. O que vai onde:

| Painel | Onde vai | Observação |
|---|---|---|
| `SUPABASE_URL` | `VITE_SUPABASE_URL` | |
| `SUPABASE_PUBLISHABLE_KEY` | `VITE_SUPABASE_PUBLISHABLE_KEY` | antiga *anon key*; pública, vai pro bundle |
| `SUPABASE_SECRET_KEY` | `SUPABASE_SECRET_KEY` | antiga *service_role*; **ignora a RLS** |
| `SUPABASE_JWKS_URL` | não é usado | serve para validar JWT em backend próprio |

O prefixo `VITE_` não é decoração: o Vite injeta no bundle **só** as variáveis que
começam com ele. Por isso a secret key fica sem prefixo — ela é lida apenas pelo
`scripts/seed.mjs`, que roda no Node, e nunca chega ao navegador. O `.env` inteiro
está no `.gitignore`.

### 4. Criar os 2 usuários

**Authentication → Users → Add user**. Marque *Auto Confirm User*.
Crie um para você e um para ela.

Não existe tela de cadastro no app — isso é de propósito. Contas só pelo painel.

### 5. Importar os 59 itens da planilha

Com a `SUPABASE_SECRET_KEY` preenchida no `.env` (passo 3):

```bash
npm run seed
```

O script confere os totais antes de escrever. Deve imprimir:

```
CSV lido: 59 itens
  Total geral estimado ..... R$ 37.040,00
  Compra pessoal ........... R$ 14.430,00
  Chá de casa nova ......... R$ 22.610,00
  Comprados ................ 0 / 59
```

Flags: `--dry` (só mostra, não escreve) e `--force` (apaga tudo e reimporta).

### 6. Rodar

```bash
npm run dev
```

---

## Fotos

Tudo em `src/lib/fotos.js`. As 14 fotos de `public/fotos/` já estão listadas.

```js
{ src: '/fotos/_01.JPEG', legenda: 'Correndo juntos', ano: '2025', objectPosition: 'center 32%' }
```

- **A primeira da lista é a capa** em tela cheia. As demais entram na faixa que rola de lado.
- `objectPosition` decide qual parte sobrevive ao corte. `center 30%` puxa para cima
  (rostos no terço superior), `center 60%` para baixo. Ajuste se alguém ficar sem cabeça.
- `legenda` e `ano`: as legendas atuais foram escritas olhando as fotos — troque pelos
  nomes que vocês dão a cada momento. Os anos estão em branco.
- Título e subtítulo da capa também ficam nesse arquivo.

As fotos estão no `.gitignore` — não vão para o repositório, mas **vão** para o build.

### Dois portões, por motivos diferentes

`src/lib/fotos.js` é só o manifesto. Quem decide o que aparece é
`src/composables/useFotos.js`, e existem duas chaves:

1. **Desenvolvimento** — a lista sai vazia quando `import.meta.env.PROD` é falso. São 14
   JPEGs grandes que o Vite serve sem otimizar; recarregar a capa a cada save custa caro e
   não ajuda a ver o que se está mexendo. E como `public/fotos/` está no `.gitignore`, quem
   clona o repositório não tem os arquivos — antes o dev abria cheio de 404.
2. **Aparência da casa** — o interruptor no painel, gravado no banco. Vale para vocês **e**
   para os convidados.

Todas as telas já lidam com lista vazia (capa e portal caem no campo de gradiente, a faixa
de miniaturas some), então o layout continua legível e o modo "sem foto" ganha teste todo
dia. Para ver as fotos, `npm run build && npm run preview`.

### Vídeo de capa

`public/fotos/first_.mp4` (13 MB) está desligado. Para usá-lo como capa, descomente
`VIDEO_CAPA` em `src/lib/fotos.js`. Comprima antes para ~2–3 MB: a capa é a primeira
coisa que carrega, e 13 MB no 4G é caro.

---

## Tema e cor da casa

Duas coisas parecidas que moram em lugares diferentes de propósito:

| | Onde vive | Quem escolhe |
|---|---|---|
| **Claro / escuro / sistema** | `localStorage`, por aparelho | quem está olhando |
| **Cor da casa** e **mostrar fotos** | `public.configuracoes`, uma linha | só o casal |

Tema é conforto de quem está olhando — luz do ambiente, ajuste do sistema. Cor da casa é
identidade da festa: se ela morasse no aparelho, o convidado que abre o link do WhatsApp
pegaria sempre o verde padrão, e os dois admins veriam cores diferentes.

- **Claro / escuro / sistema** — botão no topo. Um script inline no `index.html` pinta
  o tema antes da primeira pintura, então não há flash branco ao abrir no escuro.
- **28 cores** em três grupos — *Nossos verdes* (os pastéis musgo/oliva/sálvia),
  *Vivas* (os 17 matizes do Tailwind v4 no chroma máximo) e *Suaves* (neutros
  levemente tingidos). Definidas em `src/lib/theme.js`.

### Aparência da casa (a parte compartilhada)

O diálogo do topo do painel — cor + interruptor de fotos. Ele só é montado em `AppHeader` e
`WelcomeTour`, ambos exclusivos do painel, então o controle já nasce restrito ao casal sem
precisar de guarda própria. A tabela é gravável só por `authenticated`; convidado lê e
pronto.

A tabela tem **uma linha só**, garantida pelo banco: `id boolean primary key check (id)` só
aceita `true`, então uma segunda linha é impossível. Sem policy de `insert` nem de `delete`
— ninguém apaga nem duplica pela API.

A coluna `cor` **não** tem `check` com os 29 ids. Repetir a lista no SQL criaria mais um
ponto para sair de sincronia com `theme.js`, e não faz falta: `corPorId()` já cai no padrão
quando o id não existe.

**Como a cor chega em quem abre o link.** `useConfig` grava o resultado em `casita:cor` e
`casita:hc` — as chaves que o script inline do `index.html` já lê antes da primeira
pintura. A segunda visita do convidado abre direto na cor certa; a primeira ainda pisca uma
vez, porque a cor vem da rede e o app pinta antes. Travar a pintura esperando a config seria
pior: tela branca a cada carregamento.

Mudança de cor também entra no ciclo de auto-refresh de 5s, então quem está com a lista
aberta vê a troca sem recarregar. Dois admins salvando ao mesmo tempo: o último ganha.

A cor não pinta só os botões: um par `(hue, chroma)` alimenta o accent **e** os neutros,
então trocar a cor retinge fundos, bordas e texto de leve. É o que dá a sensação de que
o app inteiro mudou de humor.

Se mexer nos presets, mantenha `src/lib/theme.js` como fonte única — o script do
`index.html` lê o par já resolvido de `localStorage`, justamente para não duplicar a tabela.

### Por que o chroma varia de cor para cor

O `c` de cada preset não é gosto, é o máximo que aquele matiz alcança dentro do sRGB —
considerando todas as variantes derivadas do accent, nos dois temas. Passar disso faria o
navegador cortar a cor, e a bolinha do seletor mostraria uma cor diferente da aplicada.

Por isso magenta chega a `0.212` e turquesa para em `0.079`: o sRGB simplesmente não tem
amarelo nem ciano saturado em clareza média. É limite físico, não escolha.

Se mudar as lightness do accent em `src/style.css`, os máximos mudam junto — vale
recalcular antes de inventar valores novos.

### Acessibilidade das cores

Os 28 presets × 2 temas × 17 pares de texto foram verificados contra a WCAG
(mínimo 4.5:1 em corpo, 3:1 em componentes). Prioridade nunca depende só de cor:
vermelho e amarelo ficam quase idênticos para quem tem deuteranopia (~6% dos homens),
então a marca também muda de **forma** — disco cheio, meio disco, anel vazado
(`src/components/MarcaPrioridade.vue`).

---

## Preço unitário e total

> **Base criada antes desta mudança?** Rode
> `supabase/migracao-preco-unitario.sql` no SQL Editor. Ela deriva o preço unitário dos
> totais que já estão lá — nada se perde, nada precisa ser re-semeado.
> O erro `Could not find the 'preco_unitario' column in the schema cache` significa
> exatamente isso: a migração ainda não rodou.

O formulário pede **quantidade** e **preço por unidade**. O total aparece calculado ao
vivo, como valor exibido — não é campo, não dá para editar.

No banco, `preco_estimado` é uma **coluna gerada**:

```sql
preco_estimado numeric(10,2)
  generated always as (round(quantidade * preco_unitario, 2)) stored
```

Ou seja: é impossível o total discordar da conta, venha a escrita de onde vier. Em troca,
**ninguém pode escrever nessa coluna** — `sanitize()` em `src/composables/useItems.js`
remove `preco_estimado` do payload, e o seed também não a envia.

`preco_unitario` é `numeric(12,4)`, não `(10,2)`. Com 2 casas o total da casa mudava
sozinho na migração: "Pano de pratos" (7 unidades por R$ 20,00) dá 2,857142… e o
arredondamento levava o total geral de R$ 37.040,00 para R$ 37.040,02.

---

## O motivo da casa

`src/components/Casinha.vue` — traço original, quatro variantes: `casa`, `chave`,
`planta`, `caixas`. Aparece na capa sem foto, no login, nas boas-vindas, na ponta da barra
de progresso, na tela de carregamento e no estado vazio da lista.

---

## Boas-vindas

Na primeira vez que alguém entra naquele aparelho, abre um tour de 4 passos: quem somos,
o que é a lista, como usar, e a escolha da cor da casa. Fica gravado em
`casita:onboarded:v1`. Para rever, há um link no rodapé da lista.

Para testar de novo: `localStorage.clear()` e recarregue.

---

## Segurança — o que protege o quê

- `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` **vão para o bundle JavaScript**
  e qualquer visitante consegue lê-las. Isso é normal: são chaves públicas por design.
- Quem protege os dados é a **RLS**. A policy em `supabase/schema.sql` só permite
  acesso ao papel `authenticated`. Sem login válido, a tabela não devolve nada —
  nem com a publishable key em mãos.
- A **secret key** (`sb_secret_...`) ignora a RLS por completo. Ela fica no `.env`
  sem prefixo `VITE_`, então só o `scripts/seed.mjs` (Node) a enxerga — nunca o
  bundle. Verificado: build com uma secret de teste no `.env` → zero ocorrências
  dela no `dist`.
- Por isso **não** há senha hardcoded: em Vite qualquer `VITE_*` é legível no
  DevTools, então uma senha ali só afastaria quem não abrisse o inspetor.

Para conferir que nada vazou:

```powershell
npm run build
# cole os primeiros caracteres da SUA secret key, nao o prefixo generico:
Select-String -Path dist\assets\*.js -Pattern 'sb_secret_XXXXXXXX' -SimpleMatch
```

Não deve retornar nada. (Buscar só por `sb_secret_` dá falso positivo: a string
aparece dentro do código do `supabase-js`, num `startsWith` de validação.)

---

## O módulo público — por que o preço some no banco, não no template

A lista de presentes é aberta: qualquer um com o link entra, sem sessão. Isso significa
que "não renderizar o preço no Vue" não protege nada — a publishable key está no bundle,
e quem abrir o DevTools chama a API direto e pede o que quiser.

A garantia mora em `supabase/reservas.sql`:

- **`presentes_publicos`** é uma view que só tem `id`, `item`, `categoria`, `prioridade`,
  `quantidade`, `link`, `observacoes` e um booleano `reservado`. `preco_unitario`,
  `preco_estimado`, `preco_real`, `status` e `tipo` **não estão nela**. Não existe select,
  filtro ou header que as traga de volta. Ela roda com `security_invoker = off`, ou seja,
  como dona — é assim que responde sem sessão apesar da RLS de `items`.
- **`reservas` não tem policy para `anon`.** O convidado não lê essa tabela, então o
  telefone de um convidado nunca aparece para outro. O front público só sabe *que* o item
  saiu, nunca *para quem* — isso só o painel mostra.
- **`reservar_presente()`** é `security definer` e é a única porta de escrita do anônimo.
  Ela normaliza (trim no nome, só dígitos no telefone), valida, confere que o item ainda
  é `Chá de Panela` + `A comprar`, e insere.
- Reserva dupla é impedida pelo **índice único** `reservas_item_unico`, não por um
  `if not exists` no app: duas abas clicando no mesmo segundo perdem essa corrida.
  Quem chega depois recebe `JA_RESERVADO` e vê "Alguém reservou esse item agora mesmo".

O teste que vale, numa janela anônima com o app aberto:

```js
await supabase.from('items').select('*')               // []  (RLS)
await supabase.from('reservas').select('*')            // []  (sem policy para anon)
await supabase.from('presentes_publicos').select('*')  // a lista, sem nenhum preço
```

### As duas listas se atualizam sozinhas

`useAutoRefresh` (`src/composables/useAutoRefresh.js`) repete a busca a cada 5s no painel e
na lista pública. Detalhes que não são estilo:

- **`setTimeout` reagendado ao fim de cada chamada, não `setInterval`.** No 4G de festa uma
  resposta pode passar dos 5s; com `setInterval` as chamadas empilham e chegam fora de
  ordem. Assim existe no máximo uma em voo.
- **Aba escondida não consulta nada**, e ao voltar dispara na hora em vez de esperar o
  ciclo. Celular no bolso com a aba aberta é o caso comum — isso corta a maior parte do
  tráfego.
- **Modo silencioso**: `fetchItems({ silencioso: true })` / `fetchPresentes(...)` não
  acendem `loading` (a tela piscaria a cada 5s) e **não apagam a lista quando a rede
  falha**. Um túnel de 10 segundos não pode esvaziar a tela de quem estava escolhendo.
- **Guarda de escrita no painel**: enquanto houver `PATCH`/`POST`/`DELETE` em voo, o
  refresh silencioso não busca nem aplica resposta. Sem isso, um refetch que saiu antes do
  `PATCH` pode voltar depois e desfazer na tela o que acabou de ser salvo.

Quando o item some debaixo do nariz de alguém, o modal de reserva troca para "Esse presente
acabou de ser reservado" — vindo do refresh ou do erro `JA_RESERVADO` do banco, tanto faz.
Interromper é melhor do que deixar a pessoa terminar de digitar um formulário que já vai
falhar.

### Modais e o teclado do celular

O convidado chega por link no WhatsApp — quase sempre no celular. E um bottom sheet comum
quebra quando o teclado abre: o botão de confirmar fica atrás dele.

A causa não é óbvia. `100svh` é a altura do viewport *pequeno*, um valor calculado **sem**
teclado — ele não encolhe. E `position: fixed` se ancora no viewport de **layout**, que no
iOS continua com a altura cheia; o teclado só reduz o viewport **visual**. Resultado: o
`items-end` encosta o painel no fundo de uma tela que está atrás do teclado.

Duas defesas, uma para cada metade do problema:

1. **Estrutura** — `ReservaModal` e `ItemFormModal` são colunas flex: cabeçalho e rodapé
   `shrink-0`, corpo `flex-1 overflow-y-auto`. Só o miolo rola; as ações nunca saem de
   vista. Isso vale mesmo onde os truques de viewport falharem. O `min-h-0` nos itens que
   rolam não é enfeite — sem ele o mínimo automático do flex empurra o rodapé para fora.
   O erro do formulário mora no rodapé pelo mesmo motivo: no corpo, ele poderia nascer fora
   da área visível e a pessoa só veria o botão não funcionar.
2. **Posição** — `useTecladoVirtual` publica `--vv-h` e `--vv-top` a partir de
   `window.visualViewport`, e o wrapper do modal se ancora neles em vez do viewport de
   layout. Escuta `resize` **e** `scroll`: no iOS o `offsetTop` muda com o teclado já
   aberto. Onde `visualViewport` não existe, nada é escrito e o CSS cai no
   `var(--vv-h, 100svh)` — o comportamento antigo, sem quebrar.

O véu é um elemento separado do wrapper, `fixed inset-0`, para continuar cobrindo a tela
toda quando o wrapper encolhe.

No `index.html`, `interactive-widget=resizes-content` faz o Chrome Android encolher o
próprio viewport de layout — lá o `fixed` já se posiciona certo sozinho. O iOS ignora a
diretiva. Não há compensação dupla: onde ela funciona, `visualViewport.height` passa a ser
igual à altura de layout e as variáveis descrevem a mesma caixa.

Os outros diálogos (`ConfirmarExclusao`, `ConfirmarCancelamentoReserva`, o painel de
filtros) não têm campo de texto, não levantam teclado e ficaram como estavam.

### Validação: o banco é o piso, o formulário é o guia

| Campo | Formulário | `reservar_presente()` |
|---|---|---|
| Nome | 2+ palavras de 2+ letras, sem contar partículas | 2+ palavras |
| Celular | exatamente 11 dígitos | exatamente 11 dígitos |

A regra do nome é de propósito mais frouxa no SQL. Validação de servidor recusando nome
legítimo é pior do que uma deixando passar nome estranho — isto é lista de convidados de
casamento, não cadastro bancário. Os 11 dígitos são iguais nos dois: DDD + o 9, porque fixo
não recebe WhatsApp e é por lá que a entrega é combinada.

"Partícula" é `da, das, de, del, des, di, do, dos, du, e, la, le, van, von, y` — em
"José da Silva" o sobrenome é "Silva", então "Ana Da" não conta como nome completo. Na
**primeira** posição nada é partícula: "Van Gogh" e "Di Cavalcanti" começam com nome, não
com ligação. O empate se resolve para o lado de aceitar; recusar nome real é pior.

O `check` da coluna `telefone` continua aceitando 10 ou 11. Apertá-lo falharia se já
existisse alguma reserva com fixo, e não haveria ganho: quem grava é a função.

No formulário, **o botão não é o mensageiro**. Ele fica sempre clicável e quem explica o
problema é a mensagem abaixo do campo — botão apagado sem motivo visível é porta trancada
sem placa. A mensagem só aparece depois que o campo foi tocado (ou no envio): ninguém
merece ler "faltam dígitos" depois de digitar o primeiro número. No envio inválido, os dois
erros aparecem de uma vez e o foco vai para o primeiro problema.

Erro de campo e erro do servidor ficam separados — um é "você errou", o outro é "o banco
recusou".

### A linha do item no painel

Quatro assuntos, de cima para baixo: **o que é** (prioridade, nome, quantidade), **quanto
custa** (estimado, unitário, pago, link), **quem reservou** e **o que dá pra fazer**.

A reserva é a única coisa da linha dentro de uma caixa, porque é outra entidade — não mais
um atributo do item. Hierarquia ali é por tamanho e peso, nunca por opacidade: texto
esmaecido sobre fundo colorido lava e perde contraste.

Checkbox, editar e excluir ficam numa barra no rodapé da linha. O checkbox ganhou rótulo
("marcar comprado" / "comprado") — solto na margem esquerda ele não dizia o que marcava.
Custa ~44px por item, mas tira a ambiguidade e devolve a largura inteira para o conteúdo.

### O aparelho lembra quem reservou

Depois de uma reserva dar certo, nome e celular ficam em `localStorage`
(`casita:convidado:v1`, via `useConvidado`). Na próxima reserva os campos já vêm
preenchidos e o foco vai pro botão. Quem reserva um presente costuma reservar outro, e
redigitar tudo é o atrito que faz desistir do segundo.

Só grava **depois** do sucesso — tentativa que falhou não é dado confirmado. E existe um
"não é você? limpar" abaixo dos campos, porque tablet de família passa de mão em mão.

Uma reserva é por item inteiro, mesmo com `quantidade > 1` — dividir "7 panos de prato"
entre quatro pessoas gera mais confusão do que presente. Para soltar um item, o casal
cancela a reserva pelo `×` no selo da linha, no painel. O diálogo de confirmação mostra
nome, telefone (com link do WhatsApp) e data da reserva: do outro lado tem alguém que
talvez já tenha comprado, então dá pra avisar antes de soltar.

---

## Métricas

Todas calculadas no cliente em `src/composables/useItems.js`:

| Métrica | Cálculo |
|---|---|
| Total geral estimado | soma de `preco_estimado` |
| Total compra pessoal | soma onde `tipo = 'Compra pessoal'` |
| Total chá de casa nova | soma onde `tipo = 'Chá de Panela'` |
| Já gasto | soma de `preco_real` dos itens comprados |
| Falta gastar | soma de `preco_estimado` dos itens a comprar |
| Reservado | soma de `preco_estimado` dos itens a comprar **que já têm reserva** |
| Falta em aberto | `Falta gastar − Reservado` — o que sobra de fato por nossa conta |
| Comprados / total | contagem |

"Reservado" só conta item que ainda não foi comprado. Depois que entra em casa, quem
pagou vira assunto de *Já gasto*; contar de novo ali inflaria o "falta".

### "Chá de casa nova" na tela, `'Chá de Panela'` no banco

O rótulo mudou; o valor guardado não. `'Chá de Panela'` está no `check` de `items.tipo`,
nas 59 linhas já gravadas, na view `presentes_publicos` e em `reservar_presente()` —
renomear seria migração de dados, não troca de texto.

A tradução vive num lugar só: `TIPO_ROTULO` / `rotuloTipo()` em `src/lib/constants.js`.
Quem monta `<option>` ou chip de filtro usa o valor como `value` e o rótulo como texto.
Se um dia o valor no banco for migrado, esse mapa some junto.

`preco_estimado` é o valor **total do lote** (`quantidade × preco_unitario`), igual à
planilha — ex.: `Cabides`, 40 unidades a R$ 1,50, R$ 60,00 pelo conjunto.

Nota: a planilha original tinha as fórmulas de *Compra pessoal* e *Chá de casa nova*
quebradas (mostravam `R$ 0,00`). Aqui os valores corretos aparecem: R$ 14.430,00
e R$ 22.610,00.

---

## Deploy

Build estático — qualquer host serve. Vercel, Netlify, Cloudflare Pages:

- Build command: `npm run build`
- Output: `dist`
- Variáveis de ambiente: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`

Como o app usa `createWebHistory`, o host precisa fazer fallback de todas as rotas
para `index.html` (Vercel e Netlify fazem isso sozinhos para SPAs; em outros, é o
`try_files`/rewrite equivalente).

---

## Estrutura

```
src/
├── style.css            tokens de cor/tipo/movimento, tema escuro, keyframes
├── lib/
│   ├── supabase.js      cliente
│   ├── format.js        formatBRL / parseBRL / formatTelefone / linkWhatsApp
│   ├── constants.js     categorias, prioridades, disponibilidade
│   ├── theme.js         <- as 19 cores da casa
│   └── fotos.js         <- edite aqui para trocar fotos e textos da capa
├── composables/
│   ├── useAuth.js       sessão, login, logout
│   ├── useItems.js      CRUD + métricas + reservas (painel)
│   ├── usePresentes.js  lista pública + reservar  (nunca fala com `items`)
│   ├── useAutoRefresh.js  repete uma busca a cada 5s; pausa com a aba escondida
│   ├── useConvidado.js  nome/celular de quem já reservou, no aparelho
│   ├── useTecladoVirtual.js  viewport visual em CSS vars, p/ modais com teclado
│   ├── useConfig.js     cor da casa + mostrar fotos, vindos do banco
│   ├── useFotos.js      quais fotos aparecem agora (dev + interruptor)
│   ├── useTheme.js      tema e cor, persistidos no aparelho
│   └── useOnboarding.js flag do tour
├── views/
│   ├── PortalView.vue     `/`           a porta da casa
│   ├── PresentesView.vue  `/presentes`  a lista dos convidados
│   ├── LoginView.vue      `/login`
│   └── HomeView.vue       `/painel`     o app do casal
└── components/
    ├── Casinha.vue      motivo da casa, 4 variantes
    ├── HeroCapa.vue     capa em tela cheia
    ├── PhotoStrip.vue   faixa lateral de fotos
    ├── Lightbox.vue
    ├── AppHeader.vue    aparece quando a capa sai de cena
    ├── ThemeToggle.vue
    ├── AccentPicker.vue  o diálogo "Aparência da casa"
    ├── WelcomeTour.vue
    ├── MarcaPrioridade.vue
    ├── MetricsPanel.vue
    ├── ItemFilters.vue  chips + bottom sheet; os grupos vêm por prop
    ├── ItemList.vue
    ├── ItemRow.vue
    ├── ItemFormModal.vue
    ├── PresenteFaixa.vue  uma linha da lista pública
    ├── ReservaModal.vue   nome + celular, e a comemoração
    └── ConfirmarCancelamentoReserva.vue

supabase/
├── schema.sql          tabela items, RLS
├── reservas.sql        reservas, view pública, reservar_presente()
└── configuracoes.sql   cor da casa + mostrar fotos (linha única)
```

Fontes (Fraunces + Instrument Sans) e ícones (lucide) são self-hosted: nenhuma
requisição externa, funciona offline.
