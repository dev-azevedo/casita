<script setup>
defineProps({
  tamanho: { type: String, default: 'base' }, // 'base' | 'grande'
})
</script>

<template>
  <span
    class="inline-flex items-baseline gap-1.5 font-[family-name:var(--font-display)] leading-none"
    :class="tamanho === 'grande' ? 'text-3xl' : 'text-xl'"
    style="font-variation-settings: 'SOFT' 80, 'WONK' 1, 'opsz' 100"
  >
    <span class="font-semibold tracking-tight text-ink">Casita</span>
    <span
      class="h-1.5 w-1.5 translate-y-[-0.15em] rounded-full bg-accent"
      aria-hidden="true"
    />
  </span>
</template>
