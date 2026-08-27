import { CHAVES } from '@/lib/theme'
import { telefoneCanonico } from '@/lib/format'

/**
 * Quem esta usando este aparelho.
 *
 * O convidado nao tem conta — e nem deve ter, pediria senha para dar presente.
 * Mas quem reserva um item costuma reservar outro, e digitar nome e celular de
 * novo a cada vez e o tipo de atrito que faz a pessoa desistir do segundo.
 *
 * O TELEFONE SOZINHO JA VALE. Quem digita o celular na pergunta de abertura sem
 * nunca ter reservado nada nao tem nome para guardar — e mesmo assim aquele
 * numero e util: reaparece pronto no formulario da primeira reserva. Por isso
 * `ler()` so exige telefone; nome vem vazio ate a primeira reserva dar certo.
 *
 * Guarda so o que ela mesma escreveu, no proprio aparelho. Nada disso vai para
 * o banco alem da reserva que ela confirmou.
 *
 * Isto e uma COMODIDADE, nao uma credencial: quem prova a identidade e o
 * telefone conferido no banco por minhas_reservas() (supabase/reservas.sql).
 * Aparelho novo nao tem nada aqui — e por isso a lista pergunta o celular.
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
      const tel = telefoneCanonico(telefone)
      if (!tel) return null
      return { nome: nome ? String(nome) : '', telefone: tel }
    } catch {
      return null
    }
  }

  /**
   * Nome so entra depois de uma reserva confirmada — tentativa que falhou nao e
   * dado. Telefone pode entrar sozinho, vindo da pergunta de abertura, e nesse
   * caso `nome` chega vazio de proposito.
   */
  function salvar(nome, telefone) {
    try {
      localStorage.setItem(
        CHAVES.convidado,
        JSON.stringify({ nome: String(nome ?? '').trim(), telefone: telefoneCanonico(telefone) }),
      )
    } catch {
      // ignora
    }
  }

  /**
   * "Nao e voce?" — aparelho da familia passa de mao em mao.
   *
   * Limpa TAMBEM a dispensa: quem diz "sou outra pessoa" volta ao estado de
   * primeira visita, e a proxima a pegar o celular merece a pergunta de novo.
   */
  function limpar() {
    try {
      localStorage.removeItem(CHAVES.convidado)
      localStorage.removeItem(CHAVES.identificacaoDispensada)
    } catch {
      // ignora
    }
  }

  /** Clicou "ainda nao reservei": a pergunta nao volta sozinha neste aparelho. */
  function dispensar() {
    try {
      localStorage.setItem(CHAVES.identificacaoDispensada, '1')
    } catch {
      // ignora
    }
  }

  function foiDispensado() {
    try {
      return localStorage.getItem(CHAVES.identificacaoDispensada) === '1'
    } catch {
      return false
    }
  }

  return { ler, salvar, limpar, dispensar, foiDispensado }
}
