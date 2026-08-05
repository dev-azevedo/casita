<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { formatBRL } from '@/lib/format'
import Casinha from './Casinha.vue'
import AccentPicker from './AccentPicker.vue'
import MarcaCasita from './MarcaCasita.vue'

const props = defineProps({
  metrics: { type: Object, required: true },
})

const emit = defineEmits(['concluir'])

const passo = ref(0)
const painel = ref(null)
const toqueX = ref(0)

const PASSOS = 4
const ultimo = computed(() => passo.value === PASSOS - 1)

function avancar() {
  if (ultimo.value) emit('concluir')
  else passo.value++
}
function voltar() {
  if (passo.value > 0) passo.value--
}

function aoTeclar(e) {
  if (e.key === 'ArrowRight' || e.key === 'Enter') avancar()
  else if (e.key === 'ArrowLeft') voltar()
}

function aoTocar(e) {
  toqueX.value = e.changedTouches[0].clientX
}
function aoSoltar(e) {
  const d = e.changedTouches[0].clientX - toqueX.value
  if (d < -55) avancar()
  else if (d > 55) voltar()
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
</script>

<template>
  <div
    ref="painel"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-label="Boas-vindas ao Casita"
    class="fixed inset-0 z-[90] overflow-y-auto bg-surface-0 outline-none"
    @touchstart.passive="aoTocar"
    @touchend.passive="aoSoltar"
  >
    <div
      class="absolute inset-0 pointer-events-none"
      style="
        background:
          radial-gradient(110% 70% at 10% 0%, var(--accent-soft) 0%, transparent 60%),
          radial-gradient(90% 60% at 95% 100%, var(--accent-soft) 0%, transparent 55%);
        transition: background 400ms var(--ease-quart);
      "
    />
    <div
      class="relative mx-auto flex min-h-[100svh] max-w-2xl flex-col px-6 py-8"
      style="
        padding-top: max(2rem, env(safe-area-inset-top));
        padding-bottom: max(2rem, env(safe-area-inset-bottom));
      "
    >
      <div class="flex items-center justify-between">
        <MarcaCasita />
        <button
          v-if="!ultimo"
          type="button"
          class="rounded-lg px-3 py-2 text-sm text-ink-faint transition-colors hover:text-ink"
          @click="emit('concluir')"
        >
          pular
        </button>
      </div>

      <!-- ------------------------------------------------------------------ -->
      <div class="flex flex-1 flex-col justify-center py-10">
        <!-- 1. boas-vindas -->
        <div v-if="passo === 0" :key="0">
          <Casinha
            variante="casa"
            :tamanho="132"
            class="flutuar surgir mb-8 text-accent"
            style="--i: 0"
          />
          <h2 class="surgir text-2xl font-semibold text-ink" style="--i: 1">
            Bem-vinda ao nosso<br />futuro lar.
          </h2>
          <p class="surgir mt-5 max-w-[38ch] text-lg text-ink-soft" style="--i: 2">
            Isto aqui é a nossa casa antes de existir: uma lista viva de tudo que vai entrar
            nela. Você acabou de chegar — deixa eu te mostrar em trinta segundos.
          </p>
        </div>

        <!-- 2. o que é -->
        <div v-else-if="passo === 1" :key="1">
          <h2 class="surgir text-2xl font-semibold text-ink" style="--i: 0">
            {{ metrics.total }} itens,<br />uma casa inteira.
          </h2>
          <p class="surgir mt-5 max-w-[40ch] text-ink-soft" style="--i: 1">
            Cada item tem um preço estimado. Somados, dão
            <strong class="tnum font-semibold text-ink">{{ formatBRL(metrics.totalGeral) }}</strong
            >. Conforme a gente compra, esse número vira o que realmente foi gasto.
          </p>

          <dl class="surgir mt-8 space-y-5" style="--i: 2">
            <div class="flex gap-4">
              <span class="mt-2 h-px w-8 shrink-0 bg-accent" aria-hidden="true" />
              <div>
                <dt class="font-medium text-ink">Chá de panela</dt>
                <dd class="tnum mt-0.5 text-sm text-ink-soft">
                  {{ formatBRL(metrics.totalChaPanela) }} — o que a gente vai pedir de presente.
                </dd>
              </div>
            </div>
            <div class="flex gap-4">
              <span class="mt-2 h-px w-8 shrink-0 bg-ink-faint" aria-hidden="true" />
              <div>
                <dt class="font-medium text-ink">Compra pessoal</dt>
                <dd class="tnum mt-0.5 text-sm text-ink-soft">
                  {{ formatBRL(metrics.totalPessoal) }} — o que sai do nosso bolso.
                </dd>
              </div>
            </div>
          </dl>
        </div>

        <!-- 3. como funciona -->
        <div v-else-if="passo === 2" :key="2">
          <h2 class="surgir text-2xl font-semibold text-ink" style="--i: 0">
            Como a gente usa.
          </h2>
          <ol class="mt-8 space-y-6">
            <li class="surgir flex gap-4" style="--i: 1">
              <span
                class="tnum grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink"
                >1</span
              >
              <p class="text-ink-soft">
                Comprou? Marca a caixinha. Ele pergunta quanto custou de verdade — e os totais
                se ajustam sozinhos.
              </p>
            </li>
            <li class="surgir flex gap-4" style="--i: 2">
              <span
                class="tnum grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink"
                >2</span
              >
              <p class="text-ink-soft">
                Lembrou de algo que faltou? Botão <strong class="text-ink">+</strong> no canto,
                a qualquer hora.
              </p>
            </li>
            <li class="surgir flex gap-4" style="--i: 3">
              <span
                class="tnum grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink"
                >3</span
              >
              <p class="text-ink-soft">
                Dentro da loja, filtra por cômodo ou por prioridade e leva só o que importa
                agora.
              </p>
            </li>
          </ol>
          <p class="surgir mt-8 text-sm text-ink-faint" style="--i: 4">
            Somos só nós dois aqui. O que um muda, o outro vê.
          </p>
        </div>

        <!-- 4. cor da casa -->
        <div v-else :key="3">
          <h2 class="surgir text-2xl font-semibold text-ink" style="--i: 0">
            Escolhe a cor<br />da nossa casa.
          </h2>
          <p class="surgir mt-4 max-w-[38ch] text-ink-soft" style="--i: 1">
            Ela pinta o app inteiro. Dá pra trocar quando quiser, lá no topo — e você pode ter
            uma cor diferente da minha.
          </p>
          <div class="surgir mt-8" style="--i: 2">
            <AccentPicker variante="grade" />
          </div>
        </div>
      </div>

      <!-- ------------------------------------------------------------------ -->
      <footer class="flex items-center gap-4">
        <button
          v-if="passo > 0"
          type="button"
          class="rounded-lg px-3 py-2 text-sm text-ink-soft transition-colors hover:text-ink"
          @click="voltar"
        >
          voltar
        </button>

        <div class="ml-auto flex items-center gap-2" aria-hidden="true">
          <span
            v-for="i in PASSOS"
            :key="i"
            class="h-1.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
            :class="i - 1 === passo ? 'w-6 bg-accent' : 'w-1.5 bg-line'"
          />
        </div>

        <button
          type="button"
          class="rounded-full bg-accent px-6 py-3 font-medium text-on-accent transition-colors hover:bg-accent-hover"
          @click="avancar"
        >
          {{ ultimo ? 'entrar em casa' : 'continuar' }}
        </button>
      </footer>
    </div>
  </div>
</template>
