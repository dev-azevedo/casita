<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { X, Info } from '@lucide/vue'
import { formatTelefone, telefoneCanonico } from '@/lib/format'
import { codigoErroTelefone } from '@/lib/validacao'
import { useTecladoVirtual } from '@/composables/useTecladoVirtual'

/**
 * O celular de quem chegou. Uma pergunta, um campo, e a lista logo atras.
 *
 * Serve para duas coisas ao mesmo tempo, e e por isso que ela nao cobra nada:
 *   1. marcar na lista o que ja e desta pessoa, mesmo em navegador novo;
 *   2. chegar pronto no formulario da primeira reserva.
 *
 * Numero sem reserva nenhuma NAO e um caso de erro — e o caso comum, de quem
 * ainda vai escolher. A tela guarda o numero, fecha e sai da frente. Segurar a
 * pessoa aqui para avisar "nao achei nada" seria cobrar explicacao de quem so
 * queria ver os presentes.
 *
 * Um campo so, sem nome: pedir nome dobraria a barreira e criaria um jeito de a
 * pessoa nao se achar por ter escrito "Ana" numa vez e "Ana Souza" na outra.
 *
 * Controlado pelo parent (`carregando` vem de fora), igual ao ReservaModal: quem
 * fala com o Supabase e a view.
 *
 * Nao existe estado de erro aqui: falha de rede nao impede nada — o telefone e
 * guardado no aparelho de qualquer jeito e a pergunta fecha. O que der errado
 * do lado do banco aparece no console e se resolve no proximo ciclo.
 */
defineProps({
  carregando: { type: Boolean, default: false },
})

const emit = defineEmits(['identificar', 'dispensar', 'fechar'])

useTecladoVirtual()

const telefone = ref('')
const campoTelefone = ref(null)
const tocado = ref(false)

const digitos = computed(() => telefoneCanonico(telefone.value))

const erroTelefone = computed(
  () =>
    ({
      VAZIO: 'Digita o celular que você usou pra reservar.',
      INCOMPLETO: 'Faltam dígitos: DDD + 9 números, 11 no total.',
    })[codigoErroTelefone(digitos.value)] ?? '',
)

const mostrarErro = computed(() => tocado.value && !!erroTelefone.value)

function aoDigitarTelefone(e) {
  telefone.value = formatTelefone(e.target.value)
}

function enviar() {
  if (erroTelefone.value) {
    tocado.value = true
    campoTelefone.value?.focus()
    return
  }
  emit('identificar', digitos.value)
}

function aoTeclar(e) {
  if (e.key === 'Escape') emit('fechar')
}

onMounted(() => {
  document.addEventListener('keydown', aoTeclar)
  document.body.style.overflow = 'hidden'
  campoTelefone.value?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', aoTeclar)
  document.body.style.overflow = ''
})

const campo =
  'w-full min-h-12 rounded-xl border border-line-strong bg-surface-0 px-3.5 text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent'
const rotulo = 'mb-1.5 block text-xs uppercase tracking-[0.14em] text-ink-faint'
</script>

<template>
  <div class="fixed inset-0 z-[85]" style="background: var(--scrim)" @click="emit('fechar')" />

  <div
    class="fixed left-0 z-[85] flex w-full items-end justify-center pt-10 sm:items-center sm:px-4 sm:py-4"
    style="top: var(--vv-top, 0px); height: var(--vv-h, 100svh)"
    @click.self="emit('fechar')"
  >
    <form
      role="dialog"
      aria-modal="true"
      aria-labelledby="identificar-titulo"
      class="flex max-h-full w-full flex-col rounded-t-3xl border-t border-line bg-surface-1 sm:max-w-md sm:rounded-3xl sm:border"
      style="animation: surgir 340ms cubic-bezier(0.16, 1, 0.3, 1)"
      @submit.prevent="enviar"
    >
      <div class="flex shrink-0 items-start justify-between gap-4 px-6 pt-5 pb-4">
        <div class="min-w-0">
          <p class="text-xs tracking-[0.2em] text-ink-faint uppercase">seu celular</p>
          <h2
            id="identificar-titulo"
            class="mt-1.5 font-[family-name:var(--font-display)] text-xl leading-tight font-semibold text-ink"
            style="font-variation-settings: 'SOFT' 70, 'WONK' 1, 'opsz' 60"
          >
            Qual é o seu celular?
          </h2>
        </div>
        <button
          type="button"
          aria-label="Fechar"
          class="-mr-2 grid size-10 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-2"
          @click="emit('fechar')"
        >
          <X :size="19" :stroke-width="2" />
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-6">
        <p class="text-sm text-ink-soft">
          A gente marca na lista o que já é seu — em qualquer aparelho — e não pergunta de
          novo na hora de reservar. Se ainda não reservou nada, também vale: fica guardado
          pra depois.
        </p>

        <!-- O aviso vem ANTES do campo, e nao como dica embaixo dele: quem digita
             um celular diferente do que usou na reserva nao ve erro nenhum — a
             lista simplesmente nao marca nada como seu, e a pessoa conclui que o
             recurso nao funciona. Este e o unico ponto em que da para evitar isso. -->
        <div class="mt-4 flex items-start gap-2.5 rounded-2xl bg-accent-soft px-3.5 py-3">
          <Info :size="16" :stroke-width="2" class="mt-0.5 shrink-0 text-accent-ink" />
          <p class="text-sm text-accent-ink">
            Já reservou algum presente antes? Coloca
            <span class="font-medium">o mesmo celular</span> que você usou naquela vez — é
            por ele que a gente reconhece o que é seu.
          </p>
        </div>

        <div class="mt-4 scroll-mt-4 scroll-mb-4">
          <label :class="rotulo" for="i-tel">Celular</label>
          <input
            id="i-tel"
            ref="campoTelefone"
            :value="telefone"
            type="tel"
            inputmode="numeric"
            autocomplete="tel"
            maxlength="16"
            :class="[campo, 'tnum', mostrarErro ? 'border-danger' : '']"
            :aria-invalid="mostrarErro"
            :aria-describedby="mostrarErro ? 'i-tel-erro' : 'i-tel-dica'"
            placeholder="(11) 98888-7777"
            @input="aoDigitarTelefone"
            @blur="tocado = true"
          />
          <p v-if="mostrarErro" id="i-tel-erro" role="alert" :class="'mt-1.5 text-xs text-danger'">
            {{ erroTelefone }}
          </p>
          <p v-else id="i-tel-dica" class="mt-1.5 text-xs text-ink-faint">
            Fica só com a gente. É o mesmo que usamos pra combinar a entrega.
          </p>
        </div>

        <div class="h-4" aria-hidden="true" />
      </div>

      <div
        class="shrink-0 border-t border-line-soft px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <button
          type="submit"
          :disabled="carregando"
          class="min-h-12 w-full rounded-full bg-accent px-5 font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {{ carregando ? 'Só um instante…' : 'Continuar' }}
        </button>

        <!-- A saida tem que ser tao facil quanto a entrada: a pergunta abre
             sozinha, e quem so veio olhar nao pode ficar preso nela. -->
        <button
          type="button"
          class="mt-2 min-h-11 w-full rounded-full text-sm text-ink-soft transition-colors hover:bg-surface-2"
          @click="emit('dispensar')"
        >
          Agora não
        </button>
      </div>
    </form>
  </div>
</template>
