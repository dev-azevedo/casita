/**
 * Importa os itens de "Casita - Itens da Casa.csv" para a tabela `items`.
 *
 * Precisa da SECRET key (Project Settings > API Keys > SUPABASE_SECRET_KEY,
 * "sb_secret_...", a antiga service_role). Ela ignora a RLS — por isso fica so
 * aqui, passada por variavel de ambiente, nunca no .env nem no bundle do front.
 *
 * Uso (PowerShell):
 *   $env:SUPABASE_SECRET_KEY = "sb_secret_..."; npm run seed
 *
 * Uso (bash):
 *   SUPABASE_SECRET_KEY="sb_secret_..." npm run seed
 *
 * Flags:
 *   --force   apaga tudo que ja existe antes de inserir
 *   --dry     so mostra o que seria inserido, nao escreve nada
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CSV = resolve(raiz, 'Casita - Itens da Casa.csv')

const force = process.argv.includes('--force')
const dry = process.argv.includes('--dry')

// --- .env -------------------------------------------------------------------

function lerEnv() {
  try {
    const texto = readFileSync(resolve(raiz, '.env'), 'utf8')
    const out = {}
    for (const linha of texto.split(/\r?\n/)) {
      const m = linha.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
    return out
  } catch {
    return {}
  }
}

const env = { ...lerEnv(), ...process.env }
const url = env.VITE_SUPABASE_URL

// Aceita o nome novo do painel e o antigo.
const secretKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY

if (!url) morrer('VITE_SUPABASE_URL nao encontrada. Preencha o .env.')
if (!secretKey) {
  morrer(
    'SUPABASE_SECRET_KEY vazia.\n' +
      '  Pegue em Project Settings > API Keys > SUPABASE_SECRET_KEY ("sb_secret_...")\n' +
      '  e cole no .env na linha SUPABASE_SECRET_KEY=\n' +
      '  (sem prefixo VITE_ — assim ela nao vai para o bundle do navegador)',
  )
}

if (secretKey.startsWith('sb_publishable_')) {
  morrer('Essa e a PUBLISHABLE key. O seed precisa da SECRET key ("sb_secret_...").')
}

// --- CSV --------------------------------------------------------------------

/** Parser de CSV com suporte a campos entre aspas e virgula dentro deles. */
function parseCSV(texto) {
  const linhas = []
  let campo = ''
  let linha = []
  let dentroAspas = false

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]

    if (dentroAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"'
          i++
        } else {
          dentroAspas = false
        }
      } else {
        campo += c
      }
      continue
    }

    if (c === '"') dentroAspas = true
    else if (c === ',') {
      linha.push(campo)
      campo = ''
    } else if (c === '\n') {
      linha.push(campo)
      linhas.push(linha)
      linha = []
      campo = ''
    } else if (c !== '\r') {
      campo += c
    }
  }

  if (campo !== '' || linha.length) {
    linha.push(campo)
    linhas.push(linha)
  }
  return linhas
}

/** "R$1.200,00" -> 1200 | "" -> null  (mesma logica de src/lib/format.js) */
function parseBRL(valor) {
  if (valor == null) return null
  const limpo = String(valor)
    .replace(/R\$/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()
  if (limpo === '') return null
  const n = Number(limpo)
  return Number.isFinite(n) ? n : null
}

const linhas = parseCSV(readFileSync(CSV, 'utf8'))

// Linha 4 do arquivo (indice 3) e o cabecalho. Dados comecam no indice 4
// e terminam na primeira linha em branco — depois dela vem o bloco de totais.
const CABECALHO = 3
const registros = []

for (let i = CABECALHO + 1; i < linhas.length; i++) {
  const cols = linhas[i]
  const categoria = (cols[0] ?? '').trim()
  const nome = (cols[1] ?? '').trim()

  if (!categoria && !nome) break // fim da lista
  if (!categoria || !nome) continue

  const status = (cols[3] ?? '').trim() || 'A comprar'
  const precoReal = parseBRL(cols[7])
  const quantidade = Number((cols[5] ?? '').trim()) || 1
  const totalDoLote = parseBRL(cols[6]) ?? 0

  registros.push({
    categoria,
    item: nome,
    prioridade: (cols[2] ?? '').trim() || 'Essencial',
    status,
    tipo: (cols[4] ?? '').trim() || 'Chá de Panela',
    quantidade,
    // A planilha traz o total do lote; o banco guarda o unitario e recalcula o
    // total (coluna gerada). 4 casas porque com 2 o total geral saia R$ 0,02
    // diferente — "Pano de pratos" (7 un. por R$ 20,00) nao divide redondo.
    preco_unitario: Math.round((totalDoLote / quantidade) * 10000) / 10000,
    preco_real: status === 'Comprado' ? precoReal : null,
    link: (cols[8] ?? '').trim() || null,
    observacoes: (cols[9] ?? '').trim() || null,
  })
}

if (!registros.length) morrer('Nenhum item encontrado no CSV.')

// --- Totais para conferencia ------------------------------------------------

// Mesma conta da coluna gerada no Postgres: round(quantidade * unitario, 2).
const totalDe = (r) => Math.round(r.quantidade * r.preco_unitario * 100) / 100
const soma = (lista) => lista.reduce((acc, r) => acc + totalDe(r), 0)
const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const totais = {
  geral: soma(registros),
  pessoal: soma(registros.filter((r) => r.tipo === 'Compra pessoal')),
  cha: soma(registros.filter((r) => r.tipo === 'Chá de Panela')),
  comprados: registros.filter((r) => r.status === 'Comprado').length,
}

console.log(`\nCSV lido: ${registros.length} itens`)
console.log(`  Total geral estimado ..... ${brl(totais.geral)}`)
console.log(`  Compra pessoal ........... ${brl(totais.pessoal)}`)
console.log(`  Chá de casa nova ......... ${brl(totais.cha)}`)
console.log(`  Comprados ................ ${totais.comprados} / ${registros.length}\n`)

if (dry) {
  console.log('--dry: nada foi escrito no banco.')
  process.exit(0)
}

// --- Insercao ---------------------------------------------------------------

const supabase = createClient(url, secretKey, { auth: { persistSession: false } })

async function contar() {
  const { count, error } = await supabase.from('items').select('*', { count: 'exact', head: true })
  if (error) morrer(`Falha ao consultar a tabela: ${error.message}\n  (a tabela existe? rodou o supabase/schema.sql?)`)
  return count ?? 0
}

const count = await contar()
console.log(`Conectado. A tabela tem ${count} itens hoje.`)

if (count > 0) {
  if (!force) {
    morrer(
      `A tabela ja tem ${count} itens. Rode com --force para apagar tudo e reimportar:\n` +
        '  npm run seed -- --force',
    )
  }
  console.log(`--force: apagando ${count} itens existentes…`)
  const { error } = await supabase.from('items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) morrer(`Falha ao limpar: ${error.message}`)
}

const { error } = await supabase.from('items').insert(registros)
if (error) {
  morrer(
    `Falha ao inserir: ${error.message}` +
      (error.details ? `\n  detalhes: ${error.details}` : '') +
      (error.hint ? `\n  dica: ${error.hint}` : ''),
  )
}

// Confere no banco em vez de confiar so no retorno do insert.
const depois = await contar()
if (depois < registros.length) {
  morrer(
    `Insert nao deu erro, mas a tabela ficou com ${depois} itens (esperado ${registros.length}).`,
  )
}

console.log(`${registros.length} itens inseridos. Tabela agora tem ${depois}.`)

function morrer(msg) {
  console.error(`\nERRO: ${msg}\n`)
  process.exit(1)
}
