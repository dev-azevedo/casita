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
