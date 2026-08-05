<script setup>
import { ref, computed } from 'vue'
import { Search, SlidersHorizontal, X } from '@lucide/vue'
import { CATEGORIAS, PRIORIDADES, STATUS, TIPOS } from '@/lib/constants'

const filtros = defineModel({ type: Object, required: true })

const aberto = ref(false)

const GRUPOS = [
  { chave: 'categoria', rotulo: 'Cômodo', opcoes: CATEGORIAS },
  { chave: 'prioridade', rotulo: 'Prioridade', opcoes: PRIORIDADES },
  { chave: 'status', rotulo: 'Status', opcoes: STATUS },
  { chave: 'tipo', rotulo: 'Tipo', opcoes: TIPOS },
]

const ativos = computed(() => GRUPOS.filter((g) => filtros.value[g.chave]))

function limpar() {
  filtros.value = { busca: '', categoria: '', prioridade: '', status: '', tipo: '' }
}

function alternar(chave, valor) {
  filtros.value[chave] = filtros.value[chave] === valor ? '' : valor
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-2">
      <!-- Busca sempre visível: é o filtro mais usado -->
      <div class="relative min-w-0 flex-1 basis-52">
        <Search
          :size="16"
          :stroke-width="2"
          class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint"
        />
        <input
          v-model="filtros.busca"
          type="search"
          placeholder="Buscar item…"
          aria-label="Buscar item"
          class="w-full rounded-full border border-line-strong bg-surface-1 py-3 pr-4 pl-10 text-sm text-ink transition-colors outline-none placeholder:text-ink-faint focus:border-accent"
        />
      </div>

      <button
        type="button"
        class="flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"
        :class="
          ativos.length
            ? 'border-accent bg-accent-soft text-accent-ink'
            : 'border-line bg-surface-1 text-ink-soft hover:border-ink-faint'
        "
        :aria-expanded="aberto"
        @click="aberto = true"
      >
        <SlidersHorizontal :size="15" :stroke-width="2" />
        Filtros
        <span v-if="ativos.length" class="tnum">({{ ativos.length }})</span>
      </button>
    </div>

    <!-- Chips do que está ativo, removível com um toque -->
    <div v-if="ativos.length" class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="g in ativos"
        :key="g.chave"
        type="button"
        class="flex items-center gap-1.5 rounded-full bg-accent-soft py-1.5 pr-2 pl-3 text-xs font-medium text-accent-ink transition-opacity hover:opacity-75"
        @click="filtros[g.chave] = ''"
      >
        {{ filtros[g.chave] }}
        <X :size="13" :stroke-width="2.4" />
      </button>
      <button
        type="button"
        class="rounded-full px-3 py-1.5 text-xs text-ink-faint transition-colors hover:text-ink"
        @click="limpar"
      >
        limpar tudo
      </button>
    </div>

    <!-- Bottom sheet no celular, painel centralizado no desktop -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div
          v-if="aberto"
          class="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
          style="background: var(--scrim)"
          @click.self="aberto = false"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            class="max-h-[85svh] w-full overflow-y-auto rounded-t-3xl border-t border-line bg-surface-0 sm:max-w-md sm:rounded-3xl sm:border"
            style="
              animation: surgir 320ms cubic-bezier(0.16, 1, 0.3, 1);
              padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
            "
          >
            <div class="sticky top-0 flex items-center justify-between bg-surface-0 px-6 pt-5 pb-3">
              <h3 class="text-lg font-semibold text-ink">Filtros</h3>
              <button
                type="button"
                aria-label="Fechar filtros"
                class="grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-2"
                @click="aberto = false"
              >
                <X :size="19" :stroke-width="2" />
              </button>
            </div>

            <div class="space-y-6 px-6 pt-2">
              <fieldset v-for="g in GRUPOS" :key="g.chave">
                <legend class="mb-2.5 text-xs tracking-[0.16em] text-ink-faint uppercase">
                  {{ g.rotulo }}
                </legend>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="op in g.opcoes"
                    :key="op"
                    type="button"
                    class="min-h-11 rounded-full border px-4 text-sm transition-colors"
                    :class="
                      filtros[g.chave] === op
                        ? 'border-accent bg-accent-soft font-medium text-accent-ink'
                        : 'border-line text-ink-soft hover:border-ink-faint'
                    "
                    :aria-pressed="filtros[g.chave] === op"
                    @click="alternar(g.chave, op)"
                  >
                    {{ op }}
                  </button>
                </div>
              </fieldset>
            </div>

            <div class="mt-8 flex gap-3 px-6">
              <button
                type="button"
                class="min-h-12 flex-1 rounded-full border border-line text-sm text-ink-soft transition-colors hover:bg-surface-1"
                @click="limpar"
              >
                Limpar
              </button>
              <button
                type="button"
                class="min-h-12 flex-1 rounded-full bg-accent text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
                @click="aberto = false"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
