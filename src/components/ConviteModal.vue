<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Download, X } from '@lucide/vue'

/**
 * O convite em tela cheia.
 *
 * A arte e uma imagem pronta (public/fotos/convite.jpg), com as cores que ela ja
 * traz: o convite NAO acompanha a cor da casa. Entra como <img> com
 * object-contain, entao a proporcao 1136x1600 se preserva em qualquer tela.
 *
 * A moldura em volta segue o tema (--surface-0 e companhia): abrir o convite no
 * escuro nao deve estourar a tela inteira de branco. A arte mesma nao muda — o
 * papel da imagem e claro nos dois temas, e no fundo cinza-chumbo ele le como
 * papel sobre a mesa, que e o efeito desejado.
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
      class="max-h-full max-w-[min(100%,44rem)] rounded-xl object-contain"
    />

    <!-- Alvo de toque cheio e fundo proprio: sobre a arte, um icone solto sumiria.
         Baixar vem antes do X na ordem de leitura e de tabulacao: fechar e a
         saida, e saida fica por ultimo. -->
    <div
      class="absolute flex items-center gap-2"
      style="
        top: max(1rem, calc(env(safe-area-inset-top) + 0.5rem));
        right: max(1rem, calc(env(safe-area-inset-right) + 0.5rem));
      "
    >
      <!-- Mesma origem, entao o `download` vale e o arquivo chega com o nome de
           convite, nao com 'convite.jpg'. -->
      <a
        href="/fotos/convite.jpg"
        download="Convite_Cha_Casa_Nova_Ju_e_Jhow.jpg"
        class="convite-fechar grid size-11 place-items-center rounded-full border transition-colors"
        title="Baixar convite"
        aria-label="Baixar convite"
      >
        <Download :size="19" :stroke-width="2" />
      </a>

      <button
        ref="botaoFechar"
        type="button"
        class="convite-fechar grid size-11 place-items-center rounded-full border transition-colors"
        aria-label="Fechar convite"
        @click="emit('fechar')"
      >
        <X :size="19" :stroke-width="2" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Tudo em token: claro, escuro e 'sistema' ja chegam resolvidos no documento. */
.convite-papel {
  background: var(--surface-0);
}

.convite-fechar {
  border-color: var(--line);
  background: var(--surface-1);
  color: var(--ink-soft);
}

.convite-fechar:hover {
  background: var(--surface-2);
  color: var(--ink);
}
</style>
