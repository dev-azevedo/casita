<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight } from '@lucide/vue'

import { useAuth } from '@/composables/useAuth'
import { useConvite } from '@/composables/useConvite'
import { useFotos } from '@/composables/useFotos'
import { CAPA } from '@/lib/fotos'
import Casinha from '@/components/Casinha.vue'
import ConviteModal from '@/components/ConviteModal.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

/**
 * A porta da casa. Primeira coisa que qualquer pessoa ve, com ou sem login.
 *
 * Nao e um menu com duas opcoes do mesmo tamanho: 95% de quem chega aqui e
 * convidado com link do WhatsApp na mao, entao "ver a lista" ocupa o centro e
 * "Acessar" fica um degrau abaixo — presente, nao convidativo. Escondido demais
 * viraria armadilha pro casal; do jeito que esta, quem procura acha.
 */
const { isLoggedIn } = useAuth()
const { capa } = useFotos()

const { visivel: conviteVisivel, verificar, abrir: abrirConvite, fechar: fecharConvite } = useConvite()

onMounted(verificar)
</script>

<template>
  <main class="relative flex min-h-[100svh] flex-col overflow-hidden">
    <!-- Fundo: foto quando existe, campo de gradiente quando não -->
    <template v-if="capa">
      <img
        :src="capa.src"
        :alt="capa.legenda || 'Nós dois'"
        class="absolute inset-0 size-full object-cover"
        :style="{ objectPosition: capa.objectPosition || 'center' }"
      />
      <div
        class="absolute inset-0"
        style="
          background: linear-gradient(
            to top,
            oklch(18% 0.03 var(--h) / 0.88) 0%,
            oklch(18% 0.03 var(--h) / 0.55) 45%,
            oklch(18% 0.03 var(--h) / 0.2) 100%
          );
        "
      />
    </template>
    <div
      v-else
      class="absolute inset-0"
      style="
        background:
          radial-gradient(110% 80% at 18% 8%, var(--accent-soft) 0%, transparent 62%),
          radial-gradient(80% 70% at 92% 96%, var(--accent-soft) 0%, transparent 55%),
          var(--surface-0);
      "
    />

    <div class="absolute top-4 right-4 z-10">
      <ThemeToggle />
    </div>

    <!-- Composição ancorada embaixo à esquerda: o olho entra pelo título e
         desce direto no botão, sem passar por nada centralizado. -->
    <div
      class="relative mt-auto w-full px-6 pb-10 sm:px-10 sm:pb-14"
      style="padding-bottom: max(2.5rem, calc(env(safe-area-inset-bottom) + 2rem))"
    >
      <div class="mx-auto w-full max-w-4xl">
        <Casinha
          variante="chave"
          :tamanho="64"
          class="surgir flutuar mb-6"
          :class="capa ? 'text-white/75' : 'text-accent'"
          style="--i: 0"
        />

        <h1
          class="surgir text-hero leading-[0.92] font-semibold"
          :class="capa ? 'text-white' : 'text-ink'"
          style="--i: 1; font-variation-settings: 'SOFT' 90, 'WONK' 1, 'opsz' 144"
        >
          {{ CAPA.titulo }}
        </h1>

        <p
          class="surgir mt-5 max-w-[34ch] text-lg"
          :class="capa ? 'text-white/80' : 'text-ink-soft'"
          style="--i: 2"
        >
          {{ CAPA.subtitulo }}
        </p>

        <div class="surgir mt-10 flex flex-wrap items-center gap-x-8 gap-y-5" style="--i: 3">
          <RouterLink
            :to="{ name: 'presentes' }"
            class="group flex min-h-14 items-center gap-3 rounded-full bg-accent pr-6 pl-7 text-base font-medium text-on-accent shadow-elev-3 transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.03] active:scale-95"
          >
            Ver lista de presentes
            <ArrowRight
              :size="19"
              :stroke-width="2.2"
              class="transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
            />
          </RouterLink>

          <!-- Um degrau abaixo: sem caixa, sem cor, mas com alvo de toque cheio -->
          <RouterLink
            :to="{ name: isLoggedIn ? 'painel' : 'login' }"
            class="flex min-h-11 items-center text-sm underline decoration-1 underline-offset-4 transition-colors"
            :class="capa ? 'text-white/55 hover:text-white' : 'text-ink-faint hover:text-ink'"
          >
            {{ isLoggedIn ? 'Voltar ao painel' : 'Acessar' }}
          </RouterLink>

          <!-- Mesmo degrau do 'Acessar': o convite ja abriu sozinho na chegada,
               este botao e so para quem quiser voltar a olhar. -->
          <button
            type="button"
            class="flex min-h-11 items-center text-sm underline decoration-1 underline-offset-4 transition-colors"
            :class="capa ? 'text-white/55 hover:text-white' : 'text-ink-faint hover:text-ink'"
            @click="abrirConvite"
          >
            Ver o convite
          </button>
        </div>
      </div>
    </div>

    <ConviteModal v-if="conviteVisivel" @fechar="fecharConvite" />
  </main>
</template>
