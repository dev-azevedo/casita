<script setup>
import { ref, computed, onBeforeUnmount, watch } from 'vue'
import { Search, SlidersHorizontal, X } from '@lucide/vue'
import {
  CATEGORIAS,
  PRIORIDADES,
  STATUS,
  TIPOS,
  TIPO_ROTULO,
  PRIORIDADE_DESCRICAO,
} from '@/lib/constants'
import MarcaPrioridade from './MarcaPrioridade.vue'

const filtros = defineModel({ type: Object, required: true })

/**
 * Os grupos vem de fora porque a lista publica filtra outra coisa: la nao
 * existe "Status" nem "Tipo" (vocabulario interno), existe "Disponibilidade".
 * O painel privado nao passa nada e fica com o conjunto de sempre.
 *
 * `comMarca` liga a marca de prioridade nas opcoes do grupo — a mesma marca que
 * aparece nas linhas da lista. Sem ela, escolher no filtro e um exercicio de
 * traduzir palavra para bolinha de cabeca.
 *
 * `rotulos` mapeia valor guardado -> texto na tela, para os casos em que o nome
 * do banco nao e o nome que a gente usa (ver TIPO_ROTULO).
 */
const props = defineProps({
  /**
   * Conta quantos itens sobrariam com um conjunto de filtros. Opcional: sem ela
   * o botao volta a dizer so "Ver resultados".
   *
   * E a peca que paga o rascunho. Escolher filtro sem ver efeito nenhum ate
   * confirmar seria escolher no escuro; com a contagem, o botao vira o retorno
   * imediato que a lista parada deixou de dar.
   */
  contar: { type: Function, default: null },
  grupos: {
    type: Array,
    default: () => [
      { chave: 'categoria', rotulo: 'Cômodo', opcoes: CATEGORIAS },
      { chave: 'prioridade', rotulo: 'Prioridade', opcoes: PRIORIDADES, comMarca: true },
      { chave: 'status', rotulo: 'Status', opcoes: STATUS },
      { chave: 'tipo', rotulo: 'Tipo', opcoes: TIPOS, rotulos: TIPO_ROTULO },
    ],
  },
})

const textoDe = (grupo, valor) => grupo.rotulos?.[valor] ?? valor

/**
 * A legenda das marcas so aparece quando prioridade e um filtro desta tela —
 * `comMarca` ja e o sinal de que a marca esta em jogo aqui. Explicar bolinha que
 * a tela nao usa seria ruido.
 */
const grupoComMarca = computed(() => props.grupos.find((g) => g.comMarca) ?? null)

const aberto = ref(false)

/**
 * Rascunho: o que esta escolhido DENTRO da folha, ainda sem valer.
 *
 * Antes cada toque reescrevia o filtro de verdade e a lista se reorganizava
 * atras do painel aberto — o "Ver resultados" no rodape so fechava a folha,
 * prometendo uma acao que ja tinha acontecido. Agora ele e quem aplica.
 *
 * Guarda so as chaves de grupo. `busca` fica de fora de proposito: ela mora
 * fora da folha, nao tem botao de aplicar e e o filtro mais usado — esperar
 * confirmacao para cada letra seria pior.
 */
const rascunho = ref({})

const zerado = () => Object.fromEntries(props.grupos.map((g) => [g.chave, '']))

/** Fatia do filtro que a folha controla — a busca nao entra. */
const somenteGrupos = (obj) =>
  Object.fromEntries(props.grupos.map((g) => [g.chave, obj[g.chave] ?? '']))

function abrir() {
  rascunho.value = somenteGrupos(filtros.value)
  aberto.value = true
}

/** Fechar sem confirmar descarta: X, veu e Escape sao "deixa pra la". */
function fechar() {
  aberto.value = false
}

function aplicar() {
  filtros.value = { ...filtros.value, ...rascunho.value }
  aberto.value = false
}

const ativos = computed(() => props.grupos.filter((g) => filtros.value[g.chave]))

/** Quantos itens o rascunho deixaria na tela — a busca vigente entra na conta. */
const previsao = computed(() =>
  props.contar ? props.contar({ ...filtros.value, ...rascunho.value }) : null,
)

const rotuloAplicar = computed(() => {
  if (previsao.value === null) return 'Ver resultados'
  if (previsao.value === 0) return 'Nenhum item'
  return `Ver ${previsao.value} ${previsao.value === 1 ? 'item' : 'itens'}`
})

/**
 * Zera derivando das chaves em vez de reescrever o objeto na mao — antes o
 * mesmo literal vivia aqui e em dois pontos da HomeView, e bastava um filtro
 * novo em um deles para os tres saírem de sincronia.
 *
 * Dentro da folha limpa so o rascunho; nos chips, onde nao ha o que confirmar,
 * aplica na hora — e leva a busca junto, que e o que "limpar tudo" promete.
 */
function limparRascunho() {
  rascunho.value = zerado()
}

function limparTudo() {
  filtros.value = { busca: '', ...zerado() }
}

function alternar(chave, valor) {
  rascunho.value[chave] = rascunho.value[chave] === valor ? '' : valor
}

function aoTeclar(e) {
  if (e.key === 'Escape') fechar()
}

// A rolagem do fundo trava so enquanto a folha existe, como nos outros dialogos.
watch(aberto, (esta) => {
  document.body.style.overflow = esta ? 'hidden' : ''
  if (esta) document.addEventListener('keydown', aoTeclar)
  else document.removeEventListener('keydown', aoTeclar)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', aoTeclar)
  document.body.style.overflow = ''
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-2">
      <!-- Busca sempre visível: é o filtro mais usado -->
      <div class="relative min-w-0 flex-1 basis-52">
        <Search
          :size="16"
          :stroke-width="2"
          class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint"
        />
        <input
          v-model="filtros.busca"
          type="search"
          placeholder="Buscar item…"
          aria-label="Buscar item"
          class="w-full rounded-full border border-line-strong bg-surface-1 py-3 pr-4 pl-10 text-sm text-ink transition-colors outline-none placeholder:text-ink-faint focus:border-accent"
        />
      </div>

      <button
        type="button"
        class="flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"
        :class="
          ativos.length
            ? 'border-accent bg-accent-soft text-accent-ink'
            : 'border-line bg-surface-1 text-ink-soft hover:border-ink-faint'
        "
        :aria-expanded="aberto"
        @click="abrir"
      >
        <SlidersHorizontal :size="15" :stroke-width="2" />
        Filtros
        <span v-if="ativos.length" class="tnum">({{ ativos.length }})</span>
      </button>
    </div>

    <!-- Legenda das marcas. Fica logo abaixo da busca, antes da lista: e ali
         que a duvida nasce, olhando as bolinhas da primeira linha.
         Texto, nao botao — a marca ja e filtravel na folha de filtros, e uma
         legenda clicavel duplicaria o controle em dois lugares. -->
    <p
      v-if="grupoComMarca"
      class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-faint"
    >
      <span v-for="op in grupoComMarca.opcoes" :key="op" class="inline-flex items-center gap-1.5">
        <MarcaPrioridade :prioridade="op" :tamanho="10" />
        <span class="text-ink-soft">{{ op }}</span>
        <span aria-hidden="true">·</span>
        {{ PRIORIDADE_DESCRICAO[op] }}
      </span>
    </p>

    <!-- Chips do que está ativo, removível com um toque -->
    <div v-if="ativos.length" class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="g in ativos"
        :key="g.chave"
        type="button"
        class="flex items-center gap-1.5 rounded-full bg-accent-soft py-1.5 pr-2 pl-3 text-xs font-medium text-accent-ink transition-opacity hover:opacity-75"
        @click="filtros[g.chave] = ''"
      >
        <MarcaPrioridade v-if="g.comMarca" :prioridade="filtros[g.chave]" :tamanho="10" />
        {{ textoDe(g, filtros[g.chave]) }}
        <X :size="13" :stroke-width="2.4" />
      </button>
      <button
        type="button"
        class="rounded-full px-3 py-1.5 text-xs text-ink-faint transition-colors hover:text-ink"
        @click="limparTudo"
      >
        limpar tudo
      </button>
    </div>

    <!-- Bottom sheet no celular, painel centralizado no desktop -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div
          v-if="aberto"
          class="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
          style="background: var(--scrim)"
          @click.self="fechar"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            class="max-h-[85svh] w-full overflow-y-auto rounded-t-3xl border-t border-line bg-surface-0 sm:max-w-md sm:rounded-3xl sm:border"
            style="
              animation: surgir 320ms cubic-bezier(0.16, 1, 0.3, 1);
              padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
            "
          >
            <div class="sticky top-0 flex items-center justify-between bg-surface-0 px-6 pt-5 pb-3">
              <h3 class="text-lg font-semibold text-ink">Filtros</h3>
              <button
                type="button"
                aria-label="Fechar filtros"
                class="grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-2"
                @click="fechar"
              >
                <X :size="19" :stroke-width="2" />
              </button>
            </div>

            <div class="space-y-6 px-6 pt-2">
              <fieldset v-for="g in grupos" :key="g.chave">
                <legend class="mb-2.5 text-xs tracking-[0.16em] text-ink-faint uppercase">
                  {{ g.rotulo }}
                </legend>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="op in g.opcoes"
                    :key="op"
                    type="button"
                    class="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors"
                    :class="
                      rascunho[g.chave] === op
                        ? 'border-accent bg-accent-soft font-medium text-accent-ink'
                        : 'border-line text-ink-soft hover:border-ink-faint'
                    "
                    :aria-pressed="rascunho[g.chave] === op"
                    @click="alternar(g.chave, op)"
                  >
                    <!-- Cor e forma, iguais às da lista: a marca é o que liga o
                         filtro ao que aparece na linha. -->
                    <MarcaPrioridade v-if="g.comMarca" :prioridade="op" :tamanho="11" />
                    {{ textoDe(g, op) }}
                  </button>
                </div>
              </fieldset>
            </div>

            <!-- O botão conta antes de aplicar: dá pra ver que a escolha
                 esvaziou a lista sem precisar fechar a folha para descobrir. -->
            <div class="mt-8 flex gap-3 px-6">
              <button
                type="button"
                class="min-h-12 flex-1 rounded-full border border-line text-sm text-ink-soft transition-colors hover:bg-surface-1"
                @click="limparRascunho"
              >
                Limpar
              </button>
              <button
                type="button"
                :disabled="previsao === 0"
                class="min-h-12 flex-1 rounded-full bg-accent text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-40"
                @click="aplicar"
              >
                {{ rotuloAplicar }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
