<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ArrowDown } from '@lucide/vue'
import { FOTOS, CAPA, VIDEO_CAPA } from '@/lib/fotos'
import Casinha from './Casinha.vue'

const emit = defineEmits(['abrir-foto'])

const capa = computed(() => FOTOS[0] ?? null)
const secao = ref(null)
const progresso = ref(0) // 0 no topo, 1 quando a capa saiu

let raf = 0
const reduzido =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function aoRolar() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    const alt = secao.value?.offsetHeight || 1
    progresso.value = Math.min(1, Math.max(0, window.scrollY / alt))
  })
}

onMounted(() => {
  if (reduzido) return
  window.addEventListener('scroll', aoRolar, { passive: true })
  aoRolar()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', aoRolar)
  if (raf) cancelAnimationFrame(raf)
})

// Só transform e opacity — nada que force layout.
const estiloFundo = computed(() => ({ transform: `scale(${1 + progresso.value * 0.09})` }))
const estiloTexto = computed(() => ({
  transform: `translateY(${progresso.value * -40}px)`,
  opacity: 1 - progresso.value * 1.3,
}))

function irParaLista() {
  document.getElementById('a-lista')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <section
    id="capa"
    ref="secao"
    class="relative min-h-[100svh] overflow-hidden"
    :class="capa ? 'bg-ink' : 'bg-surface-1'"
  >
    <!-- ---------------------------------------------------------------- FUNDO -->
    <div v-if="capa" class="absolute inset-0 will-change-transform" :style="estiloFundo">
      <!-- Vídeo de capa, se ligado em fotos.js. A foto vira poster enquanto carrega. -->
      <video
        v-if="VIDEO_CAPA"
        :src="VIDEO_CAPA"
        :poster="capa.src"
        autoplay
        muted
        loop
        playsinline
        class="size-full object-cover lg:hidden"
        :style="{ objectPosition: capa.objectPosition || 'center' }"
      />
      <!-- Celular: a foto ocupa tudo. Formato retrato casa com a tela em pé. -->
      <img
        v-else
        :src="capa.src"
        :alt="capa.legenda || 'Nós dois'"
        fetchpriority="high"
        class="size-full object-cover lg:hidden"
        :style="{ objectPosition: capa.objectPosition || 'center' }"
      />
      <!-- Desktop: a mesma foto desfocada vira ambiente. Sem isso, uma foto em pé
           esticada numa tela deitada viraria uma tira sem cabeça nem pé. -->
      <img
        :src="capa.src"
        alt=""
        aria-hidden="true"
        class="hidden size-full scale-110 object-cover blur-3xl lg:block"
      />
    </div>

    <!-- Sem foto: campo de gradiente nos tons da cor escolhida -->
    <div
      v-else
      class="absolute inset-0"
      style="
        background:
          radial-gradient(120% 90% at 15% 0%, var(--accent-soft) 0%, transparent 62%),
          radial-gradient(90% 70% at 90% 100%, var(--accent-soft) 0%, transparent 58%);
      "
    />

    <!-- Scrim: texto sobre imagem precisa de véu, não de cinza claro -->
    <div
      v-if="capa"
      class="absolute inset-0"
      style="
        background:
          linear-gradient(
            to top,
            oklch(16% 0.03 var(--h) / 0.9) 0%,
            oklch(16% 0.03 var(--h) / 0.45) 45%,
            oklch(16% 0.03 var(--h) / 0.25) 100%
          );
      "
    />

    <!-- ------------------------------------------------------------ CONTEÚDO -->
    <div
      class="relative mx-auto grid min-h-[100svh] max-w-6xl items-end gap-10 px-6 pb-16 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:pb-0"
      style="padding-bottom: max(4rem, calc(env(safe-area-inset-bottom) + 4rem))"
    >
      <div :style="capa ? estiloTexto : {}">
        <p
          class="surgir mb-4 text-xs tracking-[0.28em] uppercase"
          :class="capa ? 'text-white/70' : 'text-accent-ink'"
          style="--i: 0"
        >
          {{ CAPA.selo }}
        </p>

        <h1
          class="surgir max-w-[13ch] text-hero font-semibold"
          :class="capa ? 'text-white' : 'text-ink'"
          style="--i: 1; font-variation-settings: 'SOFT' 90, 'WONK' 1, 'opsz' 144"
        >
          {{ CAPA.titulo }}
        </h1>

        <p
          class="surgir mt-5 max-w-[40ch] text-lg"
          :class="capa ? 'text-white/85' : 'text-ink-soft'"
          style="--i: 2"
        >
          {{ CAPA.subtitulo }}
        </p>

        <!-- Sem foto: a casinha segura a cena e ensina o próximo passo -->
        <div v-if="!capa" class="surgir mt-10 flex items-center gap-5" style="--i: 3">
          <Casinha variante="casa" :tamanho="104" class="flutuar text-accent" />
          <p class="max-w-[32ch] text-sm text-ink-soft">
            Coloque as fotos em
            <code class="rounded bg-surface-2 px-1.5 py-0.5 text-ink">public/fotos/</code>
            e liste em
            <code class="rounded bg-surface-2 px-1.5 py-0.5 text-ink">src/lib/fotos.js</code>.
          </p>
        </div>

        <button
          type="button"
          class="surgir mt-12 flex items-center gap-3 text-sm transition-opacity hover:opacity-70"
          :class="capa ? 'text-white/80' : 'text-ink-soft'"
          style="--i: 4"
          @click="irParaLista"
        >
          <span
            class="grid size-11 place-items-center rounded-full border"
            :class="capa ? 'border-white/30' : 'border-line'"
          >
            <ArrowDown :size="17" :stroke-width="1.9" style="animation: descer-dica 2.4s ease-in-out infinite" />
          </span>
          ver a lista
        </button>
      </div>

      <!-- Desktop: a foto num quadro, no formato dela -->
      <button
        v-if="capa"
        type="button"
        class="hidden lg:block"
        aria-label="Ampliar foto da capa"
        @click="emit('abrir-foto', 0)"
      >
        <img
          :src="capa.src"
          :alt="capa.legenda || 'Nós dois'"
          class="aspect-[3/4] w-full rounded-3xl object-cover shadow-elev-3 ring-1 ring-white/10 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.02]"
          :style="{ objectPosition: capa.objectPosition || 'center' }"
        />
        <span v-if="capa.legenda" class="mt-3 block text-left text-sm text-white/60">
          {{ capa.legenda }}<span v-if="capa.ano"> · {{ capa.ano }}</span>
        </span>
      </button>
    </div>
  </section>
</template>
