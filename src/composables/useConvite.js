import { ref } from 'vue'

/**
 * O convite do cha de casa nova, em tela cheia.
 *
 * Diferente do tour (useOnboarding), este NAO e "so na primeira vez": o link vai
 * circular no WhatsApp e o convite e a primeira coisa que a pessoa deve ver, a
 * cada vez que abre o app.
 *
 * "A cada vez que abre" e por carregamento de pagina, nao por rota: navegar do
 * portal para a lista nao e abrir o app de novo, e ver o convite pular na frente
 * no meio do caminho seria interrupcao, nao boas-vindas. Dai o `jaAbriu`, que
 * vive no modulo e morre junto com a aba.
 */
const visivel = ref(false)
let jaAbriu = false

export function useConvite() {
  /** Chamado ao entrar numa rota publica: abre uma vez por carregamento. */
  function verificar() {
    if (jaAbriu) return
    jaAbriu = true
    visivel.value = true
  }

  /** Botoes "Ver convite": abrem sempre, quantas vezes o convidado quiser. */
  function abrir() {
    visivel.value = true
  }

  function fechar() {
    visivel.value = false
  }

  return { visivel, verificar, abrir, fechar }
}
