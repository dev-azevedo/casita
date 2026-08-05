import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { PRIORIDADE_ORDEM } from '@/lib/constants'

const items = ref([])
const loading = ref(false)
const error = ref(null)

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
  async function fetchItems() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase.from('items').select('*')
    if (err) {
      error.value = err.message
      items.value = []
    } else {
      items.value = ordenar(data ?? [])
    }
    loading.value = false
  }

  async function addItem(payload) {
    const { data, error: err } = await supabase
      .from('items')
      .insert(sanitize(payload))
      .select()
      .single()
    if (err) throw new Error(err.message)
    items.value = ordenar([...items.value, data])
    return data
  }

  async function updateItem(id, patch) {
    const { data, error: err } = await supabase
      .from('items')
      .update(sanitize(patch))
      .eq('id', id)
      .select()
      .single()
    if (err) throw new Error(err.message)
    items.value = ordenar(items.value.map((i) => (i.id === id ? data : i)))
    return data
  }

  async function deleteItem(id) {
    const { error: err } = await supabase.from('items').delete().eq('id', id)
    if (err) throw new Error(err.message)
    items.value = items.value.filter((i) => i.id !== id)
  }

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

  const metrics = computed(() => {
    const total = items.value.length
    return {
      totalGeral: somaEstimado(items.value),
      totalPessoal: somaEstimado(items.value.filter((i) => i.tipo === 'Compra pessoal')),
      totalChaPanela: somaEstimado(items.value.filter((i) => i.tipo === 'Chá de Panela')),
      jaGasto: comprados.value.reduce((acc, i) => acc + num(i.preco_real), 0),
      faltaGastar: somaEstimado(aComprar.value),
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
 */
function sanitize(payload) {
  const { id, created_at, updated_at, preco_estimado, ...rest } = payload
  const out = {}
  for (const [key, value] of Object.entries(rest)) {
    out[key] = value === '' ? null : value
  }
  return out
}
