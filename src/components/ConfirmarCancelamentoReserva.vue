<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { TriangleAlert } from '@lucide/vue'
import { formatBRL, formatData, formatTelefone, linkWhatsApp } from '@/lib/format'

/**
 * Cancelar reserva e destrutivo de um jeito que excluir item nao e: do outro
 * lado tem uma pessoa que ja escolheu o presente e talvez ja tenha comprado.
 * Por isso o dialogo mostra quem foi, o telefone e a data — para dar chance de
 * mandar mensagem antes de soltar o item de volta pra lista.
 */
const props = defineProps({
  item: { type: Object, required: true },
  reserva: { type: Object, required: true },
  cancelando: { type: Boolean, default: false },
})

const emit = defineEmits(['fechar', 'confirmar'])

const botaoVoltar = ref(null)

function aoTeclar(e) {
  if (e.key === 'Escape' && !props.cancelando) emit('fechar')
}

onMounted(() => {
  document.addEventListener('keydown', aoTeclar)
  document.body.style.overflow = 'hidden'
  // Foco no botão seguro: um Enter distraído não pode soltar a reserva.
  botaoVoltar.value?.focus()
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
    @click.self="!cancelando && emit('fechar')"
  >
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cancelar-reserva-titulo"
      class="w-full rounded-t-3xl border-t border-line bg-surface-1 p-6 sm:max-w-sm sm:rounded-3xl sm:border"
      style="
        animation: surgir 300ms cubic-bezier(0.16, 1, 0.3, 1);
        padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
      "
    >
      <div class="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert :size="22" :stroke-width="2" />
      </div>

      <h2 id="cancelar-reserva-titulo" class="mt-4 text-lg font-semibold text-ink">
        Cancelar esta reserva?
      </h2>

      <!-- Quem está do outro lado, com o contato à mão -->
      <div class="mt-3 rounded-xl bg-surface-2 px-3.5 py-3">
        <p class="font-medium text-ink">{{ reserva.nome }}</p>
        <a
          :href="linkWhatsApp(reserva.telefone)"
          target="_blank"
          rel="noopener noreferrer"
          class="tnum mt-0.5 inline-flex min-h-9 items-center text-sm text-accent-ink underline underline-offset-2 transition-opacity hover:opacity-70"
        >
          {{ formatTelefone(reserva.telefone) }}
        </a>
        <p class="mt-1 text-sm text-ink-soft">
          Reservou <span class="text-ink">{{ item.item }}</span>
          <span class="tnum"> · {{ formatBRL(item.preco_estimado) }}</span>
        </p>
        <p v-if="reserva.created_at" class="mt-0.5 text-xs text-ink-faint">
          em {{ formatData(reserva.created_at) }}
        </p>
      </div>

      <p class="mt-3 text-sm text-ink-soft">
        O item volta a aparecer disponível para os convidados e
        {{ reserva.nome.split(' ')[0] }} não é avisado. Se ele já comprou, fala com ele
        antes.
      </p>

      <div class="mt-6 flex gap-3">
        <button
          ref="botaoVoltar"
          type="button"
          :disabled="cancelando"
          class="min-h-12 flex-1 rounded-full border border-line-strong text-sm font-medium text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
          @click="emit('fechar')"
        >
          Voltar
        </button>
        <button
          type="button"
          :disabled="cancelando"
          class="min-h-12 flex-1 rounded-full bg-danger text-sm font-medium text-surface-0 transition-opacity hover:opacity-90 disabled:opacity-50"
          @click="emit('confirmar')"
        >
          {{ cancelando ? 'Cancelando…' : 'Cancelar reserva' }}
        </button>
      </div>
    </div>
  </div>
</template>
