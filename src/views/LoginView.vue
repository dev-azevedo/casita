<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { FOTOS, CAPA } from '@/lib/fotos'
import MarcaCasita from '@/components/MarcaCasita.vue'
import Casinha from '@/components/Casinha.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const { signIn } = useAuth()

const capa = computed(() => FOTOS[0] ?? null)

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await signIn(email.value, password.value)
    router.push({ name: 'home' })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const campo =
  'w-full min-h-12 rounded-xl border border-line bg-surface-0 px-4 text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent'
</script>

<template>
  <main class="grid min-h-[100svh] lg:grid-cols-[1.1fr_1fr]">
    <!-- Lado da foto: some no celular, onde o espaço é do formulário -->
    <div class="relative hidden overflow-hidden lg:block">
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
              oklch(18% 0.03 var(--h) / 0.8) 0%,
              oklch(18% 0.03 var(--h) / 0.15) 60%
            );
          "
        />
        <div class="absolute right-10 bottom-10 left-10">
          <Casinha variante="chave" :tamanho="80" class="mb-4 text-white/80" />
          <p class="text-2xl font-semibold text-white">{{ CAPA.titulo }}</p>
        </div>
      </template>

      <template v-else>
        <div
          class="absolute inset-0"
          style="
            background:
              radial-gradient(110% 80% at 20% 10%, var(--accent-soft) 0%, transparent 62%),
              radial-gradient(80% 70% at 90% 95%, var(--accent-soft) 0%, transparent 55%);
          "
        />
        <div class="absolute right-10 bottom-10 left-10">
          <Casinha variante="casa" :tamanho="112" class="flutuar mb-6 text-accent" />
          <p class="max-w-[16ch] text-2xl font-semibold text-ink">{{ CAPA.titulo }}</p>
          <p class="mt-3 max-w-[36ch] text-ink-soft">{{ CAPA.subtitulo }}</p>
        </div>
      </template>
    </div>

    <!-- Lado do formulário -->
    <div
      class="relative flex flex-col justify-center bg-surface-0 px-6 py-10 sm:px-12"
      style="
        padding-top: max(2.5rem, env(safe-area-inset-top));
        padding-bottom: max(2.5rem, env(safe-area-inset-bottom));
      "
    >
      <div class="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div class="relative mx-auto w-full max-w-sm">
        <MarcaCasita tamanho="grande" />

        <h1 class="surgir mt-8 text-xl font-semibold text-ink" style="--i: 0">
          Entra, é sua casa.
        </h1>
        <p class="surgir mt-2 text-ink-soft" style="--i: 1">
          Só nós dois temos a chave.
        </p>

        <form class="surgir mt-10 space-y-4" style="--i: 2" @submit.prevent="onSubmit">
          <div>
            <label for="email" class="mb-1.5 block text-xs tracking-[0.14em] text-ink-faint uppercase">
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              :class="campo"
            />
          </div>

          <div>
            <label for="password" class="mb-1.5 block text-xs tracking-[0.14em] text-ink-faint uppercase">
              Senha
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              :class="campo"
            />
          </div>

          <p v-if="error" role="alert" class="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {{ error }}
          </p>

          <button
            type="submit"
            :disabled="loading"
            class="min-h-12 w-full rounded-full bg-accent font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {{ loading ? 'Abrindo…' : 'Entrar' }}
          </button>
        </form>

        <p class="surgir mt-8 text-xs text-ink-faint" style="--i: 3">
          Acesso restrito. Contas são criadas só pelo painel.
        </p>
      </div>
    </div>
  </main>
</template>
