<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { TriangleAlert } from '@lucide/vue'

/**
 * O convidado soltando o proprio presente de volta pra lista.
 *
 * Primo do ConfirmarCancelamentoReserva do painel, mas de outra voz e com outros
 * dados: aqui nao existe preco (a view publica nao tem essas colunas) e nem
 * telefone a exibir — quem esta lendo e o dono da reserva, ja sabe quem e.
 * O que a tela precisa dizer e a consequencia: o item volta a ficar livre e
 * outra pessoa pode levar.
 */
const props = defineProps({
  presente: { type: Object, required: true },
  cancelando: { type: Boolean, default: false },
  erro: { type: String, default: '' },
})

const emit = defineEmits(['fechar', 'confirmar'])

const botaoVoltar = ref(null)

function aoTeclar(e) {
  if (e.key === 'Escape' && !props.cancelando) emit('fechar')
}

onMounted(() => {
  document.addEventListener('keydown', aoTeclar)
  document.body.style.overflow = 'hidden'
  // Foco no botao seguro: um Enter distraido nao pode soltar o presente.
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
      aria-labelledby="desfazer-reserva-titulo"
      class="w-full rounded-t-3xl border-t border-line bg-surface-1 p-6 sm:max-w-sm sm:rounded-3xl sm:border"
      style="
        animation: surgir 300ms cubic-bezier(0.16, 1, 0.3, 1);
        padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
      "
    >
      <div class="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert :size="22" :stroke-width="2" />
      </div>

      <h2 id="desfazer-reserva-titulo" class="mt-4 text-lg font-semibold text-ink">
        Desfazer sua reserva?
      </h2>

      <p class="mt-3 text-sm text-ink-soft">
        <span class="font-medium text-ink">{{ presente.item }}</span> volta pra lista na hora e
        qualquer convidado pode reservar. Se mudar de ideia depois, pode ser que já tenha
        saído.
      </p>

      <p
        v-if="erro"
        role="alert"
        class="mt-4 rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger"
      >
        {{ erro }}
      </p>

      <div class="mt-6 flex gap-3">
        <button
          ref="botaoVoltar"
          type="button"
          :disabled="cancelando"
          class="min-h-12 flex-1 rounded-full border border-line-strong text-sm font-medium text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
          @click="emit('fechar')"
        >
          Continua sendo meu
        </button>
        <button
          type="button"
          :disabled="cancelando"
          class="min-h-12 flex-1 rounded-full bg-danger text-sm font-medium text-surface-0 transition-opacity hover:opacity-90 disabled:opacity-50"
          @click="emit('confirmar')"
        >
          {{ cancelando ? 'Soltando…' : 'Desfazer' }}
        </button>
      </div>
    </div>
  </div>
</template>
