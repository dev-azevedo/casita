<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { X } from '@lucide/vue'

/**
 * O convite em tela cheia.
 *
 * A arte e uma imagem pronta (public/fotos/convite.jpg), com as cores que ela ja
 * traz: o convite NAO acompanha a cor da casa. Entra como <img> com
 * object-contain, entao a proporcao 1136x1600 se preserva em qualquer tela.
 *
 * O convite e papel, e papel nao tem tema: o fundo fica branco no claro e no
 * escuro. Por isso esta tela nao usa --surface-0, que vira outra coisa em
 * [data-theme='escuro'] — ela repete a rampa CLARA na mao. Sem isso, o tema
 * escuro daria um fundo cinza-chumbo em volta da arte.
 */
const emit = defineEmits(['fechar'])

const botaoFechar = ref(null)

function aoTeclar(e) {
  if (e.key === 'Escape') emit('fechar')
}

onMounted(() => {
  document.addEventListener('keydown', aoTeclar)
  document.body.style.overflow = 'hidden'
  botaoFechar.value?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', aoTeclar)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="fixed inset-0 z-[95]" style="background: var(--scrim)" @click="emit('fechar')" />

  <div
    role="dialog"
    aria-modal="true"
    aria-label="Convite"
    class="convite-papel fixed inset-0 z-[95] flex items-center justify-center overflow-hidden p-4 sm:p-8"
    style="animation: aparecer 320ms var(--ease-expo)"
    @click.self="emit('fechar')"
  >
    <img
      src="/fotos/convite.jpg"
      alt="Convite do nosso chá de casa nova"
      class="h-full w-full max-w-[min(100%,44rem)] object-contain"
    />

    <!-- Alvo de toque cheio e fundo proprio: sobre a arte, um X solto sumiria.
         Cores da mesma rampa clara do papel, pelo mesmo motivo. -->
    <button
      ref="botaoFechar"
      type="button"
      class="convite-fechar absolute grid size-11 place-items-center rounded-full border transition-colors"
      style="
        top: max(1rem, calc(env(safe-area-inset-top) + 0.5rem));
        right: max(1rem, calc(env(safe-area-inset-right) + 0.5rem));
      "
      aria-label="Fechar convite"
      @click="emit('fechar')"
    >
      <X :size="19" :stroke-width="2" />
    </button>
  </div>
</template>

<style scoped>
/* O branco do papel: o mesmo --surface-0 do tema claro, com o toque de matiz que
   o resto do app usa — branco puro nao existe em lugar nenhum desta paleta. */
.convite-papel {
  background: oklch(98.5% 0.008 var(--h));
}

.convite-fechar {
  border-color: oklch(88% 0.018 var(--h));
  background: oklch(96.4% 0.012 var(--h));
  color: oklch(47% 0.02 var(--h));
}

.convite-fechar:hover {
  background: oklch(93.2% 0.016 var(--h));
  color: oklch(26% 0.022 var(--h));
}
</style>
