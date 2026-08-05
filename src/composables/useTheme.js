import { ref, computed, watch } from 'vue'
import {
  CORES,
  GRUPOS_DE_COR,
  COR_PADRAO,
  TEMA_PADRAO,
  CHAVES,
  corPorId,
  aplicarNoDocumento,
} from '@/lib/theme'

// Estado global: um so por app, compartilhado por todos os componentes.
const tema = ref(TEMA_PADRAO)
const corId = ref(COR_PADRAO)
let iniciado = false

/** Le o que ja esta salvo e passa a reagir a mudanca de tema do sistema. */
export function initTheme() {
  if (iniciado) return
  iniciado = true

  try {
    tema.value = localStorage.getItem(CHAVES.tema) || TEMA_PADRAO
    corId.value = localStorage.getItem(CHAVES.cor) || COR_PADRAO
  } catch {
    // Modo privado em alguns navegadores bloqueia localStorage. Segue no padrao.
  }

  const inicial = aplicarNoDocumento(tema.value, corId.value)
  try {
    localStorage.setItem(CHAVES.hc, `${inicial.h} ${inicial.c}`)
  } catch {
    // ignora
  }

  // Com 'sistema', acompanhar o SO em tempo real.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (tema.value === 'sistema') aplicarNoDocumento(tema.value, corId.value)
  })

  watch([tema, corId], ([t, id]) => {
    const cor = aplicarNoDocumento(t, id)
    try {
      localStorage.setItem(CHAVES.tema, t)
      localStorage.setItem(CHAVES.cor, id)
      // Par ja resolvido, para o script inline do index.html nao duplicar a tabela.
      localStorage.setItem(CHAVES.hc, `${cor.h} ${cor.c}`)
    } catch {
      // ignora
    }
  })
}

export function useTheme() {
  const cor = computed(() => corPorId(corId.value))

  const escuro = computed(() => {
    if (tema.value === 'escuro') return true
    if (tema.value === 'claro') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  /** claro -> escuro -> sistema -> claro */
  function alternarTema() {
    tema.value = tema.value === 'claro' ? 'escuro' : tema.value === 'escuro' ? 'sistema' : 'claro'
  }

  function definirCor(id) {
    corId.value = id
  }

  return {
    tema,
    corId,
    cor,
    cores: CORES,
    grupos: GRUPOS_DE_COR,
    escuro,
    alternarTema,
    definirCor,
  }
}
