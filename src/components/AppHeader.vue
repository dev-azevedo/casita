<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { LogOut } from '@lucide/vue'
import MarcaCasita from './MarcaCasita.vue'
import ThemeToggle from './ThemeToggle.vue'
import AccentPicker from './AccentPicker.vue'

defineProps({
  email: { type: String, default: '' },
})

const emit = defineEmits(['sair'])

// Só aparece depois que a capa quase saiu de cena — sobre a foto ele atrapalharia.
const visivel = ref(false)
let observador

onMounted(() => {
  const capa = document.getElementById('capa')
  if (!capa) {
    visivel.value = true
    return
  }
  observador = new IntersectionObserver(
    ([e]) => {
      visivel.value = e.intersectionRatio < 0.35
    },
    { threshold: [0, 0.35, 1] },
  )
  observador.observe(capa)
})

onBeforeUnmount(() => observador?.disconnect())
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
    enter-from-class="opacity-0 -translate-y-full"
    leave-active-class="transition duration-200 ease-[cubic-bezier(0.5,0,0.75,0)]"
    leave-to-class="opacity-0 -translate-y-full"
  >
    <header
      v-if="visivel"
      class="fixed inset-x-0 top-0 z-40 border-b border-line-soft"
      style="
        background: color-mix(in oklch, var(--surface-0) 88%, transparent);
        backdrop-filter: blur(12px);
        padding-top: env(safe-area-inset-top);
      "
    >
      <div class="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4 sm:px-6">
        <MarcaCasita />

        <span class="ml-auto hidden text-sm text-ink-faint sm:block">{{ email }}</span>

        <AccentPicker />
        <ThemeToggle />

        <button
          type="button"
          aria-label="Sair"
          title="Sair"
          class="grid size-11 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
          @click="emit('sair')"
        >
          <LogOut :size="19" :stroke-width="1.8" />
        </button>
      </div>
    </header>
  </Transition>
</template>
