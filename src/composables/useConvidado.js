import { CHAVES } from '@/lib/theme'
import { soDigitos } from '@/lib/format'

/**
 * Quem ja reservou algo neste aparelho.
 *
 * O convidado nao tem conta — e nem deve ter, pediria senha para dar presente.
 * Mas quem reserva um item costuma reservar outro, e digitar nome e celular de
 * novo a cada vez e o tipo de atrito que faz a pessoa desistir do segundo.
 *
 * Guarda so o que ela mesma escreveu, no proprio aparelho. Nada disso vai para
 * o banco alem da reserva que ela confirmou.
 *
 * localStorage sempre em try/catch: em navegacao privada o acesso lanca, e uma
 * excecao aqui derrubaria a tela inteira por causa de uma comodidade.
 */
export function useConvidado() {
  function ler() {
    try {
      const bruto = localStorage.getItem(CHAVES.convidado)
      if (!bruto) return null
      const { nome, telefone } = JSON.parse(bruto)
      if (!nome || !telefone) return null
      return { nome: String(nome), telefone: soDigitos(telefone) }
    } catch {
      return null
    }
  }

  /** Chamado so depois da reserva dar certo — tentativa que falhou nao e dado. */
  function salvar(nome, telefone) {
    try {
      localStorage.setItem(
        CHAVES.convidado,
        JSON.stringify({ nome: String(nome).trim(), telefone: soDigitos(telefone) }),
      )
    } catch {
      // ignora
    }
  }

  /** "Nao e voce?" — aparelho da familia passa de mao em mao. */
  function limpar() {
    try {
      localStorage.removeItem(CHAVES.convidado)
    } catch {
      // ignora
    }
  }

  return { ler, salvar, limpar }
}
