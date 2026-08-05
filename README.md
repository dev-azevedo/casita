# 🏡 Casita

App privado para gerenciar os itens da casa nova. Home com fotos do casal e, abaixo,
a lista de itens com as métricas que ficavam no rodapé da planilha.

Vue 3 + Vite + Tailwind v4 + Supabase. Sem backend próprio.

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
  Chá de panela ............ R$ 22.610,00
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

### Vídeo de capa

`public/fotos/first_.mp4` (13 MB) está desligado. Para usá-lo como capa, descomente
`VIDEO_CAPA` em `src/lib/fotos.js`. Comprima antes para ~2–3 MB: a capa é a primeira
coisa que carrega, e 13 MB no 4G é caro.

---

## Tema e cor da casa

Tudo por aparelho (`localStorage`), sem backend. Cada um escolhe o seu.

- **Claro / escuro / sistema** — botão no topo. Um script inline no `index.html` pinta
  o tema antes da primeira pintura, então não há flash branco ao abrir no escuro.
- **28 cores** em três grupos — *Nossos verdes* (os pastéis musgo/oliva/sálvia),
  *Vivas* (os 17 matizes do Tailwind v4 no chroma máximo) e *Suaves* (neutros
  levemente tingidos). Definidas em `src/lib/theme.js`.

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

## Métricas

Todas calculadas no cliente em `src/composables/useItems.js`:

| Métrica | Cálculo |
|---|---|
| Total geral estimado | soma de `preco_estimado` |
| Total compra pessoal | soma onde `tipo = 'Compra pessoal'` |
| Total chá de panela | soma onde `tipo = 'Chá de Panela'` |
| Já gasto | soma de `preco_real` dos itens comprados |
| Falta gastar | soma de `preco_estimado` dos itens a comprar |
| Comprados / total | contagem |

`preco_estimado` é o valor **total do lote** (`quantidade × preco_unitario`), igual à
planilha — ex.: `Cabides`, 40 unidades a R$ 1,50, R$ 60,00 pelo conjunto.

Nota: a planilha original tinha as fórmulas de *Compra pessoal* e *Chá de panela*
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
│   ├── format.js        formatBRL / parseBRL
│   ├── constants.js     categorias, prioridades
│   ├── theme.js         <- as 19 cores da casa
│   └── fotos.js         <- edite aqui para trocar fotos e textos da capa
├── composables/
│   ├── useAuth.js       sessão, login, logout
│   ├── useItems.js      CRUD + métricas
│   ├── useTheme.js      tema e cor, persistidos no aparelho
│   └── useOnboarding.js flag do tour
├── views/
│   ├── LoginView.vue
│   └── HomeView.vue
└── components/
    ├── Casinha.vue      motivo da casa, 4 variantes
    ├── HeroCapa.vue     capa em tela cheia
    ├── PhotoStrip.vue   faixa lateral de fotos
    ├── Lightbox.vue
    ├── AppHeader.vue    aparece quando a capa sai de cena
    ├── ThemeToggle.vue
    ├── AccentPicker.vue
    ├── WelcomeTour.vue
    ├── MarcaPrioridade.vue
    ├── MetricsPanel.vue
    ├── ItemFilters.vue  chips + bottom sheet
    ├── ItemList.vue
    ├── ItemRow.vue
    └── ItemFormModal.vue
```

Fontes (Fraunces + Instrument Sans) e ícones (lucide) são self-hosted: nenhuma
requisição externa, funciona offline.
