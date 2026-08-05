<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Check, X } from '@lucide/vue'
import { useTheme } from '@/composables/useTheme'
import { amostraDaCor } from '@/lib/theme'

const props = defineProps({
  /** 'menu' no header, 'grade' no tour de boas-vindas */
  variante: { type: String, default: 'menu' },
})

const { grupos, corId, cor, escuro, definirCor } = useTheme()

const aberto = ref(false)

function aoTeclar(e) {
  if (e.key === 'Escape') aberto.value = false
}

onMounted(() => document.addEventListener('keydown', aoTeclar))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', aoTeclar)
  document.body.style.overflow = ''
})

// O painel sai do fluxo (Teleport), entao trava o scroll de fundo enquanto aberto.
watch(aberto, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})

/** Preview usa a mesma fórmula do --accent, então o que se vê é o que se aplica. */
const amostra = (c) => amostraDaCor(c, escuro.value)
</script>

<template>
  <!-- =============================================== GRADE (tour) -->
  <div v-if="props.variante === 'grade'" class="space-y-5">
    <section v-for="g in grupos" :key="g.grupo">
      <p class="mb-2.5 text-xs tracking-[0.16em] text-ink-faint uppercase">{{ g.grupo }}</p>
      <div class="flex flex-wrap gap-2.5">
        <button
          v-for="c in g.cores"
          :key="c.id"
          type="button"
          :title="c.nome"
          :aria-label="c.nome"
          :aria-pressed="corId === c.id"
          class="grid size-11 place-items-center rounded-full transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-110"
          :style="{
            background: amostra(c),
            boxShadow:
              corId === c.id
                ? '0 0 0 2px var(--surface-0), 0 0 0 4px var(--accent)'
                : '0 0 0 1px var(--line)',
          }"
          @click="definirCor(c.id)"
        >
          <Check v-if="corId === c.id" :size="17" :stroke-width="3" class="text-on-accent" />
        </button>
      </div>
    </section>

    <p class="pt-1 text-sm text-ink-soft">
      Escolhida: <strong class="font-medium text-ink">{{ cor.nome }}</strong>
    </p>
  </div>

  <!-- ================================================ MENU (header) -->
  <template v-else>
    <button
      type="button"
      :aria-expanded="aberto"
      :aria-label="`Cor da casa: ${cor.nome}. Trocar.`"
      :title="`Cor da casa: ${cor.nome}`"
      class="grid size-11 place-items-center rounded-full transition-colors hover:bg-surface-2"
      @click="aberto = true"
    >
      <span
        class="size-5 rounded-full"
        :style="{ background: amostra(cor), boxShadow: '0 0 0 1px var(--line-strong)' }"
      />
    </button>

    <!-- Teleport: dentro do header (fixed + backdrop-filter) o painel ficava preso
         no contexto de empilhamento e escapava da tela no celular. -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div
          v-if="aberto"
          class="fixed inset-0 z-[95] flex items-end justify-center sm:items-center sm:p-4"
          style="background: var(--scrim)"
          @click.self="aberto = false"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cor da casa"
            class="max-h-[85svh] w-full overflow-y-auto rounded-t-3xl border-t border-line bg-surface-0 sm:max-w-md sm:rounded-3xl sm:border"
            style="
              animation: surgir 320ms cubic-bezier(0.16, 1, 0.3, 1);
              padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
            "
          >
            <div
              class="sticky top-0 z-10 flex items-center justify-between bg-surface-0 px-6 pt-5 pb-3"
            >
              <div>
                <h3 class="text-lg font-semibold text-ink">Cor da casa</h3>
                <p class="text-sm text-ink-soft">{{ cor.nome }}</p>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                class="grid size-11 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-2"
                @click="aberto = false"
              >
                <X :size="19" :stroke-width="2" />
              </button>
            </div>

            <div class="space-y-5 px-6 pt-2">
              <section v-for="g in grupos" :key="g.grupo">
                <p class="mb-2.5 text-xs tracking-[0.16em] text-ink-faint uppercase">
                  {{ g.grupo }}
                </p>
                <div class="flex flex-wrap gap-2.5">
                  <button
                    v-for="c in g.cores"
                    :key="c.id"
                    type="button"
                    :title="c.nome"
                    :aria-label="c.nome"
                    :aria-pressed="corId === c.id"
                    class="grid size-11 place-items-center rounded-full transition-transform duration-150 hover:scale-110"
                    :style="{
                      background: amostra(c),
                      boxShadow:
                        corId === c.id
                          ? '0 0 0 2px var(--surface-0), 0 0 0 4px var(--accent)'
                          : '0 0 0 1px var(--line)',
                    }"
                    @click="definirCor(c.id)"
                  >
                    <Check
                      v-if="corId === c.id"
                      :size="16"
                      :stroke-width="3.2"
                      class="text-on-accent"
                    />
                  </button>
                </div>
              </section>
            </div>

            <div class="mt-7 px-6">
              <button
                type="button"
                class="min-h-12 w-full rounded-full bg-accent font-medium text-on-accent transition-colors hover:bg-accent-hover"
                @click="aberto = false"
              >
                Pronto
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </template>
</template>
