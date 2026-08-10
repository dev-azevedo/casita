<script setup>
import { computed } from 'vue'
import { useFotos } from '@/composables/useFotos'

const emit = defineEmits(['abrir-foto'])

const { fotos } = useFotos()

/** A primeira já é a capa; aqui vão as demais. */
const restantes = computed(() =>
  fotos.value.slice(1).map((foto, i) => ({ foto, indice: i + 1 })),
)
</script>

<template>
  <!--
    Rodapé visual da capa, não um segundo destaque: miniaturas pequenas, largura
    uniforme, quadradas e levemente recuadas. A uniformidade aqui é intencional —
    variar tamanho puxaria o olho, que é o oposto do que esta faixa deve fazer.
  -->
  <section v-if="restantes.length" class="py-10" aria-label="Nossas fotos">
    <div
      class="sem-barra flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 sm:px-6"
      style="scroll-padding-left: 1.25rem"
    >
      <figure
        v-for="{ foto, indice } in restantes"
        :key="foto.src"
        class="w-[40vw] shrink-0 snap-start sm:w-[13rem]"
      >
        <button
          type="button"
          class="block w-full overflow-hidden rounded-xl bg-surface-2 opacity-90 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
          @click="emit('abrir-foto', indice)"
        >
          <img
            :src="foto.src"
            :alt="foto.legenda || 'Nossa foto'"
            loading="lazy"
            decoding="async"
            class="aspect-square w-full object-cover"
            :style="{ objectPosition: foto.objectPosition || 'center' }"
          />
        </button>

        <figcaption
          v-if="foto.legenda || foto.ano"
          class="mt-2 flex items-baseline gap-1.5 px-0.5 text-xs text-ink-faint"
        >
          <span class="truncate">{{ foto.legenda }}</span>
          <span v-if="foto.ano" class="tnum shrink-0">{{ foto.ano }}</span>
        </figcaption>
      </figure>

      <!-- respiro no fim do scroll -->
      <div class="w-1 shrink-0" aria-hidden="true" />
    </div>
  </section>
</template>
