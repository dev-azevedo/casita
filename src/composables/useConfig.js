import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { CHAVES, COR_PADRAO, corPorId } from '@/lib/theme'
import { useTheme } from '@/composables/useTheme'

/**
 * Aparencia da casa — a parte que e de todos.
 *
 * Cor e "mostrar fotos" vivem em public.configuracoes, uma linha so, e valem
 * para o casal E para os convidados. Sem isto, quem abria o link do WhatsApp
 * pegava sempre o verde padrao: a decoracao da festa nao chegava em quem foi
 * convidado.
 *
 * O tema claro/escuro NAO esta aqui de proposito — ver o comentario em
 * src/lib/theme.js. Aquilo e de quem esta olhando.
 */
const mostrarFotos = ref(true)
const erro = ref('')

let iniciado = false

function lerCache() {
  try {
    const bruto = localStorage.getItem(CHAVES.config)
    return bruto ? JSON.parse(bruto) : null
  } catch {
    return null
  }
}

/**
 * Alem do proprio espelho, reescreve `casita:cor` e `casita:hc` — as chaves que
 * o script inline do index.html le ANTES da primeira pintura. E o que faz a
 * segunda visita do convidado abrir ja na cor certa, sem tocar no index.html.
 */
function gravarCache(cor, fotos) {
  const preset = corPorId(cor)
  try {
    localStorage.setItem(CHAVES.config, JSON.stringify({ cor, mostrarFotos: fotos }))
    localStorage.setItem(CHAVES.cor, preset.id)
    localStorage.setItem(CHAVES.hc, `${preset.h} ${preset.c}`)
  } catch {
    // Navegacao privada bloqueia. Pior caso: pisca de novo na proxima visita.
  }
}

function aplicar(cor, fotos) {
  useTheme().definirCor(cor ?? COR_PADRAO)
  mostrarFotos.value = fotos ?? true
  gravarCache(cor ?? COR_PADRAO, mostrarFotos.value)
}

export function useConfig() {
  /**
   * Falha de rede nao zera nada: mantem o ultimo valor bom. Um tunel nao pode
   * devolver o app ao verde padrao no meio da festa.
   */
  async function fetchConfig() {
    const { data, error: err } = await supabase
      .from('configuracoes')
      .select('cor, mostrar_fotos')
      .maybeSingle()

    if (err || !data) return
    aplicar(data.cor, data.mostrar_fotos)
  }

  /** Cache primeiro (instantaneo), rede depois — sem travar a montagem. */
  function initConfig() {
    if (iniciado) return
    iniciado = true

    const cache = lerCache()
    if (cache) {
      useTheme().definirCor(cache.cor ?? COR_PADRAO)
      mostrarFotos.value = cache.mostrarFotos ?? true
    }

    fetchConfig()
  }

  /**
   * Otimista: aplica na hora e grava depois. Escolher cor precisa responder no
   * mesmo frame do clique — esperar a rede para repintar pareceria travamento.
   * Se o banco recusar, volta ao valor anterior e diz o porque.
   */
  async function salvar(patch) {
    const { corId } = useTheme()
    const anterior = { cor: corId.value, mostrarFotos: mostrarFotos.value }

    erro.value = ''
    aplicar(patch.cor ?? anterior.cor, patch.mostrarFotos ?? anterior.mostrarFotos)

    const { error: err } = await supabase
      .from('configuracoes')
      .update({
        ...(patch.cor !== undefined && { cor: patch.cor }),
        ...(patch.mostrarFotos !== undefined && { mostrar_fotos: patch.mostrarFotos }),
      })
      .eq('id', true)

    if (err) {
      aplicar(anterior.cor, anterior.mostrarFotos)
      erro.value = 'Não deu pra salvar. Tenta de novo.'
    }
  }

  const salvarCor = (cor) => salvar({ cor })
  const salvarMostrarFotos = (v) => salvar({ mostrarFotos: v })

  return { mostrarFotos, erro, initConfig, fetchConfig, salvarCor, salvarMostrarFotos }
}
