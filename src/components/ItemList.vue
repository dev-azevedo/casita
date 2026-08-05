<script setup>
import { computed } from 'vue'
import ItemRow from './ItemRow.vue'
import Casinha from './Casinha.vue'
import { formatBRL } from '@/lib/format'

const props = defineProps({
  items: { type: Array, required: true },
  temFiltro: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'edit', 'remove', 'limpar'])

/** items já chega ordenado por categoria/prioridade do useItems. */
const grupos = computed(() => {
  const mapa = new Map()
  for (const item of props.items) {
    if (!mapa.has(item.categoria)) mapa.set(item.categoria, [])
    mapa.get(item.categoria).push(item)
  }
  return [...mapa.entries()].map(([categoria, itens]) => ({
    categoria,
    itens,
    estimado: itens.reduce((acc, i) => acc + (Number(i.preco_estimado) || 0), 0),
    comprados: itens.filter((i) => i.status === 'Comprado').length,
  }))
})
</script>

<template>
  <div v-if="grupos.length" class="space-y-12">
    <section
      v-for="(grupo, gi) in grupos"
      :key="grupo.categoria"
      class="surgir group/lista"
      :style="{ '--i': Math.min(gi, 8) }"
    >
      <header
        class="sticky top-16 z-20 -mx-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-1 py-3"
        style="background: color-mix(in oklch, var(--surface-0) 92%, transparent); backdrop-filter: blur(8px)"
      >
        <h3 class="text-lg font-semibold text-ink">{{ grupo.categoria }}</h3>
        <p class="tnum text-sm text-ink-faint">
          {{ grupo.comprados }}/{{ grupo.itens.length }} · {{ formatBRL(grupo.estimado) }}
        </p>
      </header>

      <ul>
        <ItemRow
          v-for="item in grupo.itens"
          :key="item.id"
          :item="item"
          @toggle="(i, preco) => emit('toggle', i, preco)"
          @edit="emit('edit', $event)"
          @remove="emit('remove', $event)"
        />
      </ul>
    </section>
  </div>

  <!-- Estado vazio que ensina o próximo passo -->
  <div v-else class="flex flex-col items-center gap-5 py-20 text-center">
    <Casinha variante="caixas" :tamanho="104" class="text-ink-faint" />
    <div>
      <p class="text-lg font-medium text-ink">Nada por aqui.</p>
      <p class="mx-auto mt-1.5 max-w-[34ch] text-sm text-ink-soft">
        {{
          temFiltro
            ? 'Nenhum item combina com esses filtros. Tenta soltar um deles.'
            : 'A lista está vazia. Adiciona o primeiro item pelo botão +.'
        }}
      </p>
    </div>
    <button
      v-if="temFiltro"
      type="button"
      class="min-h-11 rounded-full border border-line px-5 text-sm text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
      @click="emit('limpar')"
    >
      Limpar filtros
    </button>
  </div>
</template>
