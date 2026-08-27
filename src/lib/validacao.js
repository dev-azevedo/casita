/**
 * Regras de nome e telefone do convidado, num lugar so.
 *
 * A mesma reserva pode nascer de tres lugares — o convidado no ReservaModal, o
 * casal no ReservarPorAdmin e a funcao reservar_presente() no banco. As duas
 * primeiras compartilham este arquivo; a terceira e o piso de servidor e
 * continua repetindo a regra em plpgsql de proposito (ver supabase/reservas.sql).
 *
 * As funcoes devolvem CODIGO, nao frase. O convidado ouve "Coloca o sobrenome
 * tambem."; o casal ouve "Falta o sobrenome do convidado." — mesma regra, vozes
 * diferentes. Mesmo padrao dos MENSAGENS_ERRO em useAuth.js e usePresentes.js.
 */

/**
 * Particulas de ligacao. Em "Jose da Silva" o sobrenome e "Silva", nao "da" —
 * sem esta lista, "Ana Da" passava como nome completo.
 */
export const PARTICULAS = new Set([
  'da',
  'das',
  'de',
  'del',
  'des',
  'di',
  'do',
  'dos',
  'du',
  'e',
  'la',
  'le',
  'van',
  'von',
  'y',
])

/**
 * '' | 'VAZIO' | 'SEM_SOBRENOME'
 *
 * Duas palavras de verdade: 2+ letras e que nao sejam particula. A primeira
 * posicao nunca e particula — "Van Gogh" comeca com nome, nao com ligacao.
 * Errar para o lado de aceitar e melhor do que recusar nome real: a lista e de
 * convidados de casamento, nao de cadastro bancario.
 */
export function codigoErroNome(valor) {
  const partes = String(valor ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!partes.length) return 'VAZIO'
  const proprias = partes.filter(
    (p, i) => p.length >= 2 && (i === 0 || !PARTICULAS.has(p.toLowerCase())),
  )
  return proprias.length < 2 ? 'SEM_SOBRENOME' : ''
}

/**
 * '' | 'VAZIO' | 'INCOMPLETO'
 *
 * Recebe SO DIGITOS (passe por soDigitos antes). 11 = DDD + o 9: fixo nao
 * recebe WhatsApp, e e por ali que a entrega vai ser combinada.
 */
export function codigoErroTelefone(digitos) {
  const d = String(digitos ?? '')
  if (!d.length) return 'VAZIO'
  return d.length === 11 ? '' : 'INCOMPLETO'
}

/** Espaco repetido some: "Ana   Souza" vira "Ana Souza". */
export function normalizarNome(valor) {
  return String(valor ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}
