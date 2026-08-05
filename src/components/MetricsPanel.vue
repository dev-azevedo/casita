<script setup>
import { computed } from 'vue'
import { formatBRL, formatPercent } from '@/lib/format'
import Casinha from './Casinha.vue'
import MarcaPrioridade from './MarcaPrioridade.vue'

const props = defineProps({
  metrics: { type: Object, required: true },
  porPrioridade: { type: Array, required: true },
})

const pct = computed(() => Math.min(100, Math.max(0, props.metrics.progresso * 100)))
</script>

<template>
  <section aria-label="Resumo">
    <!-- Número herói: um só, grande. Não seis cards iguais. -->
    <div class="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
      <div>
        <p class="text-xs tracking-[0.2em] text-ink-faint uppercase">Falta gastar</p>
        <p
          class="tnum mt-2 text-2xl font-semibold text-ink"
          style="font-variation-settings: 'SOFT' 70, 'WONK' 1, 'opsz' 144"
        >
          {{ formatBRL(metrics.faltaGastar) }}
        </p>
      </div>

      <dl class="flex flex-wrap gap-x-8 gap-y-4 text-sm">
        <div>
          <dt class="text-ink-faint">Já gasto</dt>
          <dd class="tnum mt-0.5 font-semibold text-accent">{{ formatBRL(metrics.jaGasto) }}</dd>
        </div>
        <div>
          <dt class="text-ink-faint">Chá de panela</dt>
          <dd class="tnum mt-0.5 font-semibold text-ink">{{ formatBRL(metrics.totalChaPanela) }}</dd>
        </div>
        <div>
          <dt class="text-ink-faint">Compra pessoal</dt>
          <dd class="tnum mt-0.5 font-semibold text-ink">{{ formatBRL(metrics.totalPessoal) }}</dd>
        </div>
        <div>
          <dt class="text-ink-faint">Total estimado</dt>
          <dd class="tnum mt-0.5 font-semibold text-ink">{{ formatBRL(metrics.totalGeral) }}</dd>
        </div>
      </dl>
    </div>

    <!-- Progresso: a casa avança na ponta conforme a lista anda -->
    <div class="mt-10">
      <div class="mb-3 flex items-baseline justify-between">
        <p class="text-sm text-ink-soft">
          <span class="tnum font-semibold text-ink">{{ metrics.comprados }}</span>
          de
          <span class="tnum">{{ metrics.total }}</span>
          já em casa
        </p>
        <p class="tnum text-sm text-ink-faint">{{ formatPercent(metrics.progresso) }}</p>
      </div>

      <div
        class="relative h-1.5 rounded-full bg-surface-2"
        role="progressbar"
        :aria-valuenow="metrics.comprados"
        :aria-valuemin="0"
        :aria-valuemax="metrics.total"
        :aria-label="`${metrics.comprados} de ${metrics.total} itens comprados`"
      >
        <div
          class="h-full rounded-full bg-accent transition-[width] duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          :style="{ width: `${pct}%` }"
        />
        <!-- A casa fica na ponta do que já foi conquistado. -->
        <span
          class="absolute top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface-0 text-accent transition-[left] duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          :style="{ left: `${pct}%` }"
        >
          <Casinha variante="casa" :tamanho="22" />
        </span>
      </div>
    </div>

    <!-- Prioridades: linha de dados, não cards -->
    <ul class="mt-8 flex flex-wrap gap-x-7 gap-y-3">
      <li v-for="g in porPrioridade" :key="g.prioridade" class="flex items-center gap-2 text-sm">
        <MarcaPrioridade :prioridade="g.prioridade" :tamanho="11" />
        <span class="text-ink-soft">{{ g.prioridade }}</span>
        <span class="tnum text-ink-faint">{{ g.comprados }}/{{ g.total }}</span>
        <span class="tnum text-ink-faint">· {{ formatBRL(g.estimado) }}</span>
      </li>
    </ul>
  </section>
</template>
