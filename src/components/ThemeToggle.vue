<script setup>
import { computed } from 'vue'
import { Sun, Moon, MonitorCog } from '@lucide/vue'
import { useTheme } from '@/composables/useTheme'

const { tema, alternarTema } = useTheme()

const rotulo = computed(
  () => ({ claro: 'Tema claro', escuro: 'Tema escuro', sistema: 'Seguindo o sistema' })[tema.value],
)
</script>

<template>
  <button
    type="button"
    :title="rotulo"
    :aria-label="`${rotulo}. Trocar.`"
    class="grid size-11 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
    @click="alternarTema"
  >
    <Sun v-if="tema === 'claro'" :size="19" :stroke-width="1.8" />
    <Moon v-else-if="tema === 'escuro'" :size="19" :stroke-width="1.8" />
    <MonitorCog v-else :size="19" :stroke-width="1.8" />
  </button>
</template>
