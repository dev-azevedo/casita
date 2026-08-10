import { computed } from 'vue'
import { TODAS } from '@/lib/fotos'
import { useConfig } from '@/composables/useConfig'

/**
 * As fotos que a tela pode mostrar agora.
 *
 * Dois portoes, por motivos diferentes:
 *
 *   1. DESENVOLVIMENTO — sao 14 JPEGs grandes que o Vite serve sem otimizar, e
 *      public/fotos/ esta no .gitignore (quem clona nao tem os arquivos).
 *      Resolvido em build time: no bundle de producao a checagem some.
 *
 *   2. APARENCIA — o casal pode desligar as fotos pelo painel, e isso vale para
 *      todo mundo, inclusive quem abre o link de convidado. Vem do banco, entao
 *      precisa ser reativo — foi por isso que `FOTOS` deixou de ser constante.
 *
 * Toda tela que consome isto ja lida com lista vazia: capa e portal caem no
 * campo de gradiente, a faixa de miniaturas some.
 */
const DISPONIVEIS = import.meta.env.PROD ? TODAS : []

export function useFotos() {
  const { mostrarFotos } = useConfig()

  const fotos = computed(() => (mostrarFotos.value ? DISPONIVEIS : []))
  const capa = computed(() => fotos.value[0] ?? null)

  /** Para distinguir "não tem foto" de "está desligado", nas dicas da capa. */
  const ocultasPelaAparencia = computed(() => !mostrarFotos.value && DISPONIVEIS.length > 0)
  const ehDev = !import.meta.env.PROD

  return { fotos, capa, ocultasPelaAparencia, ehDev }
}
