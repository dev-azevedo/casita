<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, MailOpen } from '@lucide/vue'

import { usePresentes } from '@/composables/usePresentes'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useConvidado } from '@/composables/useConvidado'
import { useConvite } from '@/composables/useConvite'
import { useMinhasReservas } from '@/composables/useMinhasReservas'
import { useConfig } from '@/composables/useConfig'
import { CATEGORIAS, PRIORIDADES, DISPONIBILIDADE } from '@/lib/constants'
import { formatPercent, formatTelefone } from '@/lib/format'

import MarcaCasita from '@/components/MarcaCasita.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import Casinha from '@/components/Casinha.vue'
import ItemFilters from '@/components/ItemFilters.vue'
import PresenteFaixa from '@/components/PresenteFaixa.vue'
import ReservaModal from '@/components/ReservaModal.vue'
import IdentificarModal from '@/components/IdentificarModal.vue'
import DesfazerReserva from '@/components/DesfazerReserva.vue'
import ComoEntregar from '@/components/ComoEntregar.vue'
import ConviteModal from '@/components/ConviteModal.vue'

/**
 * A lista que os convidados recebem por link. Sem login, sem cadastro.
 *
 * Nada aqui sabe o preco de nada: os dados vem da view `presentes_publicos`,
 * que nao tem essas colunas (supabase/reservas.sql). Nao ha campo para esquecer
 * de esconder.
 */
const { presentes, loading, error, fetchPresentes, reservar, total, reservados, progresso } =
  usePresentes()

const {
  visivel: conviteVisivel,
  verificar: verificarConvite,
  abrir: abrirConvite,
  fechar: fecharConvite,
} = useConvite()

const vazios = () => ({ busca: '', categoria: '', prioridade: '', disponibilidade: '' })
const filtros = ref(vazios())

/** Cômodo e prioridade ajudam a escolher; status e tipo são conversa interna. */
const GRUPOS = [
  { chave: 'categoria', rotulo: 'Cômodo', opcoes: CATEGORIAS },
  { chave: 'prioridade', rotulo: 'Prioridade', opcoes: PRIORIDADES, comMarca: true },
  { chave: 'disponibilidade', rotulo: 'Disponibilidade', opcoes: DISPONIBILIDADE },
]

const { salvar: salvarConvidado, dispensar, foiDispensado } = useConvidado()
const { fetchConfig } = useConfig()

/**
 * Identificacao do convidado. Sem isto, quem reservava num aparelho e abria a
 * lista em outro nao tinha como saber o que ja era seu — a lista publica so diz
 * que o item saiu, nunca para quem.
 */
const {
  minhas,
  carregando: identificando,
  identificado,
  quantas,
  telefone: meuTelefone,
  identificar,
  recarregar: recarregarMinhas,
  esquecer,
  cancelar: cancelarMinha,
  registrarLocal,
  restaurar,
} = useMinhasReservas()

const mostrarIdentificar = ref(false)
/** Foi a tela que abriu a pergunta, nao a pessoa — muda o que "fechar" significa. */
const perguntaAutomatica = ref(false)

const paraDesfazer = ref(null)
const desfazendo = ref(false)
const erroDesfazer = ref('')

const escolhido = ref(null)
/** Modal aberto so para consulta: item de outra pessoa, sem formulario. */
const modoEntrega = ref(false)
const salvando = ref(false)
const erroReserva = ref('')
const sucesso = ref(false)

/**
 * Depois de um refetch, `escolhido` aponta para um objeto do array antigo — ele
 * nunca mais recebe atualizacao. Para saber se o item saiu, olhe a lista atual.
 */
const escolhidoAtual = computed(() =>
  presentes.value.find((p) => p.id === escolhido.value?.id),
)

/**
 * Cobre os dois caminhos com uma checagem so: o refresh de 5s e o erro do
 * banco (que tambem marca o item como reservado em usePresentes).
 *
 * O `!sucesso` nao e detalhe: reservar() marca reservado = true, e sem ele a
 * comemoracao viraria "acabou de ser reservado" no frame seguinte.
 */
const indisponivel = computed(
  () => !modoEntrega.value && !sucesso.value && !!escolhidoAtual.value?.reservado,
)

/**
 * Quem já reservou neste aparelho não é perguntado: o telefone guardado vale
 * como resposta. A pergunta é para o navegador novo — que é justamente onde a
 * memória local não existe.
 *
 * Nunca roda com o convite na tela: os dois abrem no mesmo instante e a pergunta
 * ficaria escondida atrás dele, respondida no escuro ou dispensada sem ser vista.
 */
async function talvezPerguntarIdentificacao() {
  const reconhecido = await restaurar()
  if (!reconhecido && !foiDispensado()) {
    perguntaAutomatica.value = true
    mostrarIdentificar.value = true
  }
}

onMounted(() => {
  fetchPresentes()
  verificarConvite()
  if (!conviteVisivel.value) talvezPerguntarIdentificacao()
})

/** O convite sai da frente e a pergunta assume o lugar dele. */
function aoFecharConvite() {
  fecharConvite()
  talvezPerguntarIdentificacao()
}

// A lista anda sozinha: numa festa, dois convidados olhando a mesma tela
// precisam ver o item sair. `silencioso` evita piscar o carregamento.
// A config vem junto: se o casal trocar a cor da casa, quem está com a lista
// aberta vê a mudança sem recarregar.
// As reservas próprias andam no mesmo ciclo: o casal pode cancelar uma pelo
// painel, e o selo "sua reserva" não pode sobreviver a isso.
useAutoRefresh(() =>
  Promise.all([fetchPresentes({ silencioso: true }), fetchConfig(), recarregarMinhas()]),
)

const temFiltro = computed(() => Object.values(filtros.value).some((v) => v !== ''))

/**
 * Busca sem acento: quem digita "area" espera achar "Área de serviço". A lista
 * do painel não faz isso e é uma pequena tortura — aqui não dá pra pedir pro
 * convidado tentar de novo com o acento certo.
 */
const semAcento = (s) =>
  String(s ?? '')
    .normalize('NFD')
    // Faixa dos diacríticos combinantes que o NFD separou da letra.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/**
 * Funcao solta, e nao so o corpo do computed, porque o painel de filtros usa a
 * mesma regra para contar quantos presentes o rascunho deixaria — duas copias
 * da regra dariam dois numeros diferentes na mesma tela.
 */
function combina(presente, f) {
  if (f.categoria && presente.categoria !== f.categoria) return false
  if (f.prioridade && presente.prioridade !== f.prioridade) return false
  if (f.disponibilidade && !!presente.reservado !== (f.disponibilidade === 'Reservado')) {
    return false
  }
  const busca = semAcento(f.busca.trim())
  if (
    busca &&
    !semAcento(`${presente.item} ${presente.categoria} ${presente.observacoes ?? ''}`).includes(
      busca,
    )
  ) {
    return false
  }
  return true
}

const filtrados = computed(() => presentes.value.filter((p) => combina(p, filtros.value)))

const contarComFiltro = (f) => presentes.value.filter((p) => combina(p, f)).length

/** Já chega ordenado do composable; aqui só agrupa mantendo a ordem. */
const grupos = computed(() => {
  const mapa = new Map()
  for (const p of filtrados.value) {
    if (!mapa.has(p.categoria)) mapa.set(p.categoria, [])
    mapa.get(p.categoria).push(p)
  }
  return [...mapa.entries()].map(([categoria, itens]) => ({
    categoria,
    itens,
    livres: itens.filter((i) => !i.reservado).length,
  }))
})

function limparFiltros() {
  filtros.value = vazios()
}

function abrirReserva(presente) {
  escolhido.value = presente
  erroReserva.value = ''
  sucesso.value = false
  modoEntrega.value = false
}

function fecharReserva() {
  escolhido.value = null
  modoEntrega.value = false
}

/**
 * Presente ja reservado nao tem mais botao — e quem reservou pode ter fechado o
 * modal sem anotar a chave. Abre o MESMO modal em modo consulta: sem formulario,
 * mas com o link da loja, que e o que diz de quanto fazer o pix.
 */
function verComoEntregar(presente) {
  escolhido.value = presente
  modoEntrega.value = true
}

async function confirmarReserva({ nome, telefone }) {
  salvando.value = true
  erroReserva.value = ''
  try {
    await reservar(escolhido.value.id, nome, telefone)
    sucesso.value = true
    // Só depois de dar certo: tentativa que falhou não é dado confirmado.
    salvarConvidado(nome, telefone)
    // Quem acabou de reservar já está identificado — o selo vira "sua reserva"
    // no mesmo frame, sem esperar o ciclo de 5s nem perguntar o telefone.
    registrarLocal(escolhido.value.id, nome, telefone)
  } catch (e) {
    erroReserva.value = e.message
  } finally {
    salvando.value = false
  }
}

// ---------------------------------------------------------------- identidade

function abrirIdentificacao() {
  perguntaAutomatica.value = false
  mostrarIdentificar.value = true
}

/**
 * Fechar sem responder. Quando foi a tela que abriu a pergunta, isso conta como
 * "agora não" e a pergunta não volta: reabrir a cada carregamento seria cobrança,
 * e o botão da lista continua ali para quem mudar de ideia.
 */
function fecharIdentificacao() {
  if (perguntaAutomatica.value) dispensar()
  mostrarIdentificar.value = false
}

function dispensarIdentificacao() {
  dispensar()
  mostrarIdentificar.value = false
}

/**
 * Fecha sempre. Zero reserva é o caso comum e falha de rede não é problema de
 * quem só quis dizer o celular — o número fica guardado nos dois casos e o ciclo
 * de 5s traz as reservas quando conseguir.
 */
async function confirmarIdentificacao(telefone) {
  await identificar(telefone)
  mostrarIdentificar.value = false
}

function naoSouEu() {
  esquecer()
  // `esquecer` limpa também a dispensa: o próximo a pegar o celular merece a
  // pergunta de volta. Abrir agora poupa dele um recarregamento.
  abrirIdentificacao()
}

// ------------------------------------------------------------------ desfazer

function pedirDesfazer(presente) {
  erroDesfazer.value = ''
  paraDesfazer.value = presente
}

async function confirmarDesfazer() {
  desfazendo.value = true
  erroDesfazer.value = ''
  try {
    await cancelarMinha(paraDesfazer.value.id)
    paraDesfazer.value = null
    // O item precisa voltar a "Reservar" agora, não no próximo ciclo.
    await fetchPresentes({ silencioso: true })
  } catch (e) {
    erroDesfazer.value = e.message
  } finally {
    desfazendo.value = false
  }
}
</script>

<template>
  <div class="min-h-[100svh] bg-surface-0">
    <header
      class="sticky top-0 z-40 border-b border-line-soft"
      style="
        background: color-mix(in oklch, var(--surface-0) 88%, transparent);
        backdrop-filter: blur(12px);
        padding-top: env(safe-area-inset-top);
      "
    >
      <div class="mx-auto flex h-16 max-w-4xl items-center gap-4 px-5 sm:px-6">
        <RouterLink
          :to="{ name: 'portal' }"
          class="grid size-11 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
          aria-label="Voltar ao início"
        >
          <ArrowLeft :size="19" :stroke-width="2" />
        </RouterLink>
        <MarcaCasita />
        <span class="flex-1" />
        <button
          type="button"
          class="grid size-11 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
          aria-label="Ver convite"
          @click="abrirConvite"
        >
          <MailOpen :size="19" :stroke-width="2" />
        </button>
        <ThemeToggle />
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-5 pb-28 sm:px-6">
      <!-- Abertura editorial: um número que importa, sem seis cartões iguais -->
      <section class="pt-12 pb-10 sm:pt-16">
        <p class="surgir text-xs tracking-[0.28em] text-ink-faint uppercase" style="--i: 0">
          chá de casa nova
        </p>
        <h1
          class="surgir mt-3 max-w-[16ch] text-2xl leading-[0.98] font-semibold text-ink"
          style="--i: 1; font-variation-settings: 'SOFT' 80, 'WONK' 1, 'opsz' 144"
        >
          Escolhe um, a gente marca como seu.
        </h1>
        <p class="surgir mt-4 max-w-[46ch] text-ink-soft" style="--i: 2">
          É só clicar em reservar e deixar seu nome. Cada presente tem o link da loja,
          pra você dar uma olhada antes de escolher.
        </p>

        <div
          v-if="!loading && total"
          class="surgir mt-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5"
          style="--i: 3"
        >
          <p class="tnum shrink-0 text-sm text-ink-soft">
            <span class="text-lg font-semibold text-ink">{{ reservados }}</span>
            de {{ total }} já reservados
          </p>
          <div
            class="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2 sm:mb-1.5"
            role="progressbar"
            :aria-valuenow="Math.round(progresso * 100)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${formatPercent(progresso)} da lista já foi reservada`"
          >
            <div
              class="h-full rounded-full bg-accent transition-[width] duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
              :style="{ width: formatPercent(progresso) }"
            />
          </div>
        </div>
      </section>

      <p v-if="error" class="mb-8 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
        Não deu pra carregar a lista: {{ error }}
      </p>

      <div v-if="loading" class="flex flex-col items-center gap-4 py-24 text-ink-faint">
        <Casinha variante="planta" :tamanho="88" class="flutuar" />
        <p class="text-sm">Buscando os presentes…</p>
      </div>

      <template v-else>
        <ItemFilters v-model="filtros" :grupos="GRUPOS" :contar="contarComFiltro" />

        <div class="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p class="tnum text-sm text-ink-faint">
            {{ filtrados.length }} de {{ total }} presentes
          </p>

          <!-- O caminho de volta. Sem ele, "ainda não reservei" (e o X da
               pergunta) viravam beco sem saída até limpar o navegador. -->
          <p v-if="identificado" class="text-sm text-ink-faint">
            <span class="tnum">{{ formatTelefone(meuTelefone) }}</span>
            <span v-if="quantas"> · {{ quantas }} {{ quantas === 1 ? 'reserva sua' : 'reservas suas' }}</span>
            <button
              type="button"
              class="ml-2 min-h-9 underline underline-offset-4 transition-colors hover:text-ink"
              @click="naoSouEu"
            >
              não é você?
            </button>
          </p>
          <button
            v-else
            type="button"
            class="min-h-9 text-sm text-ink-faint underline underline-offset-4 transition-colors hover:text-ink"
            @click="abrirIdentificacao"
          >
            já reservei algo?
          </button>
        </div>

        <div v-if="grupos.length" class="mt-8 space-y-12">
          <section
            v-for="(grupo, gi) in grupos"
            :key="grupo.categoria"
            class="surgir"
            :style="{ '--i': Math.min(gi, 8) }"
          >
            <header
              class="sticky top-16 z-20 -mx-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-1 py-3"
              style="
                background: color-mix(in oklch, var(--surface-0) 92%, transparent);
                backdrop-filter: blur(8px);
              "
            >
              <h2 class="text-lg font-semibold text-ink">{{ grupo.categoria }}</h2>
              <p class="tnum text-sm text-ink-faint">
                {{ grupo.livres }} de {{ grupo.itens.length }} disponíveis
              </p>
            </header>

            <ul>
              <PresenteFaixa
                v-for="p in grupo.itens"
                :key="p.id"
                :presente="p"
                :minha-reserva="minhas.get(p.id) ?? null"
                @reservar="abrirReserva"
                @como-entregar="verComoEntregar"
                @desfazer="pedirDesfazer"
              />
            </ul>
          </section>
        </div>

        <!-- Vazio que ensina o próximo passo, não só avisa que está vazio -->
        <div v-else class="flex flex-col items-center gap-5 py-20 text-center">
          <Casinha variante="caixas" :tamanho="104" class="text-ink-faint" />
          <div>
            <p class="text-lg font-medium text-ink">
              {{ temFiltro ? 'Nada com esses filtros.' : 'A lista ainda está vindo.' }}
            </p>
            <p class="mx-auto mt-1.5 max-w-[36ch] text-sm text-ink-soft">
              {{
                temFiltro
                  ? 'Tenta soltar um dos filtros — pode ter presente esperando no cômodo do lado.'
                  : 'Ainda não tem presente publicado. Volta daqui a pouco que a gente avisa no grupo.'
              }}
            </p>
          </div>
          <button
            v-if="temFiltro"
            type="button"
            class="min-h-11 rounded-full border border-line px-5 text-sm text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            @click="limparFiltros"
          >
            Limpar filtros
          </button>
        </div>
      </template>

      <!-- Fora do v-else de proposito: quem chega so pra mandar o pix nao
           deveria depender do estado da lista nem dos filtros. -->
      <ComoEntregar
        id="como-entregar"
        class="mt-20 max-w-[52ch] scroll-mt-24 border-t border-line-soft pt-8"
      />

      <footer class="mt-16 border-t border-line-soft pt-8 text-center text-sm text-ink-faint">
        <p>Obrigado por fazer parte da nossa casa.</p>
        <!-- Quem rolou a lista inteira chegou aqui longe do botão do topo. -->
        <button
          type="button"
          class="mt-2 inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 transition-colors hover:text-ink"
          @click="abrirConvite"
        >
          Ver o convite
        </button>
      </footer>
    </main>

    <ReservaModal
      v-if="escolhido"
      :presente="escolhido"
      :salvando="salvando"
      :erro="erroReserva"
      :sucesso="sucesso"
      :indisponivel="indisponivel"
      :somente-entrega="modoEntrega"
      @fechar="fecharReserva"
      @reservar="confirmarReserva"
    />

    <IdentificarModal
      v-if="mostrarIdentificar"
      :carregando="identificando"
      @identificar="confirmarIdentificacao"
      @dispensar="dispensarIdentificacao"
      @fechar="fecharIdentificacao"
    />

    <ConviteModal v-if="conviteVisivel" @fechar="aoFecharConvite" />

    <DesfazerReserva
      v-if="paraDesfazer"
      :presente="paraDesfazer"
      :cancelando="desfazendo"
      :erro="erroDesfazer"
      @fechar="paraDesfazer = null"
      @confirmar="confirmarDesfazer"
    />
  </div>
</template>
