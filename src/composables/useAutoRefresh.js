import { onMounted, onBeforeUnmount } from 'vue'

/**
 * Repete uma busca enquanto a tela estiver aberta e visivel.
 *
 * Nao usa setInterval de proposito: se uma resposta demorar mais que o
 * intervalo — 4G de festa, 40 convidados na mesma antena — o interval continua
 * disparando e as chamadas empilham, chegando fora de ordem. Aqui o proximo
 * ciclo so e agendado quando o anterior termina, entao existe no maximo uma
 * requisicao em voo.
 *
 * Aba escondida nao consulta nada (visibilitychange), e ao voltar dispara na
 * hora em vez de esperar o ciclo: quem volta pro app quer ver o estado agora.
 * Isso tambem corta a maior parte do trafego — celular no bolso com a aba
 * aberta e o caso comum.
 */
export function useAutoRefresh(fn, { intervalo = 5000 } = {}) {
  let timer = null
  let rodando = false
  let vivo = false

  function agendar() {
    clearTimeout(timer)
    if (!vivo || document.hidden) return
    timer = setTimeout(ciclo, intervalo)
  }

  async function ciclo() {
    if (rodando) return
    rodando = true
    try {
      await fn()
    } catch {
      // Uma falha nao pode matar o ciclo: a rede volta, a tela se recupera.
    } finally {
      rodando = false
      agendar()
    }
  }

  function aoTrocarVisibilidade() {
    if (document.hidden) {
      clearTimeout(timer)
      return
    }
    ciclo()
  }

  onMounted(() => {
    vivo = true
    document.addEventListener('visibilitychange', aoTrocarVisibilidade)
    agendar()
  })

  onBeforeUnmount(() => {
    vivo = false
    clearTimeout(timer)
    document.removeEventListener('visibilitychange', aoTrocarVisibilidade)
  })
}
