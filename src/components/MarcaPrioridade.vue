<script setup>
import { PRIORIDADE_COR } from '@/lib/constants'

/**
 * Marca de prioridade.
 *
 * Cor E forma, nunca só cor: vermelho e amarelo ficam praticamente iguais para
 * quem tem deuteranopia (~6% dos homens). A forma resolve isso sem depender de
 * enxergar matiz —
 *
 *   Essencial  ● disco cheio
 *   Importante ◐ meio disco
 *   Desejável  ○ anel vazado
 */
defineProps({
  prioridade: { type: String, required: true },
  tamanho: { type: Number, default: 10 },
})
</script>

<template>
  <svg
    :width="tamanho"
    :height="tamanho"
    viewBox="0 0 12 12"
    class="shrink-0"
    :style="{ color: PRIORIDADE_COR[prioridade] }"
    role="img"
    :aria-label="prioridade"
  >
    <title>{{ prioridade }}</title>

    <circle v-if="prioridade === 'Essencial'" cx="6" cy="6" r="5" fill="currentColor" />

    <template v-else-if="prioridade === 'Importante'">
      <circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" stroke-width="1.6" />
      <path d="M6 1.8a4.2 4.2 0 0 1 0 8.4Z" fill="currentColor" />
    </template>

    <circle v-else cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" stroke-width="1.6" />
  </svg>
</template>
