import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { telefoneCanonico } from '@/lib/format'
import { useConvidado } from './useConvidado'

/**
 * As reservas DESTE convidado, de qualquer navegador.
 *
 * O problema que isto resolve: quem reservava num aparelho e abria a lista em
 * outro nao tinha como saber o que ja era seu — a view publica so diz que o
 * item saiu, nunca para quem (supabase/reservas.sql). O localStorage do
 * useConvidado ajudava no aparelho antigo e em nenhum outro.
 *
 * A identidade e o telefone, conferido no banco pela funcao minhas_reservas().
 * Nada aqui decide o que e de quem: o front manda o numero e recebe de volta so
 * as linhas que casaram. Nome e telefone de terceiros nunca chegam neste
 * processo — nao ha o que vazar no DevTools.
 *
 * Estado no escopo do modulo, igual usePresentes.js e useItems.js: o modal de
 * identificacao e a lista falam do mesmo convidado.
 */
const telefone = ref('')
/** item_id -> { nome, telefone, created_at }. Vazio = ninguem identificado. */
const minhas = ref(new Map())
const carregando = ref(false)
const erro = ref('')

const MENSAGENS_ERRO = {
  TELEFONE_INVALIDO: 'Confere o celular: DDD + número, 11 dígitos.',
  RESERVA_NAO_ENCONTRADA: 'Essa reserva não está mais no seu nome. Atualiza a página.',
}

function traduzir(mensagem) {
  const chave = Object.keys(MENSAGENS_ERRO).find((k) => mensagem?.includes(k))
  if (chave) return MENSAGENS_ERRO[chave]
  // Cai aqui quando o banco falou algo que nao e um dos nossos codigos — quase
  // sempre "Could not find the function ... in the schema cache", ou seja,
  // supabase/reservas.sql nao foi executado. A tela mostra a frase gentil; o
  // console mostra o que realmente aconteceu, senao vira adivinhacao.
  console.error('[minhas reservas] erro cru do banco:', mensagem)
  return 'Não deu pra falar com a lista agora. Tenta de novo.'
}

function preencher(linhas) {
  const mapa = new Map()
  for (const r of linhas ?? []) mapa.set(r.item_id, r)
  minhas.value = mapa
}

export function useMinhasReservas() {
  const { ler, salvar, limpar } = useConvidado()

  const identificado = computed(() => !!telefone.value)
  const quantas = computed(() => minhas.value.size)

  async function buscar(tel) {
    const { data, error: err } = await supabase.rpc('minhas_reservas', { p_telefone: tel })
    if (err) throw new Error(traduzir(err.message))
    return data ?? []
  }

  /**
   * Assume um telefone. Devolve quantas reservas ele tem (0 tambem e resposta
   * boa) ou -1 se nem deu para perguntar.
   *
   * NADA AQUI SEGURA A PESSOA. Zero reserva e o caso comum — quem ainda vai
   * escolher — e ate falha de rede fecha a pergunta: a identidade e local, a
   * consulta e bonus. O numero serve para duas coisas independentes da resposta
   * do banco: marcar na lista o que ja e seu, e chegar pronto no formulario da
   * primeira reserva. O ciclo de auto-refresh recupera o resto quando a rede
   * voltar.
   */
  async function identificar(bruto) {
    const tel = telefoneCanonico(bruto)
    carregando.value = true
    erro.value = ''
    // Sem reserva nao ha nome vindo do banco. Preserva o que ja estava no
    // aparelho quando e o mesmo numero (o casal pode ter cancelado a reserva
    // dela); troca de numero comeca do zero.
    const anterior = ler()
    const nomeAnterior = anterior?.telefone === tel ? anterior.nome : ''
    telefone.value = tel
    try {
      const linhas = await buscar(tel)
      preencher(linhas)
      salvar(linhas[0]?.nome ?? nomeAnterior, tel)
      return linhas.length
    } catch (e) {
      erro.value = e.message
      salvar(nomeAnterior, tel)
      return -1
    } finally {
      carregando.value = false
    }
  }

  /**
   * Ciclo do auto-refresh. Silenciosa pelo mesmo motivo do fetchPresentes: um
   * tunel de 10 segundos nao pode apagar da tela o que a pessoa acabou de ver
   * como seu. A ultima resposta boa continua valendo.
   */
  async function recarregar() {
    if (!telefone.value) return
    try {
      preencher(await buscar(telefone.value))
    } catch {
      // ignora: a proxima volta arruma
    }
  }

  /** Volta ao anonimato neste aparelho. Nao mexe em nada no banco. */
  function esquecer() {
    telefone.value = ''
    minhas.value = new Map()
    erro.value = ''
    limpar()
  }

  async function cancelar(itemId) {
    const { error: err } = await supabase.rpc('cancelar_reserva', {
      p_item_id: itemId,
      p_telefone: telefone.value,
    })
    if (err) {
      // Se o banco diz que a reserva nao e mais dela, a tela tem que concordar
      // na hora — deixar o item marcado como "seu" convida ao segundo clique.
      if (/RESERVA_NAO_ENCONTRADA/.test(err.message ?? '')) minhas.value.delete(itemId)
      throw new Error(traduzir(err.message))
    }
    minhas.value.delete(itemId)
  }

  /**
   * Reserva recem-confirmada: entra no mapa sem esperar o proximo ciclo, para o
   * selo virar "sua reserva" no mesmo frame. Mesmo espirito do marcarReservado
   * em usePresentes.js.
   */
  function registrarLocal(itemId, nomeConvidado, tel) {
    telefone.value = telefoneCanonico(tel)
    minhas.value.set(itemId, {
      item_id: itemId,
      nome: nomeConvidado,
      telefone: telefone.value,
      created_at: new Date().toISOString(),
    })
  }

  /**
   * Boot: quem ja reservou neste aparelho nao precisa ser perguntado. Devolve
   * true se assumiu uma identidade — a tela usa isso para decidir se abre o
   * modal.
   */
  async function restaurar() {
    const salvo = ler()
    if (!salvo?.telefone) return false
    telefone.value = salvo.telefone
    try {
      preencher(await buscar(salvo.telefone))
    } catch {
      // Sem rede no boot: mantem a identidade e tenta de novo no auto-refresh.
    }
    return true
  }

  return {
    telefone,
    minhas,
    carregando,
    erro,
    identificado,
    quantas,
    identificar,
    recarregar,
    esquecer,
    cancelar,
    registrarLocal,
    restaurar,
  }
}
