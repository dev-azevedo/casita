<script setup>
import { computed } from 'vue'
import { formatBRL, formatPercent } from '@/lib/format'
import Casinha from './Casinha.vue'
import MarcaPrioridade from './MarcaPrioridade.vue'

/**
 * Os numeros seguem o que esta na tela. Com filtro aplicado eles descrevem o
 * RECORTE, nao a casa — e e por isso que `filtrado` existe: "R$ 1.240 falta
 * gastar" lido como total da casa e pior do que numero nenhum.
 */
const props = defineProps({
  metrics: { type: Object, required: true },
  porPrioridade: { type: Array, required: true },
  /** Ha filtro valendo: os numeros sao de um pedaco da lista. */
  filtrado: { type: Boolean, default: false },
  /** Tamanho da lista inteira, para dizer de quanto e o pedaco. */
  totalItens: { type: Number, default: 0 },
})

defineEmits(['limpar'])

const pct = computed(() => Math.min(100, Math.max(0, props.metrics.progresso * 100)))
</script>

<template>
  <section aria-label="Resumo">
    <!-- Número herói: um só, grande. Não seis cards iguais. -->
    <div class="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
      <div class="min-w-0">
        <!-- A marca do recorte vive na sobrancelha, nao num selo ao lado: ela
             qualifica o numero de baixo, e e junto dele que precisa ser lida. -->
        <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p
            class="text-xs tracking-[0.2em] uppercase transition-colors duration-300"
            :class="filtrado ? 'text-accent' : 'text-ink-faint'"
          >
            Falta gastar
            <template v-if="filtrado">
              · recorte de
              <span class="tnum">{{ metrics.total }}</span> de
              <span class="tnum">{{ totalItens }}</span>
              {{ totalItens === 1 ? 'item' : 'itens' }}
            </template>
          </p>
          <button
            v-if="filtrado"
            type="button"
            class="min-h-9 text-xs text-ink-faint underline underline-offset-4 transition-colors hover:text-ink"
            @click="$emit('limpar')"
          >
            ver a casa inteira
          </button>
        </div>
        <p
          class="tnum mt-2 text-2xl font-semibold text-ink"
          style="font-variation-settings: 'SOFT' 70, 'WONK' 1, 'opsz' 144"
        >
          {{ formatBRL(metrics.faltaGastar) }}
        </p>

        <!-- Decomposição do herói, não um segundo herói: parte desse valor já
             tem dono. Só aparece quando existe reserva — sem convidado ainda,
             a linha seria só ruído. -->
        <p v-if="metrics.reservado > 0" class="tnum mt-2 text-sm text-ink-soft">
          <span class="font-medium text-accent">{{ formatBRL(metrics.reservado) }}</span>
          reservado em {{ metrics.itensReservados }}
          {{ metrics.itensReservados === 1 ? 'item' : 'itens' }} ·
          <span class="font-medium text-ink">{{ formatBRL(metrics.faltaEmAberto) }}</span>
          por nossa conta
        </p>
      </div>

      <dl class="flex flex-wrap gap-x-8 gap-y-4 text-sm">
        <div>
          <dt class="text-ink-faint">Já gasto</dt>
          <dd class="tnum mt-0.5 font-semibold text-accent">{{ formatBRL(metrics.jaGasto) }}</dd>
        </div>
        <div>
          <dt class="text-ink-faint">Chá de casa nova</dt>
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
