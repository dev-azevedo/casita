<script setup>
import { ref, computed, nextTick, useId, onBeforeUnmount } from 'vue'
import { ChevronRight, Copy, Check, ArrowUpRight } from '@lucide/vue'
import { PIX, ENDERECO, ENDERECO_LINHA, WHATSAPP, mensagemPix } from '@/lib/entrega'
import { linkWhatsApp } from '@/lib/format'

/**
 * COMO ENTREGAR
 *
 * As tres formas de fazer o presente chegar. Vive em tres lugares: no modal de
 * reserva (antes de confirmar), fixo no rodape da lista publica, e como destino
 * do "como entregar" de um item ja reservado.
 *
 * Perguntas RECOLHIDAS, nao um bloco de instrucoes: quem so quer reservar nao
 * precisa ler nada, e quem ja quer pagar acha a chave sem sair do fluxo.
 *
 * Uma aberta por vez. Duas juntas, dentro do modal, empurrariam o "Confirmar
 * reserva" para fora da tela.
 */
const props = defineProps({
  /**
   * Mostra o lembrete de confirmar a reserva. So faz sentido dentro do modal,
   * onde existe uma reserva pela metade — na pagina nao ha o que confirmar.
   */
  lembreteReserva: { type: Boolean, default: false },

  /**
   * Link da loja do presente em questao. So existe quando o bloco esta dentro do
   * modal de um item — no rodape da lista nao ha presente nenhum em foco. E o
   * que responde "quanto eu mando?", entao vive dentro do painel do pix.
   */
  linkProduto: { type: String, default: '' },

  /**
   * Nome do presente, para a mensagem do WhatsApp sair pronta. Vazio no bloco do
   * rodape da lista, onde nao ha presente em foco — a mensagem cai no texto geral.
   */
  nomeItem: { type: String, default: '' },

  /** '' | 'pix' | 'casa' — qual pergunta ja nasce aberta. */
  inicial: { type: String, default: '' },
})

const linkAvisoPix = computed(() => linkWhatsApp(WHATSAPP, mensagemPix(props.nomeItem)))

/**
 * Duas instancias podem estar montadas ao mesmo tempo (a da pagina e a do modal
 * aberto por cima dela). Sem sufixo, os `aria-controls` das duas apontariam para
 * o mesmo id e o leitor de tela abriria o painel errado.
 */
const uid = useId()
const idPixBtn = `entrega-pix-btn-${uid}`
const idPix = `entrega-pix-${uid}`
const idCasaBtn = `entrega-casa-btn-${uid}`
const idCasa = `entrega-casa-${uid}`

const aberto = ref(props.inicial)

let timerRolagem = null

function alternar(qual, ev) {
  const abrindo = aberto.value !== qual
  aberto.value = abrindo ? qual : ''
  if (!abrindo) return

  // O painel abre perto do fim e nasce fora da area visivel. Espera a altura
  // terminar de crescer (o 0fr->1fr leva 260ms) e traz a caixa inteira pra tela
  // — senao a pessoa clica na pergunta e parece que nada aconteceu.
  const caixa = ev?.currentTarget?.parentElement
  clearTimeout(timerRolagem)
  nextTick(() => {
    timerRolagem = setTimeout(() => {
      caixa?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, 300)
  })
}

/** '' | 'pix' | 'endereco' — qual botao esta no estado "copiado". */
const copiado = ref('')
const falhou = ref('')
let timerCopia = null

const avisoCopia = computed(() => {
  if (copiado.value === 'pix') return 'Chave pix copiada.'
  if (copiado.value === 'endereco') return 'Endereço copiado.'
  return ''
})

/** navigator.clipboard so existe em https/localhost; o resto cai no jeito antigo. */
async function paraAreaDeTransferencia(texto) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    try {
      const alvo = document.createElement('textarea')
      alvo.value = texto
      alvo.setAttribute('readonly', '')
      alvo.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
      document.body.appendChild(alvo)
      alvo.select()
      const ok = document.execCommand('copy')
      alvo.remove()
      return ok
    } catch {
      return false
    }
  }
}

async function copiar(texto, marca) {
  const ok = await paraAreaDeTransferencia(texto)
  clearTimeout(timerCopia)
  copiado.value = ok ? marca : ''
  falhou.value = ok ? '' : marca
  // Volta sozinho: botao que fica "copiado" para sempre mente na segunda vez.
  timerCopia = setTimeout(() => {
    copiado.value = ''
    falhou.value = ''
  }, 2400)
}

onBeforeUnmount(() => {
  clearTimeout(timerCopia)
  clearTimeout(timerRolagem)
})

/** Pergunta recolhivel: mesma linguagem do <details> do ItemFormModal. */
const pergunta =
  'flex min-h-12 w-full cursor-pointer items-center gap-2.5 px-3.5 text-left text-sm text-ink transition-colors hover:bg-surface-2'

/** 0fr -> 1fr abre a altura sem animar `height`. */
const painel = 'grid transition-[grid-template-rows] duration-[260ms] ease-expo'

const dadosPix = 'grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm'

/**
 * Copiar a chave (ou o endereco) parece o fim da tarefa — e nao e. Quem sai do
 * modal sem apertar "Confirmar reserva" deixa o presente solto na lista, e outra
 * pessoa pega. O lembrete fica logo abaixo da acao que engana, nao no rodape.
 */
const LEMBRETE = 'Falta confirmar a reserva aqui embaixo — é isso que marca o presente como seu.'
const lembrete = 'mt-3 text-xs font-medium text-accent-ink'
</script>

<template>
  <section>
    <p class="text-xs tracking-[0.2em] text-ink-faint uppercase">como entregar</p>
    <p class="mt-1.5 text-sm text-ink-soft">
      Três jeitos, todos valem: levar no chá de casa nova, entregar aqui no nosso apartamento ou
      mandar um pix.
    </p>

    <div class="mt-3.5 space-y-2.5">
      <div class="overflow-hidden rounded-xl border border-line-soft">
        <button
          :id="idPixBtn"
          type="button"
          :class="pergunta"
          :aria-expanded="aberto === 'pix'"
          :aria-controls="idPix"
          @click="alternar('pix', $event)"
        >
          <ChevronRight
            :size="15"
            :stroke-width="2"
            class="shrink-0 text-ink-faint transition-transform duration-200"
            :class="aberto === 'pix' ? 'rotate-90' : ''"
          />
          Deseja dar o presente em pix?
        </button>

        <div
          :id="idPix"
          role="region"
          :aria-labelledby="idPixBtn"
          :class="painel"
          :style="{ gridTemplateRows: aberto === 'pix' ? '1fr' : '0fr' }"
        >
          <!-- `inert` tira o conteudo fechado do caminho do teclado: sem ele o
               Tab entra numa area de altura zero. -->
          <div class="overflow-hidden" :inert="aberto !== 'pix' || undefined">
            <div class="px-3.5 pt-1 pb-4">
              <!-- Primeiro o valor, depois a conta: chave copiada sem saber
                   quanto mandar deixa a pessoa parada no app do banco. -->
              <p class="text-sm text-ink-soft">
                O valor é o do presente — confere na loja antes de mandar.
              </p>

              <a
                v-if="linkProduto"
                :href="linkProduto"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-2.5 inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
              >
                ver na loja
                <ArrowUpRight :size="15" :stroke-width="2" />
              </a>

              <dl :class="[dadosPix, 'mt-4']">
                <dt class="text-ink-faint">Titular</dt>
                <dd class="text-ink">{{ PIX.titular }}</dd>
                <dt class="text-ink-faint">Banco</dt>
                <dd class="text-ink">{{ PIX.banco }}</dd>
                <dt class="text-ink-faint">Chave</dt>
                <dd class="text-ink">{{ PIX.tipoChave }}</dd>
              </dl>

              <!-- Contornado, nao cheio: dentro do modal o unico botao cheio
                   continua sendo o "Confirmar reserva". -->
              <button
                type="button"
                class="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border text-sm font-medium transition-colors"
                :class="
                  copiado === 'pix'
                    ? 'border-transparent bg-accent-soft text-accent-ink'
                    : 'border-line-strong text-ink hover:bg-surface-2'
                "
                @click="copiar(PIX.chave, 'pix')"
              >
                <component :is="copiado === 'pix' ? Check : Copy" :size="15" :stroke-width="2" />
                {{ copiado === 'pix' ? 'chave copiada' : 'copiar chave pix' }}
              </button>

              <!-- Com a chave fora da tela, falhar em silencio deixaria a pessoa
                   sem saida: aqui e o unico lugar onde o e-mail aparece. -->
              <p v-if="falhou === 'pix'" class="mt-2 text-xs text-danger">
                Não deu pra copiar neste aparelho. A chave é
                <span class="font-medium break-all select-all">{{ PIX.chave }}</span>
              </p>

              <!-- Link de texto, nao um terceiro botao: o painel ja tem o "ver
                   na loja" contornado e o "copiar chave pix" de largura cheia. -->
              <p class="mt-2.5 text-xs text-ink-faint">
                Depois de mandar, chama a gente no WhatsApp avisando que fez o pix.
                <a
                  :href="linkAvisoPix"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-medium text-accent-ink underline underline-offset-4"
                >
                  Clicando aqui
                </a>
              </p>

              <p v-if="lembreteReserva" :class="lembrete">{{ LEMBRETE }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-line-soft">
        <button
          :id="idCasaBtn"
          type="button"
          :class="pergunta"
          :aria-expanded="aberto === 'casa'"
          :aria-controls="idCasa"
          @click="alternar('casa', $event)"
        >
          <ChevronRight
            :size="15"
            :stroke-width="2"
            class="shrink-0 text-ink-faint transition-transform duration-200"
            :class="aberto === 'casa' ? 'rotate-90' : ''"
          />
          Deseja entregar o presente em nosso apartamento?
        </button>

        <div
          :id="idCasa"
          role="region"
          :aria-labelledby="idCasaBtn"
          :class="painel"
          :style="{ gridTemplateRows: aberto === 'casa' ? '1fr' : '0fr' }"
        >
          <div class="overflow-hidden" :inert="aberto !== 'casa' || undefined">
            <div class="px-3.5 pt-1 pb-4">
              <!-- O numero do apartamento e o que some na hora de anotar: linha
                   propria, com peso. -->
              <address class="text-sm not-italic">
                <span class="block text-ink">{{ ENDERECO.rua }}</span>
                <span class="block text-ink-soft">{{ ENDERECO.cidade }}</span>
                <span class="mt-1.5 block font-medium text-ink">{{ ENDERECO.complemento }}</span>
              </address>

              <div class="mt-3 flex flex-wrap items-center gap-x-5">
                <button
                  type="button"
                  class="flex min-h-9 items-center gap-2 text-sm underline underline-offset-4 transition-colors"
                  :class="
                    copiado === 'endereco' ? 'text-accent-ink' : 'text-ink-soft hover:text-ink'
                  "
                  @click="copiar(ENDERECO_LINHA, 'endereco')"
                >
                  <component
                    :is="copiado === 'endereco' ? Check : Copy"
                    :size="14"
                    :stroke-width="2"
                  />
                  {{ copiado === 'endereco' ? 'endereço copiado' : 'copiar endereço' }}
                </button>
                <a
                  :href="ENDERECO.mapa"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="grid min-h-9 items-center text-sm text-accent-ink underline underline-offset-4"
                >
                  abrir no mapa
                </a>
              </div>

              <p v-if="falhou === 'endereco'" class="mt-2 text-xs text-danger">
                Não deu pra copiar neste aparelho. O endereço está logo acima.
              </p>

              <p class="mt-2.5 text-xs text-ink-faint">
                Chama a gente no WhatsApp antes de vir, pra ter alguém em casa.
              </p>

              <p v-if="lembreteReserva" :class="lembrete">{{ LEMBRETE }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p aria-live="polite" class="sr-only">{{ avisoCopia }}</p>
  </section>
</template>
