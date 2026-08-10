<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { X } from '@lucide/vue'
import { formatTelefone, soDigitos } from '@/lib/format'
import { useConvidado } from '@/composables/useConvidado'
import { useTecladoVirtual } from '@/composables/useTecladoVirtual'
import Casinha from './Casinha.vue'

/**
 * Reservar um presente. Dois campos, nada mais — o convidado veio dar um
 * presente, nao preencher cadastro.
 *
 * Controlado pelo parent (salvando/erro/sucesso vem de fora), igual ao
 * ItemFormModal: quem fala com o Supabase e a view, nao o modal.
 *
 * Depois do sucesso ele nao fecha seco: troca de estado e comemora. Fechar em
 * silencio deixa a pessoa na duvida se deu certo, e ela nao tem onde conferir
 * depois — nao existe conta de convidado.
 */
defineProps({
  presente: { type: Object, required: true },
  salvando: { type: Boolean, default: false },
  erro: { type: String, default: '' },
  sucesso: { type: Boolean, default: false },
  /** Alguem reservou este item enquanto o modal estava aberto. */
  indisponivel: { type: Boolean, default: false },
})

const emit = defineEmits(['fechar', 'reservar'])

const { ler, limpar } = useConvidado()

// Este modal e digitado no celular: sem isto, o teclado sobe por cima do
// rodape e o "Confirmar reserva" some.
useTecladoVirtual()

const nome = ref('')
const telefone = ref('')
/** Veio do aparelho, nao foi digitado agora — controla o "não é você?". */
const lembrado = ref(false)
const primeiroCampo = ref(null)
const campoTelefone = ref(null)
const botaoConfirmar = ref(null)

const digitos = computed(() => soDigitos(telefone.value))
const primeiroNome = computed(() => nome.value.trim().split(/\s+/)[0] || '')

/**
 * Validacao.
 *
 * O botao nao e mais o mensageiro: ele continua clicavel e quem explica o
 * problema e a mensagem embaixo do campo. Botao apagado sem motivo visivel e
 * como uma porta trancada sem placa — a pessoa fica tentando.
 *
 * As mensagens so aparecem depois que o campo foi TOCADO (ou no envio).
 * Ninguem merece ler "faltam digitos" depois de digitar o primeiro numero.
 */
const tocado = ref({ nome: false, telefone: false })

/**
 * Particulas de ligacao. Em "José da Silva" o sobrenome e "Silva", nao "da" —
 * sem esta lista, "Ana Da" passava como nome completo.
 */
const PARTICULAS = new Set([
  'da',
  'das',
  'de',
  'del',
  'des',
  'di',
  'do',
  'dos',
  'du',
  'e',
  'la',
  'le',
  'van',
  'von',
  'y',
])

const erroNome = computed(() => {
  const partes = nome.value.trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return 'Escreve seu nome pra gente saber quem foi.'
  // Duas palavras de verdade: 2+ letras e que nao sejam particula.
  // A primeira posicao nunca e particula — "Van Gogh" comeca com nome, nao com
  // ligacao. Errar para o lado de aceitar e melhor do que recusar nome real.
  const proprias = partes.filter(
    (p, i) => p.length >= 2 && (i === 0 || !PARTICULAS.has(p.toLowerCase())),
  )
  if (proprias.length < 2) return 'Coloca o sobrenome também.'
  return ''
})

const erroTelefone = computed(() => {
  if (!digitos.value.length) return 'Precisamos do celular pra combinar a entrega.'
  // 11 = DDD + o 9. Fixo nao recebe WhatsApp, e a entrega e combinada por la.
  if (digitos.value.length !== 11) return 'Faltam dígitos: DDD + 9 números, 11 no total.'
  return ''
})

/** Mostrado agora? Só se o campo já foi tocado. */
const mostrarErroNome = computed(() => tocado.value.nome && !!erroNome.value)
const mostrarErroTelefone = computed(() => tocado.value.telefone && !!erroTelefone.value)

/**
 * Mascara enquanto digita. O ref guarda o texto formatado (e o que a pessoa ve);
 * no envio vai so digito, que e o que o banco aceita e o wa.me entende.
 */
function aoDigitarTelefone(e) {
  telefone.value = formatTelefone(e.target.value)
}

function enviar() {
  if (erroNome.value || erroTelefone.value) {
    // Revela os dois de uma vez e leva o foco ao primeiro problema — procurar
    // qual campo reclamou é trabalho que a tela pode fazer pela pessoa.
    tocado.value = { nome: true, telefone: true }
    ;(erroNome.value ? primeiroCampo : campoTelefone).value?.focus()
    return
  }
  // Espaço repetido some: "Ana   Souza" vira "Ana Souza".
  emit('reservar', {
    nome: nome.value.trim().replace(/\s+/g, ' '),
    telefone: digitos.value,
  })
}

function aoTeclar(e) {
  if (e.key === 'Escape') emit('fechar')
}

/** Aparelho da familia passa de mao em mao — precisa ter como dizer "sou outro". */
function esquecerMim() {
  limpar()
  nome.value = ''
  telefone.value = ''
  lembrado.value = false
  // Campos zerados por vontade da pessoa não são erro dela: volta ao estado
  // limpo, senão os dois campos ficariam vermelhos no ato de limpar.
  tocado.value = { nome: false, telefone: false }
  primeiroCampo.value?.focus()
}

onMounted(() => {
  document.addEventListener('keydown', aoTeclar)
  document.body.style.overflow = 'hidden'

  const salvo = ler()
  if (salvo) {
    nome.value = salvo.nome
    telefone.value = formatTelefone(salvo.telefone)
    lembrado.value = true
  }

  // Ja preenchido: foco no botao. Mandar a pessoa de volta a um campo que ela
  // nao precisa tocar so faz parecer que tem trabalho a fazer.
  if (lembrado.value) botaoConfirmar.value?.focus()
  else primeiroCampo.value?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', aoTeclar)
  document.body.style.overflow = ''
})

const campo =
  'w-full min-h-12 rounded-xl border border-line-strong bg-surface-0 px-3.5 text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent'
const rotulo = 'mb-1.5 block text-xs uppercase tracking-[0.14em] text-ink-faint'
const erroCampo = 'mt-1.5 text-xs text-danger'

/**
 * O corpo do modal e que rola agora, entao o navegador rola DENTRO dele ao focar
 * um campo. Sem a margem de rolagem, o rotulo do campo focado encosta na borda
 * do cabecalho e some.
 */
const bloco = 'scroll-mt-4 scroll-mb-4'

/** Barra de acao: alcancavel com o polegar mesmo com o teclado aberto. */
const rodape =
  'shrink-0 border-t border-line-soft px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]'
</script>

<template>
  <!-- Véu separado do painel: ele cobre a tela inteira mesmo quando o wrapper
       encolhe para caber acima do teclado. Fundido num só, sobraria uma faixa
       sem véu no topo quando o iOS desloca a página. -->
  <div class="fixed inset-0 z-[85]" style="background: var(--scrim)" @click="emit('fechar')" />

  <!-- Ancorado no viewport VISUAL: é o único que encolhe com o teclado aberto.
       Sem `visualViewport`, cai no 100svh e vale o comportamento de antes. -->
  <div
    class="fixed left-0 z-[85] flex w-full items-end justify-center pt-10 sm:items-center sm:px-4 sm:py-4"
    style="top: var(--vv-top, 0px); height: var(--vv-h, 100svh)"
    @click.self="emit('fechar')"
  >
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="`Reservar ${presente.item}`"
      class="flex max-h-full w-full flex-col rounded-t-3xl border-t border-line bg-surface-1 sm:max-w-md sm:rounded-3xl sm:border"
      style="animation: surgir 340ms cubic-bezier(0.16, 1, 0.3, 1)"
    >
      <div class="flex shrink-0 items-start justify-between gap-4 px-6 pt-5 pb-4">
        <div class="min-w-0">
          <p class="text-xs tracking-[0.2em] text-ink-faint uppercase">
            {{ sucesso ? 'é seu' : indisponivel ? 'já foi' : 'reservar' }}
          </p>
          <h2
            class="mt-1.5 font-[family-name:var(--font-display)] text-xl leading-tight font-semibold text-ink"
            style="font-variation-settings: 'SOFT' 70, 'WONK' 1, 'opsz' 60"
          >
            {{ presente.item }}
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

      <!-- ............................................. formulário -->
      <!-- `min-h-0` é o que permite o corpo encolher: sem ele, o mínimo
           automático do flex impede a rolagem interna e o rodapé é empurrado
           para fora da tela — de volta ao problema. -->
      <form
        v-if="!sucesso && !indisponivel"
        class="flex min-h-0 flex-1 flex-col"
        @submit.prevent="enviar"
      >
        <div class="min-h-0 flex-1 overflow-y-auto px-6">
          <p class="text-sm text-ink-soft">A gente marca como seu e ninguém mais reserva.</p>

          <div class="mt-4 space-y-3.5">
            <div :class="bloco">
              <label :class="rotulo" for="r-nome">Nome e sobrenome</label>
              <input
                id="r-nome"
                ref="primeiroCampo"
                v-model="nome"
                maxlength="80"
                autocomplete="name"
                :class="[campo, mostrarErroNome ? 'border-danger' : '']"
                :aria-invalid="mostrarErroNome"
                :aria-describedby="mostrarErroNome ? 'r-nome-erro' : undefined"
                placeholder="Ana Souza"
                @blur="tocado.nome = true"
              />
              <p v-if="mostrarErroNome" id="r-nome-erro" role="alert" :class="erroCampo">
                {{ erroNome }}
              </p>
            </div>

            <div :class="bloco">
              <label :class="rotulo" for="r-tel">Celular</label>
              <input
                id="r-tel"
                ref="campoTelefone"
                :value="telefone"
                type="tel"
                inputmode="numeric"
                autocomplete="tel"
                maxlength="16"
                :class="[campo, 'tnum', mostrarErroTelefone ? 'border-danger' : '']"
                :aria-invalid="mostrarErroTelefone"
                :aria-describedby="mostrarErroTelefone ? 'r-tel-erro' : 'r-tel-dica'"
                placeholder="(11) 98888-7777"
                @input="aoDigitarTelefone"
                @blur="tocado.telefone = true"
              />
              <p v-if="mostrarErroTelefone" id="r-tel-erro" role="alert" :class="erroCampo">
                {{ erroTelefone }}
              </p>
              <p v-else id="r-tel-dica" class="mt-1.5 text-xs text-ink-faint">
                Só pra combinar a entrega. Fica só com a gente.
              </p>
            </div>
          </div>

          <!-- Só quando os dados vieram do aparelho: quem digitou agora não
               precisa que ofereçam apagar o que acabou de escrever. -->
          <button
            v-if="lembrado"
            type="button"
            class="mt-3 min-h-9 text-xs text-ink-faint underline underline-offset-4 transition-colors hover:text-ink"
            @click="esquecerMim"
          >
            não é você? limpar
          </button>

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
              class="min-h-12 rounded-full px-5 text-sm text-ink-soft transition-colors hover:bg-surface-2"
              @click="emit('fechar')"
            >
              Cancelar
            </button>
            <button
              ref="botaoConfirmar"
              type="submit"
              :disabled="salvando"
              class="min-h-12 flex-1 rounded-full bg-accent px-5 font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {{ salvando ? 'Guardando…' : 'Confirmar reserva' }}
            </button>
          </div>
        </div>
      </form>

      <!-- ............................................. perdeu a corrida -->
      <!-- Interrompe de propósito: o formulário continuaria aceitando digitação
           para falhar no envio, e isso é pior do que a interrupção. -->
      <template v-else-if="indisponivel">
        <div role="alert" class="min-h-0 flex-1 overflow-y-auto px-6 pb-2 text-center">
          <Casinha variante="caixas" :tamanho="96" class="mx-auto text-ink-faint" />
          <p class="mt-5 text-lg font-medium text-ink">Esse presente acabou de ser reservado.</p>
          <p class="mx-auto mt-1.5 max-w-[32ch] text-sm text-ink-soft">
            Alguém foi mais rápido por segundos. Ainda tem bastante coisa boa esperando na
            lista.
          </p>
        </div>

        <div :class="rodape">
          <button
            type="button"
            class="min-h-12 w-full rounded-full bg-accent font-medium text-on-accent transition-colors hover:bg-accent-hover"
            @click="emit('fechar')"
          >
            Ver outros presentes
          </button>
        </div>
      </template>

      <!-- ............................................. confirmação -->
      <template v-else>
        <div class="min-h-0 flex-1 overflow-y-auto px-6 pb-2 text-center">
          <Casinha variante="casa" :tamanho="96" class="mx-auto text-accent" />
          <p class="mt-5 text-lg font-medium text-ink">Guardado com a gente.</p>
          <p class="mx-auto mt-1.5 max-w-[32ch] text-sm text-ink-soft">
            Obrigado, {{ primeiroNome }}. A gente chama no seu celular pra combinar a entrega.
          </p>
        </div>

        <div :class="rodape">
          <button
            type="button"
            class="min-h-12 w-full rounded-full bg-accent font-medium text-on-accent transition-colors hover:bg-accent-hover"
            @click="emit('fechar')"
          >
            Voltar pra lista
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
