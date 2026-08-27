<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { X } from '@lucide/vue'
import { formatBRL, formatTelefone, soDigitos } from '@/lib/format'
import { codigoErroNome, codigoErroTelefone, normalizarNome } from '@/lib/validacao'
import { useTecladoVirtual } from '@/composables/useTecladoVirtual'

/**
 * Reservar em nome de um convidado, do lado de ca do login.
 *
 * Existe porque a reserva quase nunca nasce na tela: a tia avisa no grupo, o
 * vizinho fala no corredor, alguem manda foto do comprovante. Sem isto, o casal
 * so podia anotar na observacao do item — e a lista publica continuava
 * oferecendo o presente para outra pessoa.
 *
 * Primo do ReservaModal, nao gemeo. Tres diferencas de proposito:
 *
 *   - nao le o convidado do localStorage: aquilo guarda o dono DAQUELE aparelho,
 *     e no navegador do casal preencheria a mesma pessoa em todo item;
 *   - nao comemora no fim. Comemoracao e para quem deu o presente; aqui a
 *     confirmacao e o selo aparecendo na linha;
 *   - fala em terceira pessoa. Quem preenche nao e quem esta sendo cadastrado.
 *
 * Burro como os outros dialogos: recebe estado, emite intencao. Quem fala com o
 * Supabase e a HomeView.
 */
const props = defineProps({
  item: { type: Object, required: true },
  salvando: { type: Boolean, default: false },
  erro: { type: String, default: '' },
})

const emit = defineEmits(['fechar', 'reservar'])

// Dois campos digitados no celular: sem isto o teclado sobe por cima do rodape
// e o "Guardar reserva" some.
useTecladoVirtual()

const nome = ref('')
const telefone = ref('')
const campoNome = ref(null)
const campoTelefone = ref(null)

const digitos = computed(() => soDigitos(telefone.value))

/**
 * Item que nao esta na lista publica (`Compra pessoal`, ou ja `Comprado`). A
 * reserva grava do mesmo jeito — o casal decide sobre a lista inteira —, mas
 * vale dizer que ela nao vai mudar nada para os convidados.
 */
const foraDaListaPublica = computed(
  () => props.item.tipo !== 'Chá de Panela' || props.item.status === 'Comprado',
)

/**
 * Mesmas regras do formulario do convidado (src/lib/validacao.js), outra voz:
 * quem le aqui esta cadastrando outra pessoa.
 */
const tocado = ref({ nome: false, telefone: false })

const erroNome = computed(
  () =>
    ({
      VAZIO: 'Escreve quem vai dar esse presente.',
      SEM_SOBRENOME: 'Falta o sobrenome — vocês vão querer saber quem foi.',
    })[codigoErroNome(nome.value)] ?? '',
)

const erroTelefone = computed(
  () =>
    ({
      VAZIO: 'Sem o celular não dá pra combinar a entrega.',
      INCOMPLETO: 'Faltam dígitos: DDD + 9 números, 11 no total.',
    })[codigoErroTelefone(digitos.value)] ?? '',
)

const mostrarErroNome = computed(() => tocado.value.nome && !!erroNome.value)
const mostrarErroTelefone = computed(() => tocado.value.telefone && !!erroTelefone.value)

/** O ref guarda o texto com mascara; no envio vai so digito, que e o que a coluna aceita. */
function aoDigitarTelefone(e) {
  telefone.value = formatTelefone(e.target.value)
}

function enviar() {
  if (erroNome.value || erroTelefone.value) {
    // Revela os dois de uma vez e leva o foco ao primeiro problema.
    tocado.value = { nome: true, telefone: true }
    ;(erroNome.value ? campoNome : campoTelefone).value?.focus()
    return
  }
  emit('reservar', { nome: normalizarNome(nome.value), telefone: digitos.value })
}

function aoTeclar(e) {
  if (e.key === 'Escape' && !props.salvando) emit('fechar')
}

onMounted(() => {
  document.addEventListener('keydown', aoTeclar)
  document.body.style.overflow = 'hidden'
  campoNome.value?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', aoTeclar)
  document.body.style.overflow = ''
})

const campo =
  'w-full min-h-12 rounded-xl border border-line-strong bg-surface-0 px-3.5 text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent'
const rotulo = 'mb-1.5 block text-xs uppercase tracking-[0.14em] text-ink-faint'
const erroCampo = 'mt-1.5 text-xs text-danger'
const bloco = 'scroll-mt-4 scroll-mb-4'
const rodape =
  'shrink-0 border-t border-line-soft px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]'
</script>

<template>
  <!-- Véu separado do painel: cobre a tela toda mesmo quando o wrapper encolhe
       para caber acima do teclado. -->
  <div
    class="fixed inset-0 z-[95]"
    style="background: var(--scrim)"
    @click="!salvando && emit('fechar')"
  />

  <div
    class="fixed left-0 z-[95] flex w-full items-end justify-center pt-10 sm:items-center sm:px-4 sm:py-4"
    style="top: var(--vv-top, 0px); height: var(--vv-h, 100svh)"
    @click.self="!salvando && emit('fechar')"
  >
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="`Reservar ${item.item} para um convidado`"
      class="flex max-h-full w-full flex-col rounded-t-3xl border-t border-line bg-surface-1 sm:max-w-sm sm:rounded-3xl sm:border"
      style="animation: surgir 320ms cubic-bezier(0.16, 1, 0.3, 1)"
    >
      <div class="flex shrink-0 items-start justify-between gap-4 px-6 pt-5 pb-4">
        <div class="min-w-0">
          <p class="text-xs tracking-[0.2em] text-ink-faint uppercase">reservar para</p>
          <h2
            class="mt-1.5 font-[family-name:var(--font-display)] text-xl leading-tight font-semibold text-ink"
            style="font-variation-settings: 'SOFT' 70, 'WONK' 1, 'opsz' 60"
          >
            {{ item.item }}
          </h2>
          <p class="tnum mt-1 text-sm text-ink-soft">{{ formatBRL(item.preco_estimado) }}</p>
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

      <!-- `min-h-0` deixa o corpo encolher: sem ele o mínimo automático do flex
           empurra o rodapé para fora da tela com o teclado aberto. -->
      <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="enviar">
        <div class="min-h-0 flex-1 overflow-y-auto px-6">
          <p class="text-sm text-ink-soft">
            O item sai da lista dos convidados e o contato fica aqui pra combinar a entrega.
          </p>

          <div class="mt-4 space-y-3.5">
            <div :class="bloco">
              <label :class="rotulo" for="a-nome">Nome e sobrenome do convidado</label>
              <input
                id="a-nome"
                ref="campoNome"
                v-model="nome"
                maxlength="80"
                :class="[campo, mostrarErroNome ? 'border-danger' : '']"
                :aria-invalid="mostrarErroNome"
                :aria-describedby="mostrarErroNome ? 'a-nome-erro' : undefined"
                placeholder="Ana Souza"
                @blur="tocado.nome = true"
              />
              <p v-if="mostrarErroNome" id="a-nome-erro" role="alert" :class="erroCampo">
                {{ erroNome }}
              </p>
            </div>

            <div :class="bloco">
              <label :class="rotulo" for="a-tel">Celular</label>
              <input
                id="a-tel"
                ref="campoTelefone"
                :value="telefone"
                type="tel"
                inputmode="numeric"
                maxlength="16"
                :class="[campo, 'tnum', mostrarErroTelefone ? 'border-danger' : '']"
                :aria-invalid="mostrarErroTelefone"
                :aria-describedby="mostrarErroTelefone ? 'a-tel-erro' : 'a-tel-dica'"
                placeholder="(11) 98888-7777"
                @input="aoDigitarTelefone"
                @blur="tocado.telefone = true"
              />
              <p v-if="mostrarErroTelefone" id="a-tel-erro" role="alert" :class="erroCampo">
                {{ erroTelefone }}
              </p>
              <p v-else id="a-tel-dica" class="mt-1.5 text-xs text-ink-faint">
                Vira o link de WhatsApp na linha do item.
              </p>
            </div>
          </div>

          <!-- Honestidade sobre o alcance da ação, sem bloquear: o casal manda
               na lista inteira, mas essa parte dela os convidados não veem. -->
          <p v-if="foraDaListaPublica" class="mt-4 text-xs text-ink-faint">
            {{
              item.status === 'Comprado'
                ? 'Esse item já está comprado'
                : 'Esse item é compra pessoal'
            }}
            e não aparece na lista dos convidados — a reserva fica como registro de vocês.
          </p>

          <div class="h-4" aria-hidden="true" />
        </div>

        <div :class="rodape">
          <!-- Erro no rodapé, não no corpo: no corpo ele poderia nascer fora da
               área visível e a pessoa só veria o botão não funcionar. -->
          <p
            v-if="erro"
            role="alert"
            class="mb-3 rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger"
          >
            {{ erro }}
          </p>

          <div class="flex gap-3">
            <button
              type="button"
              :disabled="salvando"
              class="min-h-12 rounded-full px-5 text-sm text-ink-soft transition-colors hover:bg-surface-2 disabled:opacity-50"
              @click="emit('fechar')"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="salvando"
              class="min-h-12 flex-1 rounded-full bg-accent px-5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {{ salvando ? 'Guardando…' : 'Guardar reserva' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
