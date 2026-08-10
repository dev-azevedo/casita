<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'

import { usePresentes } from '@/composables/usePresentes'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useConvidado } from '@/composables/useConvidado'
import { useConfig } from '@/composables/useConfig'
import { CATEGORIAS, PRIORIDADES, DISPONIBILIDADE } from '@/lib/constants'
import { formatPercent } from '@/lib/format'

import MarcaCasita from '@/components/MarcaCasita.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import Casinha from '@/components/Casinha.vue'
import ItemFilters from '@/components/ItemFilters.vue'
import PresenteFaixa from '@/components/PresenteFaixa.vue'
import ReservaModal from '@/components/ReservaModal.vue'

/**
 * A lista que os convidados recebem por link. Sem login, sem cadastro.
 *
 * Nada aqui sabe o preco de nada: os dados vem da view `presentes_publicos`,
 * que nao tem essas colunas (supabase/reservas.sql). Nao ha campo para esquecer
 * de esconder.
 */
const { presentes, loading, error, fetchPresentes, reservar, total, reservados, progresso } =
  usePresentes()

const vazios = () => ({ busca: '', categoria: '', prioridade: '', disponibilidade: '' })
const filtros = ref(vazios())

/** Cômodo e prioridade ajudam a escolher; status e tipo são conversa interna. */
const GRUPOS = [
  { chave: 'categoria', rotulo: 'Cômodo', opcoes: CATEGORIAS },
  { chave: 'prioridade', rotulo: 'Prioridade', opcoes: PRIORIDADES, comMarca: true },
  { chave: 'disponibilidade', rotulo: 'Disponibilidade', opcoes: DISPONIBILIDADE },
]

const { salvar: salvarConvidado } = useConvidado()
const { fetchConfig } = useConfig()

const escolhido = ref(null)
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
  () => !sucesso.value && !!escolhidoAtual.value?.reservado,
)

onMounted(fetchPresentes)

// A lista anda sozinha: numa festa, dois convidados olhando a mesma tela
// precisam ver o item sair. `silencioso` evita piscar o carregamento.
// A config vem junto: se o casal trocar a cor da casa, quem está com a lista
// aberta vê a mudança sem recarregar.
useAutoRefresh(() => Promise.all([fetchPresentes({ silencioso: true }), fetchConfig()]))

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

const filtrados = computed(() => {
  const busca = semAcento(filtros.value.busca.trim())
  return presentes.value.filter((p) => {
    if (filtros.value.categoria && p.categoria !== filtros.value.categoria) return false
    if (filtros.value.prioridade && p.prioridade !== filtros.value.prioridade) return false
    if (filtros.value.disponibilidade) {
      const querReservado = filtros.value.disponibilidade === 'Reservado'
      if (!!p.reservado !== querReservado) return false
    }
    if (busca && !semAcento(`${p.item} ${p.categoria} ${p.observacoes ?? ''}`).includes(busca)) {
      return false
    }
    return true
  })
})

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
}

function fecharReserva() {
  escolhido.value = null
}

async function confirmarReserva({ nome, telefone }) {
  salvando.value = true
  erroReserva.value = ''
  try {
    await reservar(escolhido.value.id, nome, telefone)
    sucesso.value = true
    // Só depois de dar certo: tentativa que falhou não é dado confirmado.
    salvarConvidado(nome, telefone)
  } catch (e) {
    erroReserva.value = e.message
  } finally {
    salvando.value = false
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

        <div v-if="!loading && total" class="surgir mt-9 flex items-end gap-5" style="--i: 3">
          <p class="tnum shrink-0 text-sm text-ink-soft">
            <span class="text-lg font-semibold text-ink">{{ reservados }}</span>
            de {{ total }} já reservados
          </p>
          <div
            class="mb-1.5 h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"
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
        <ItemFilters v-model="filtros" :grupos="GRUPOS" />

        <p class="tnum mt-4 text-sm text-ink-faint">
          {{ filtrados.length }} de {{ total }} presentes
        </p>

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
                @reservar="abrirReserva"
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

      <footer class="mt-20 border-t border-line-soft pt-8 text-center text-sm text-ink-faint">
        <p>Obrigado por fazer parte da nossa casa.</p>
      </footer>
    </main>

    <ReservaModal
      v-if="escolhido"
      :presente="escolhido"
      :salvando="salvando"
      :erro="erroReserva"
      :sucesso="sucesso"
      :indisponivel="indisponivel"
      @fechar="fecharReserva"
      @reservar="confirmarReserva"
    />
  </div>
</template>
