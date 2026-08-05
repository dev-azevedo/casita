<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { X, ChevronRight } from '@lucide/vue'
import { CATEGORIAS, PRIORIDADES, STATUS, TIPOS } from '@/lib/constants'
import { formatBRL } from '@/lib/format'

const props = defineProps({
  /** null = criar novo; objeto = editar */
  item: { type: Object, default: null },
  /** Controlados pelo parent: ele é quem fala com o Supabase. */
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save'])

const vazio = () => ({
  categoria: CATEGORIAS[0],
  item: '',
  prioridade: 'Essencial',
  status: 'A comprar',
  tipo: 'Chá de Panela',
  quantidade: 1,
  preco_unitario: null,
  preco_real: null,
  link: '',
  observacoes: '',
})

const form = ref(vazio())
const painel = ref(null)
const primeiroCampo = ref(null)

watch(
  () => props.item,
  (novo) => {
    form.value = novo ? { ...novo } : vazio()
  },
  { immediate: true },
)

const editando = computed(() => !!props.item)

const quantidade = computed(() => Number(form.value.quantidade) || 0)
const unitario = computed(() => Number(form.value.preco_unitario) || 0)

/** Espelha a coluna gerada do Postgres: round(quantidade * unitario, 2). */
const totalEstimado = computed(() => Math.round(quantidade.value * unitario.value * 100) / 100)

function aoTeclar(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', aoTeclar)
  document.body.style.overflow = 'hidden'
  primeiroCampo.value?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', aoTeclar)
  document.body.style.overflow = ''
})

function onSubmit() {
  emit('save', {
    ...form.value,
    quantidade: Number(form.value.quantidade) || 1,
    // preco_estimado nao vai: e coluna gerada no banco.
    preco_unitario: Number(form.value.preco_unitario) || 0,
    preco_real:
      form.value.status === 'Comprado' &&
      form.value.preco_real !== null &&
      form.value.preco_real !== ''
        ? Number(form.value.preco_real)
        : null,
  })
}

const campo =
  'w-full min-h-12 rounded-xl border border-line-strong bg-surface-0 px-3.5 text-ink outline-none transition-colors focus:border-accent'
const rotulo = 'mb-1.5 block text-xs uppercase tracking-[0.14em] text-ink-faint'
</script>

<template>
  <div
    class="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-4"
    style="background: var(--scrim)"
    @click.self="emit('close')"
  >
    <form
      ref="painel"
      role="dialog"
      aria-modal="true"
      :aria-label="editando ? 'Editar item' : 'Novo item'"
      class="max-h-[92svh] w-full overflow-y-auto rounded-t-3xl border-t border-line bg-surface-1 sm:max-w-lg sm:rounded-3xl sm:border"
      style="
        animation: surgir 340ms cubic-bezier(0.16, 1, 0.3, 1);
        padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
      "
      @submit.prevent="onSubmit"
    >
      <div
        class="sticky top-0 z-10 flex items-center justify-between border-b border-line-soft bg-surface-1 px-6 py-4"
      >
        <h2 class="text-lg font-semibold text-ink">{{ editando ? 'Editar item' : 'Novo item' }}</h2>
        <button
          type="button"
          aria-label="Fechar"
          class="grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-2"
          @click="emit('close')"
        >
          <X :size="19" :stroke-width="2" />
        </button>
      </div>

      <div class="space-y-4 px-6 pt-5">
        <div>
          <label :class="rotulo" for="f-item">O que é</label>
          <input
            id="f-item"
            ref="primeiroCampo"
            v-model="form.item"
            required
            :class="campo"
            placeholder="Ex: Jogo de panelas"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2 sm:col-span-1">
            <label :class="rotulo" for="f-categoria">Cômodo</label>
            <select id="f-categoria" v-model="form.categoria" :class="campo">
              <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label :class="rotulo" for="f-prioridade">Prioridade</label>
            <select id="f-prioridade" v-model="form.prioridade" :class="campo">
              <option v-for="p in PRIORIDADES" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div>
            <label :class="rotulo" for="f-tipo">Tipo</label>
            <select id="f-tipo" v-model="form.tipo" :class="campo">
              <option v-for="t in TIPOS" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div>
            <label :class="rotulo" for="f-status">Status</label>
            <select id="f-status" v-model="form.status" :class="campo">
              <option v-for="s in STATUS" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div>
            <label :class="rotulo" for="f-qtd">Quantidade</label>
            <input
              id="f-qtd"
              v-model="form.quantidade"
              type="number"
              min="1"
              step="1"
              inputmode="numeric"
              :class="[campo, 'tnum']"
            />
          </div>
          <div>
            <label :class="rotulo" for="f-unitario">Preço por unidade</label>
            <input
              id="f-unitario"
              v-model="form.preco_unitario"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              :class="[campo, 'tnum']"
            />
          </div>
        </div>

        <!-- Total: valor exibido, não campo. Quem manda é quantidade x unitário,
             e é o banco que calcula — aqui só mostramos a mesma conta ao vivo. -->
        <div class="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-accent-soft px-3.5 py-3">
          <span class="text-sm text-accent-ink">Total estimado</span>
          <span class="tnum text-right">
            <span class="text-lg font-semibold text-accent-ink">{{ formatBRL(totalEstimado) }}</span>
            <span v-if="quantidade > 1" class="ml-2 text-xs text-accent-ink/70">
              {{ quantidade }} × {{ formatBRL(unitario) }}
            </span>
          </span>
        </div>

        <div v-if="form.status === 'Comprado'">
          <label :class="rotulo" for="f-real">Quanto pagou</label>
          <input
            id="f-real"
            v-model="form.preco_real"
            type="number"
            min="0"
            step="0.01"
            inputmode="decimal"
            :class="[campo, 'tnum']"
          />
        </div>

        <!-- Secundário fica recolhido: começa simples -->
        <details class="group rounded-xl border border-line-soft">
          <summary
            class="flex min-h-12 cursor-pointer list-none items-center gap-2 px-3.5 text-sm text-ink-soft"
          >
            <ChevronRight
              :size="15"
              :stroke-width="2"
              class="transition-transform duration-200 group-open:rotate-90"
            />
            Link e observações
          </summary>
          <div class="space-y-4 px-3.5 pt-1 pb-4">
            <div>
              <label :class="rotulo" for="f-link">Link</label>
              <input id="f-link" v-model="form.link" type="url" :class="campo" placeholder="https://…" />
            </div>
            <div>
              <label :class="rotulo" for="f-obs">Observações</label>
              <textarea id="f-obs" v-model="form.observacoes" rows="2" :class="[campo, 'py-3']" />
            </div>
          </div>
        </details>
      </div>

      <p v-if="error" class="mx-6 mt-4 rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger">
        {{ error }}
      </p>

      <div class="mt-6 flex gap-3 px-6">
        <button
          type="button"
          class="min-h-12 rounded-full px-5 text-sm text-ink-soft transition-colors hover:bg-surface-2"
          @click="emit('close')"
        >
          Cancelar
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="min-h-12 flex-1 rounded-full bg-accent px-5 font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {{ saving ? 'Salvando…' : 'Salvar' }}
        </button>
      </div>
    </form>
  </div>
</template>
