import { onMounted, onBeforeUnmount } from 'vue'

/**
 * Publica o viewport VISUAL como variaveis CSS em <html>:
 *
 *   --vv-h     altura visivel agora (encolhe quando o teclado abre)
 *   --vv-top   deslocamento do topo (o iOS empurra a pagina ao focar um campo)
 *
 * Por que isso e necessario: `position: fixed` se ancora no viewport de LAYOUT,
 * e o teclado virtual nao mexe nele — nem `100svh`, que e um valor calculado
 * sem teclado. Quem encolhe e o viewport visual. Sem estas variaveis, um bottom
 * sheet encosta no fundo de uma tela que esta atras do teclado, levando junto os
 * botoes que a pessoa precisa alcancar.
 *
 * Onde `visualViewport` nao existe, nada e escrito e o CSS cai no fallback do
 * `var(--vv-h, 100svh)` — ou seja, o comportamento de antes, sem quebrar.
 */
const raiz = typeof document !== 'undefined' ? document.documentElement : null

let usos = 0

function aplicar() {
  const vv = window.visualViewport
  if (!vv || !raiz) return
  raiz.style.setProperty('--vv-h', `${vv.height}px`)
  raiz.style.setProperty('--vv-top', `${vv.offsetTop}px`)
}

export function useTecladoVirtual() {
  onMounted(() => {
    const vv = window.visualViewport
    if (!vv) return

    usos += 1
    if (usos === 1) {
      // `scroll` junto com `resize`: no iOS o offsetTop muda enquanto o teclado
      // ja esta aberto, e so o resize deixaria o painel fora de lugar.
      vv.addEventListener('resize', aplicar)
      vv.addEventListener('scroll', aplicar)
    }
    aplicar()
  })

  onBeforeUnmount(() => {
    const vv = window.visualViewport
    if (!vv) return

    usos -= 1
    if (usos > 0) return

    vv.removeEventListener('resize', aplicar)
    vv.removeEventListener('scroll', aplicar)
    raiz?.style.removeProperty('--vv-h')
    raiz?.style.removeProperty('--vv-top')
  })
}
