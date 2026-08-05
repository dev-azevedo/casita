<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { X, ChevronLeft, ChevronRight } from '@lucide/vue'

const props = defineProps({
  fotos: { type: Array, required: true },
  indice: { type: Number, required: true },
})

const emit = defineEmits(['fechar', 'navegar'])

const painel = ref(null)
const toqueX = ref(0)

const foto = computed(() => props.fotos[props.indice] ?? {})
const temAnterior = computed(() => props.indice > 0)
const temProxima = computed(() => props.indice < props.fotos.length - 1)

function anterior() {
  if (temAnterior.value) emit('navegar', props.indice - 1)
}
function proxima() {
  if (temProxima.value) emit('navegar', props.indice + 1)
}

function aoTeclar(e) {
  if (e.key === 'Escape') emit('fechar')
  else if (e.key === 'ArrowLeft') anterior()
  else if (e.key === 'ArrowRight') proxima()
  else if (e.key === 'Tab') {
    // Foco preso: só há um alvo focável, então ele sempre volta pra cá.
    e.preventDefault()
    painel.value?.focus()
  }
}

onMounted(() => {
  document.addEventListener('keydown', aoTeclar)
  document.body.style.overflow = 'hidden'
  painel.value?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', aoTeclar)
  document.body.style.overflow = ''
})

watch(() => props.indice, () => painel.value?.focus())

function aoTocar(e) {
  toqueX.value = e.changedTouches[0].clientX
}
function aoSoltar(e) {
  const delta = e.changedTouches[0].clientX - toqueX.value
  if (delta > 60) anterior()
  else if (delta < -60) proxima()
}
</script>

<template>
  <div
    ref="painel"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    :aria-label="foto.legenda || 'Foto ampliada'"
    class="fixed inset-0 z-[100] flex flex-col outline-none"
    style="background: var(--scrim); backdrop-filter: blur(14px)"
    @click.self="emit('fechar')"
    @touchstart.passive="aoTocar"
    @touchend.passive="aoSoltar"
  >
    <div class="flex justify-end p-3" style="padding-top: max(0.75rem, env(safe-area-inset-top))">
      <button
        type="button"
        aria-label="Fechar"
        class="grid size-11 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
        @click="emit('fechar')"
      >
        <X :size="22" :stroke-width="2" />
      </button>
    </div>

    <div class="flex min-h-0 flex-1 items-center justify-center px-3" @click.self="emit('fechar')">
      <img
        :key="foto.src"
        :src="foto.src"
        :alt="foto.legenda || 'Nossa foto'"
        class="max-h-full max-w-3xl rounded-2xl object-contain"
        style="animation: aparecer 260ms var(--ease-quart)"
      />
    </div>

    <footer
      class="flex items-center justify-between gap-4 px-4 py-4"
      style="padding-bottom: max(1rem, env(safe-area-inset-bottom))"
    >
      <button
        type="button"
        aria-label="Foto anterior"
        :disabled="!temAnterior"
        class="grid size-11 place-items-center rounded-full text-white/80 transition hover:bg-white/10 disabled:opacity-25"
        @click="anterior"
      >
        <ChevronLeft :size="22" :stroke-width="2" />
      </button>

      <p class="min-w-0 flex-1 text-center text-sm text-white/85">
        <span v-if="foto.legenda">{{ foto.legenda }}</span>
        <span v-if="foto.ano" class="text-white/50"> · {{ foto.ano }}</span>
      </p>

      <button
        type="button"
        aria-label="Próxima foto"
        :disabled="!temProxima"
        class="grid size-11 place-items-center rounded-full text-white/80 transition hover:bg-white/10 disabled:opacity-25"
        @click="proxima"
      >
        <ChevronRight :size="22" :stroke-width="2" />
      </button>
    </footer>
  </div>
</template>
