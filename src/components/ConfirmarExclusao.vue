<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { TriangleAlert } from '@lucide/vue'
import { formatBRL } from '@/lib/format'

const props = defineProps({
  item: { type: Object, required: true },
  excluindo: { type: Boolean, default: false },
})

const emit = defineEmits(['cancelar', 'confirmar'])

const botaoCancelar = ref(null)

function aoTeclar(e) {
  if (e.key === 'Escape' && !props.excluindo) emit('cancelar')
}

onMounted(() => {
  document.addEventListener('keydown', aoTeclar)
  document.body.style.overflow = 'hidden'
  // Foco no botão seguro, não no destrutivo: um Enter distraído não pode apagar.
  botaoCancelar.value?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', aoTeclar)
  document.body.style.overflow = ''
})
</script>

<template>
  <div
    class="fixed inset-0 z-[95] flex items-end justify-center sm:items-center sm:p-4"
    style="background: var(--scrim)"
    @click.self="!excluindo && emit('cancelar')"
  >
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="excluir-titulo"
      class="w-full rounded-t-3xl border-t border-line bg-surface-1 p-6 sm:max-w-sm sm:rounded-3xl sm:border"
      style="
        animation: surgir 300ms cubic-bezier(0.16, 1, 0.3, 1);
        padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
      "
    >
      <div class="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert :size="22" :stroke-width="2" />
      </div>

      <h2 id="excluir-titulo" class="mt-4 text-lg font-semibold text-ink">Excluir este item?</h2>

      <div class="mt-3 rounded-xl bg-surface-2 px-3.5 py-3">
        <p class="font-medium text-ink">{{ item.item }}</p>
        <p class="tnum mt-0.5 text-sm text-ink-soft">
          {{ item.categoria }} · {{ formatBRL(item.preco_estimado) }}
          <span v-if="item.quantidade > 1">({{ item.quantidade }} un.)</span>
        </p>
      </div>

      <p class="mt-3 text-sm text-ink-soft">
        Ele sai da lista e dos totais. Não dá para desfazer.
      </p>

      <div class="mt-6 flex gap-3">
        <button
          ref="botaoCancelar"
          type="button"
          :disabled="excluindo"
          class="min-h-12 flex-1 rounded-full border border-line-strong text-sm font-medium text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
          @click="emit('cancelar')"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="excluindo"
          class="min-h-12 flex-1 rounded-full bg-danger text-sm font-medium text-surface-0 transition-opacity hover:opacity-90 disabled:opacity-50"
          @click="emit('confirmar')"
        >
          {{ excluindo ? 'Excluindo…' : 'Excluir' }}
        </button>
      </div>
    </div>
  </div>
</template>
