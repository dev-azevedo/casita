import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { PRIORIDADE_ORDEM } from '@/lib/constants'

/**
 * Lado publico da lista — o que o convidado enxerga.
 *
 * REGRA UNICA DESTE ARQUIVO: ele nunca fala com a tabela `items`.
 * Toda leitura passa por `presentes_publicos`, uma view que nao tem as colunas
 * de preco (supabase/reservas.sql). Se um dia alguem precisar de um campo novo
 * aqui, o lugar de adicionar e a view, nao um `from('items')` — foi assim que a
 * garantia de "convidado nao ve preco" deixou de depender de memoria humana.
 *
 * Mesmo padrao dos outros composables: estado no escopo do modulo, entao as
 * duas telas publicas compartilham a mesma lista.
 */
const presentes = ref([])
const loading = ref(false)
const error = ref(null)

function ordenar(list) {
  return [...list].sort((a, b) => {
    if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria, 'pt-BR')
    const pa = PRIORIDADE_ORDEM[a.prioridade] ?? 99
    const pb = PRIORIDADE_ORDEM[b.prioridade] ?? 99
    if (pa !== pb) return pa - pb
    return a.item.localeCompare(b.item, 'pt-BR')
  })
}

/**
 * A funcao no banco sobe codigos curtos; o convidado merece portugues. Mesma
 * ideia do MENSAGENS_ERRO em useAuth.js.
 */
const MENSAGENS_ERRO = {
  JA_RESERVADO: 'Alguém reservou esse item agora mesmo. Escolhe outro?',
  ITEM_INDISPONIVEL: 'Esse item saiu da lista. Dá uma olhada nos outros.',
  NOME_INVALIDO: 'Escreve seu nome completo pra gente saber quem foi.',
  TELEFONE_INVALIDO: 'Confere o celular: DDD + número, só os dígitos.',
}

function traduzir(mensagem) {
  const chave = Object.keys(MENSAGENS_ERRO).find((k) => mensagem?.includes(k))
  return chave ? MENSAGENS_ERRO[chave] : 'Não deu pra reservar agora. Tenta de novo em instantes.'
}

export function usePresentes() {
  /**
   * `silencioso` e o modo do auto-refresh: nao acende `loading` (senao a tela
   * inteira piscaria a cada 5 segundos) e, principalmente, nao apaga a lista
   * quando a rede falha. Um tunel de 10 segundos nao pode esvaziar a tela de
   * quem estava escolhendo presente — a ultima lista boa continua valendo ate a
   * proxima resposta chegar.
   */
  async function fetchPresentes({ silencioso = false } = {}) {
    if (!silencioso) {
      loading.value = true
      error.value = null
    }
    const { data, error: err } = await supabase.from('presentes_publicos').select('*')
    if (err) {
      if (!silencioso) {
        error.value = err.message
        presentes.value = []
      }
    } else {
      presentes.value = ordenar(data ?? [])
      error.value = null
    }
    if (!silencioso) loading.value = false
  }

  /**
   * Toda a validacao real acontece no banco (a funcao e security definer e nao
   * confia no que chega). Aqui so mandamos digitos e traduzimos a resposta.
   */
  const marcarReservado = (itemId) => {
    const alvo = presentes.value.find((p) => p.id === itemId)
    if (alvo) alvo.reservado = true
  }

  async function reservar(itemId, nome, telefone) {
    const { error: err } = await supabase.rpc('reservar_presente', {
      p_item_id: itemId,
      p_nome: nome,
      p_telefone: telefone,
    })

    if (err) {
      // Perdeu a corrida: o banco acabou de dizer que o item saiu. Corrigir a
      // lista aqui faz a tela toda concordar na hora, sem esperar o proximo
      // ciclo de refresh — inclusive o modal, que troca para o aviso.
      if (/JA_RESERVADO|ITEM_INDISPONIVEL/.test(err.message ?? '')) marcarReservado(itemId)
      throw new Error(traduzir(err.message))
    }

    // Marca em memoria em vez de refetch: o convidado ve o selo trocar no mesmo
    // frame em que o modal comemora.
    marcarReservado(itemId)
  }

  const total = computed(() => presentes.value.length)
  const reservados = computed(() => presentes.value.filter((p) => p.reservado).length)
  const progresso = computed(() => (total.value ? reservados.value / total.value : 0))

  return {
    presentes,
    loading,
    error,
    fetchPresentes,
    reservar,
    total,
    reservados,
    progresso,
  }
}
