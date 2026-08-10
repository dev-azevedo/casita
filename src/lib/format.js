const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/** 1200 -> "R$ 1.200,00" */
export function formatBRL(value) {
  return brl.format(Number(value) || 0)
}

/**
 * Converte o formato da planilha em numero.
 * "R$1.200,00" -> 1200   |   "R$60,00" -> 60   |   "" / null -> null
 */
export function parseBRL(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value

  const cleaned = String(value)
    .replace(/R\$/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()

  if (cleaned === '') return null

  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/** 0.4237 -> "42%" */
export function formatPercent(ratio) {
  return `${Math.round((Number(ratio) || 0) * 100)}%`
}

/** "(11) 98888-7777" -> "11988887777" */
export function soDigitos(value) {
  return String(value ?? '').replace(/\D/g, '')
}

/**
 * Telefone e guardado so em digitos (o banco exige ^[0-9]{10,11}$ e o link do
 * wa.me nao aceita pontuacao). A mascara existe so para ler.
 *
 * "11988887777" -> "(11) 98888-7777"   |   "1138887777" -> "(11) 3888-7777"
 * Numero incompleto volta parcialmente formatado, para a mascara acompanhar a
 * digitacao em vez de so aparecer no ultimo caractere.
 */
export function formatTelefone(value) {
  const d = soDigitos(value).slice(0, 11)
  if (d.length <= 2) return d
  const ddd = `(${d.slice(0, 2)})`
  if (d.length <= 6) return `${ddd} ${d.slice(2)}`
  const corte = d.length > 10 ? 7 : 6
  return `${ddd} ${d.slice(2, corte)}-${d.slice(corte)}`
}

const data = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })

/** '2026-08-03T14:22:00Z' -> '3 de agosto de 2026' */
export function formatData(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : data.format(d)
}

/** Numero brasileiro para o formato que o wa.me espera (55 + DDD + numero). */
export function linkWhatsApp(telefone) {
  const d = soDigitos(telefone)
  return d ? `https://wa.me/55${d}` : null
}
