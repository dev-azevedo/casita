import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { PRIORIDADE_ORDEM } from '@/lib/constants'

const items = ref([])
const loading = ref(false)
const error = ref(null)

/**
 * Quantas escritas estao em voo. O auto-refresh nao busca enquanto houver
 * alguma: um refetch que sai antes do PATCH pode voltar depois dele e
 * sobrescrever a linha recem-salva com o valor antigo — na tela, o item volta
 * sozinho para "A comprar" segundos depois de ser marcado como comprado.
 */
let mutacoesEmVoo = 0

async function comMutacao(fn) {
  mutacoesEmVoo += 1
  try {
    return await fn()
  } finally {
    mutacoesEmVoo -= 1
  }
}

const num = (v) => Number(v) || 0

function ordenar(list) {
  return [...list].sort((a, b) => {
    if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria, 'pt-BR')
    const pa = PRIORIDADE_ORDEM[a.prioridade] ?? 99
    const pb = PRIORIDADE_ORDEM[b.prioridade] ?? 99
    if (pa !== pb) return pa - pb
    return a.item.localeCompare(b.item, 'pt-BR')
  })
}

export function useItems() {
  /**
   * `silencioso` e o modo do auto-refresh: nao acende `loading` (a lista
   * inteira sumiria a cada 5 segundos), nao apaga o que ja esta na tela quando
   * a rede falha, e cede a vez para qualquer escrita em andamento.
   */
  async function fetchItems({ silencioso = false } = {}) {
    if (silencioso && mutacoesEmVoo > 0) return

    if (!silencioso) {
      loading.value = true
      error.value = null
    }
    // A reserva vem junto pelo relacionamento de chave estrangeira. E array
    // porque PostgREST devolve assim, mas o indice unico em reservas.item_id
    // garante no maximo um elemento.
    const { data, error: err } = await supabase
      .from('items')
      .select('*, reservas(id, nome, telefone, created_at)')

    // Uma escrita pode ter terminado enquanto esta busca voltava; nesse caso a
    // resposta ja nasceu velha e aplica-la desfaria o que acabou de ser salvo.
    if (silencioso && mutacoesEmVoo > 0) return

    if (err) {
      if (!silencioso) {
        error.value = err.message
        items.value = []
      }
    } else {
      items.value = ordenar(data ?? [])
      error.value = null
    }
    if (!silencioso) loading.value = false
  }

  const addItem = (payload) =>
    comMutacao(async () => {
      const { data, error: err } = await supabase
        .from('items')
        .insert(sanitize(payload))
        // Mesmo embed do fetch: sem ele o retorno vem sem `reservas` e o selo do
        // convidado sumiria da linha ao marcar o item como comprado.
        .select('*, reservas(id, nome, telefone, created_at)')
        .single()
      if (err) throw new Error(err.message)
      items.value = ordenar([...items.value, data])
      return data
    })

  const updateItem = (id, patch) =>
    comMutacao(async () => {
      const { data, error: err } = await supabase
        .from('items')
        .update(sanitize(patch))
        .eq('id', id)
        // Mesmo embed do fetch: sem ele o retorno vem sem `reservas` e o selo do
        // convidado sumiria da linha ao marcar o item como comprado.
        .select('*, reservas(id, nome, telefone, created_at)')
        .single()
      if (err) throw new Error(err.message)
      items.value = ordenar(items.value.map((i) => (i.id === id ? data : i)))
      return data
    })

  const deleteItem = (id) =>
    comMutacao(async () => {
      const { error: err } = await supabase.from('items').delete().eq('id', id)
      if (err) throw new Error(err.message)
      items.value = items.value.filter((i) => i.id !== id)
    })

  /**
   * Reserva feita pelo casal, em nome de um convidado que avisou por fora — no
   * grupo da familia, no corredor do predio, por WhatsApp.
   *
   * Escreve direto em `reservas` em vez de chamar reservar_presente(): aquela
   * funcao existe para o anonimo e recusa item que nao esteja na lista publica
   * (ITEM_INDISPONIVEL). O casal ve a lista inteira e decide sobre ela inteira;
   * a policy de `authenticated` ja permite. Quem impede reserva dupla continua
   * sendo o indice unico, nao uma checagem daqui.
   *
   * `telefone` tem que chegar so em digitos — o check da coluna e ^[0-9]{10,11}$.
   */
  const reservarItem = (itemId, nome, telefone) =>
    comMutacao(async () => {
      const { data, error: err } = await supabase
        .from('reservas')
        .insert({ item_id: itemId, nome, telefone })
        // Mesmas colunas do embed em fetchItems: sem elas o selo do convidado
        // nasceria vazio na linha ate o proximo ciclo de refresh.
        .select('id, nome, telefone, created_at')
        .single()
      if (err) {
        // 23505 = unique_violation em reservas_item_unico. Um convidado clicou
        // no mesmo item enquanto o dialogo estava aberto.
        throw new Error(
          err.code === '23505'
            ? 'Um convidado reservou esse item agora mesmo. Atualize a lista para ver quem foi.'
            : err.message,
        )
      }
      const alvo = items.value.find((i) => i.id === itemId)
      if (alvo) alvo.reservas = [data]
      return data
    })

  /**
   * Convidado desistiu, mandou mensagem dizendo que nao vai dar, comprou outra
   * coisa. Some a reserva e o item volta a aparecer disponivel na lista publica.
   */
  const cancelarReserva = (reservaId) =>
    comMutacao(async () => {
      const { error: err } = await supabase.from('reservas').delete().eq('id', reservaId)
      if (err) throw new Error(err.message)
      for (const item of items.value) {
        if (item.reservas?.some((r) => r.id === reservaId)) {
          item.reservas = item.reservas.filter((r) => r.id !== reservaId)
        }
      }
    })

  /** Alterna comprado/a comprar. Ao desmarcar, limpa o preco real. */
  async function toggleComprado(item, precoReal = null) {
    const comprando = item.status !== 'Comprado'
    return updateItem(item.id, {
      status: comprando ? 'Comprado' : 'A comprar',
      preco_real: comprando ? precoReal : null,
    })
  }

  // Os totalizadores seguem o que esta na tela. A funcao pura mora no fim do
  // arquivo; aqui ficam so os numeros da lista inteira, que e o que o resto do
  // app (o tour de boas-vindas, por exemplo) espera enxergar.
  const metrics = computed(() => calcularMetricas(items.value))
  const porPrioridade = computed(() => calcularPorPrioridade(items.value))

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    reservarItem,
    cancelarReserva,
    toggleComprado,
    metrics,
    porPrioridade,
  }
}

/**
 * Remove campos gerenciados pelo banco e normaliza vazios em null.
 *
 * `preco_estimado` sai junto: no Postgres ele e coluna GERADA
 * (quantidade x preco_unitario) e escrever nela e erro. O app so manda
 * `preco_unitario`; o total volta calculado no select.
 *
 * `reservas` tambem: e uma tabela vizinha que veio no embed, nao uma coluna de
 * items. Mandar de volta num update quebra o PostgREST.
 */
function sanitize(payload) {
  const { id, created_at, updated_at, preco_estimado, reservas, ...rest } = payload
  const out = {}
  for (const [key, value] of Object.entries(rest)) {
    out[key] = value === '' ? null : value
  }
  return out
}

// --- Metricas (rodape da planilha, recalculado ao vivo) ----------------------
//
// Funcoes puras, e nao computeds sobre `items`, porque o painel precisa dos
// mesmos numeros para DOIS conjuntos: a lista inteira e o recorte que o filtro
// deixou na tela. Filtrar "Cozinha" e continuar lendo o preco da casa toda
// obrigava a somar de cabeca.

const somaEstimado = (lista) => lista.reduce((acc, i) => acc + num(i.preco_estimado), 0)

export function calcularMetricas(lista) {
  const comprados = lista.filter((i) => i.status === 'Comprado')
  const aComprar = lista.filter((i) => i.status !== 'Comprado')

  /**
   * Item que um convidado ja chamou de seu. So conta o que ainda nao foi
   * comprado: depois que entra em casa, quem pagou vira assunto de `jaGasto` e
   * contar de novo aqui inflaria o "falta".
   */
  const reservadosPendentes = aComprar.filter((i) => (i.reservas?.length ?? 0) > 0)

  const total = lista.length
  const faltaGastar = somaEstimado(aComprar)
  const reservado = somaEstimado(reservadosPendentes)

  return {
    totalGeral: somaEstimado(lista),
    totalPessoal: somaEstimado(lista.filter((i) => i.tipo === 'Compra pessoal')),
    totalChaPanela: somaEstimado(lista.filter((i) => i.tipo === 'Chá de Panela')),
    jaGasto: comprados.reduce((acc, i) => acc + num(i.preco_real), 0),
    faltaGastar,
    /** Quanto os convidados ja assumiram. */
    reservado,
    itensReservados: reservadosPendentes.length,
    /** O que sobra de fato para o casal — reservas descontadas. */
    faltaEmAberto: faltaGastar - reservado,
    comprados: comprados.length,
    total,
    progresso: total ? comprados.length / total : 0,
  }
}

export function calcularPorPrioridade(lista) {
  return Object.keys(PRIORIDADE_ORDEM).map((prioridade) => {
    const doGrupo = lista.filter((i) => i.prioridade === prioridade)
    return {
      prioridade,
      total: doGrupo.length,
      comprados: doGrupo.filter((i) => i.status === 'Comprado').length,
      estimado: somaEstimado(doGrupo),
    }
  })
}
