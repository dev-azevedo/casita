import { ref } from 'vue'
import { CHAVES } from '@/lib/theme'

const visivel = ref(false)

export function useOnboarding() {
  /** Chamado ao entrar na home: abre o tour so na primeira vez daquele aparelho. */
  function verificar() {
    try {
      visivel.value = !localStorage.getItem(CHAVES.tour)
    } catch {
      visivel.value = false
    }
  }

  function concluir() {
    visivel.value = false
    try {
      localStorage.setItem(CHAVES.tour, new Date().toISOString())
    } catch {
      // ignora
    }
  }

  /** Link do rodape, para rever quando quiser. */
  function reabrir() {
    visivel.value = true
  }

  return { visivel, verificar, concluir, reabrir }
}
