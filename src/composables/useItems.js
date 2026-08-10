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

  // --- Metricas (rodape da planilha, recalculado ao vivo) -------------------

  const comprados = computed(() => items.value.filter((i) => i.status === 'Comprado'))
  const aComprar = computed(() => items.value.filter((i) => i.status !== 'Comprado'))

  const somaEstimado = (list) => list.reduce((acc, i) => acc + num(i.preco_estimado), 0)

  /**
   * Item que um convidado ja chamou de seu. So conta o que ainda nao foi
   * comprado: depois que entra em casa, quem pagou vira assunto de `jaGasto` e
   * contar de novo aqui inflaria o "falta".
   */
  const reservadosPendentes = computed(() =>
    aComprar.value.filter((i) => (i.reservas?.length ?? 0) > 0),
  )

  const metrics = computed(() => {
    const total = items.value.length
    const faltaGastar = somaEstimado(aComprar.value)
    const reservado = somaEstimado(reservadosPendentes.value)
    return {
      totalGeral: somaEstimado(items.value),
      totalPessoal: somaEstimado(items.value.filter((i) => i.tipo === 'Compra pessoal')),
      totalChaPanela: somaEstimado(items.value.filter((i) => i.tipo === 'Chá de Panela')),
      jaGasto: comprados.value.reduce((acc, i) => acc + num(i.preco_real), 0),
      faltaGastar,
      /** Quanto os convidados ja assumiram. */
      reservado,
      itensReservados: reservadosPendentes.value.length,
      /** O que sobra de fato para o casal — reservas descontadas. */
      faltaEmAberto: faltaGastar - reservado,
      comprados: comprados.value.length,
      total,
      progresso: total ? comprados.value.length / total : 0,
    }
  })

  const porPrioridade = computed(() =>
    Object.keys(PRIORIDADE_ORDEM).map((prioridade) => {
      const doGrupo = items.value.filter((i) => i.prioridade === prioridade)
      return {
        prioridade,
        total: doGrupo.length,
        comprados: doGrupo.filter((i) => i.status === 'Comprado').length,
        estimado: somaEstimado(doGrupo),
      }
    }),
  )

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
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
