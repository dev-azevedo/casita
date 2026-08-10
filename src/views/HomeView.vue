<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Rose} from '@lucide/vue'

import { useAuth } from '@/composables/useAuth'
import { useItems } from '@/composables/useItems'
import { useOnboarding } from '@/composables/useOnboarding'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useConfig } from '@/composables/useConfig'
import { useFotos } from '@/composables/useFotos'

import AppHeader from '@/components/AppHeader.vue'
import HeroCapa from '@/components/HeroCapa.vue'
import Versiculo from '@/components/Versiculo.vue'
import PhotoStrip from '@/components/PhotoStrip.vue'
import Lightbox from '@/components/Lightbox.vue'
import MetricsPanel from '@/components/MetricsPanel.vue'
import ItemFilters from '@/components/ItemFilters.vue'
import ItemList from '@/components/ItemList.vue'
import ItemFormModal from '@/components/ItemFormModal.vue'
import ConfirmarExclusao from '@/components/ConfirmarExclusao.vue'
import ConfirmarCancelamentoReserva from '@/components/ConfirmarCancelamentoReserva.vue'
import WelcomeTour from '@/components/WelcomeTour.vue'
import Casinha from '@/components/Casinha.vue'

const router = useRouter()
const { user, signOut } = useAuth()
const {
  items,
  loading,
  error,
  fetchItems,
  addItem,
  updateItem,
  deleteItem,
  cancelarReserva,
  toggleComprado,
  metrics,
  porPrioridade,
} = useItems()
const { visivel: tourVisivel, verificar, concluir, reabrir } = useOnboarding()
const { fetchConfig } = useConfig()
const { fotos } = useFotos()

const vazios = () => ({ busca: '', categoria: '', prioridade: '', status: '', tipo: '' })
const filtros = ref(vazios())

const formAberto = ref(false)
const itemEditando = ref(null)
const salvando = ref(false)
const erroForm = ref('')
const aviso = ref('')
const fotoAberta = ref(null)
const itemParaExcluir = ref(null)
const excluindo = ref(false)
/** { item, reserva } — o dialogo mostra os dois. */
const reservaParaCancelar = ref(null)
const cancelandoReserva = ref(false)

onMounted(() => {
  fetchItems()
  verificar()
})

// As reservas dos convidados chegam sozinhas, sem F5. O modo silencioso cede a
// vez para qualquer edição em andamento — ver a guarda em useItems.
// A config vem junto para os dois admins não divergirem de cor.
useAutoRefresh(() => Promise.all([fetchItems({ silencioso: true }), fetchConfig()]))

const temFiltro = computed(() =>
  Object.values(filtros.value).some((v) => v !== ''),
)

const itensFiltrados = computed(() => {
  const busca = filtros.value.busca.trim().toLowerCase()
  return items.value.filter((i) => {
    if (filtros.value.categoria && i.categoria !== filtros.value.categoria) return false
    if (filtros.value.prioridade && i.prioridade !== filtros.value.prioridade) return false
    if (filtros.value.status && i.status !== filtros.value.status) return false
    if (filtros.value.tipo && i.tipo !== filtros.value.tipo) return false
    if (busca) {
      const alvo = `${i.item} ${i.categoria} ${i.observacoes ?? ''}`.toLowerCase()
      if (!alvo.includes(busca)) return false
    }
    return true
  })
})

function limparFiltros() {
  filtros.value = vazios()
}

function abrirNovo() {
  itemEditando.value = null
  erroForm.value = ''
  formAberto.value = true
}

function abrirEdicao(item) {
  itemEditando.value = item
  erroForm.value = ''
  formAberto.value = true
}

async function salvar(payload) {
  salvando.value = true
  erroForm.value = ''
  try {
    if (itemEditando.value) await updateItem(itemEditando.value.id, payload)
    else await addItem(payload)
    formAberto.value = false
    itemEditando.value = null
  } catch (e) {
    erroForm.value = e.message
  } finally {
    salvando.value = false
  }
}

function pedirExclusao(item) {
  itemParaExcluir.value = item
}

async function confirmarExclusao() {
  excluindo.value = true
  try {
    await deleteItem(itemParaExcluir.value.id)
    mostrarAviso(`"${itemParaExcluir.value.item}" foi excluído.`)
    itemParaExcluir.value = null
  } catch (e) {
    mostrarAviso(e.message)
  } finally {
    excluindo.value = false
  }
}

async function alternar(item, precoReal) {
  try {
    await toggleComprado(item, precoReal)
  } catch (e) {
    mostrarAviso(e.message)
  }
}

let avisoTimer
function mostrarAviso(msg) {
  aviso.value = msg
  clearTimeout(avisoTimer)
  avisoTimer = setTimeout(() => (aviso.value = ''), 4500)
}

async function confirmarCancelamentoReserva() {
  const { reserva } = reservaParaCancelar.value
  cancelandoReserva.value = true
  try {
    await cancelarReserva(reserva.id)
    mostrarAviso(`A reserva de ${reserva.nome} foi cancelada.`)
    reservaParaCancelar.value = null
  } catch (e) {
    mostrarAviso(e.message)
  } finally {
    cancelandoReserva.value = false
  }
}

async function sair() {
  await signOut()
  router.push({ name: 'portal' })
}
</script>

<template>
  <div>
    <AppHeader :email="user?.email || ''" @sair="sair" />

    <HeroCapa @abrir-foto="fotoAberta = $event" />

    <Versiculo />

    <PhotoStrip @abrir-foto="fotoAberta = $event" />

    <!-- ----------------------------------------------------------------- -->
    <main id="a-lista" class="mx-auto max-w-5xl scroll-mt-16 px-5 pb-32 sm:px-6">
      <header class="flex items-end gap-5 pt-8 pb-10 sm:pt-14">
        <div>
          <p class="text-xs tracking-[0.28em] text-ink-faint uppercase">a lista</p>
          <h2 class="mt-2 text-xl font-semibold text-ink">Tudo que vai entrar em casa</h2>
        </div>
        <span class="mb-3 hidden h-px flex-1 bg-line sm:block" aria-hidden="true" />
      </header>

      <p v-if="error" class="mb-8 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
        Erro ao carregar: {{ error }}
      </p>

      <div v-if="loading" class="flex flex-col items-center gap-4 py-24 text-ink-faint">
        <Casinha variante="planta" :tamanho="88" class="flutuar" />
        <p class="text-sm">Carregando a lista…</p>
      </div>

      <template v-else>
        <MetricsPanel :metrics="metrics" :por-prioridade="porPrioridade" />

        <div class="mt-14">
          <ItemFilters v-model="filtros" />

          <p class="tnum mt-4 text-sm text-ink-faint">
            {{ itensFiltrados.length }} de {{ items.length }} itens
          </p>

          <div class="mt-6">
            <ItemList
              :items="itensFiltrados"
              :tem-filtro="temFiltro"
              @toggle="alternar"
              @edit="abrirEdicao"
              @remove="pedirExclusao"
              @limpar="limparFiltros"
              @cancelar-reserva="reservaParaCancelar = $event"
            />
          </div>
        </div>
      </template>

      <footer class="mt-20 border-t border-line-soft pt-8 text-center">
        <p class="flex gap-2 justify-center">
          Feito com carinho e amor por: Xuxu <Rose />
        </p>
        <button
          type="button"
          class="text-sm text-ink-faint underline underline-offset-4 transition-colors hover:text-ink"
          @click="reabrir"
        >
          rever as boas-vindas
        </button>
      </footer>
    </main>

    <!-- Adicionar: fica sempre ao alcance do polegar -->
    <button
      type="button"
      aria-label="Adicionar item"
      class="fixed right-5 z-30 flex h-14 items-center gap-2 rounded-full bg-accent px-5 font-medium text-on-accent shadow-elev-3 transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-105 active:scale-95"
      style="bottom: max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem))"
      @click="abrirNovo"
    >
      <Plus :size="20" :stroke-width="2.2" />
      <span class="hidden sm:inline">Adicionar</span>
    </button>

    <ItemFormModal
      v-if="formAberto"
      :item="itemEditando"
      :saving="salvando"
      :error="erroForm"
      @close="formAberto = false"
      @save="salvar"
    />

    <ConfirmarExclusao
      v-if="itemParaExcluir"
      :item="itemParaExcluir"
      :excluindo="excluindo"
      @cancelar="itemParaExcluir = null"
      @confirmar="confirmarExclusao"
    />

    <ConfirmarCancelamentoReserva
      v-if="reservaParaCancelar"
      :item="reservaParaCancelar.item"
      :reserva="reservaParaCancelar.reserva"
      :cancelando="cancelandoReserva"
      @fechar="reservaParaCancelar = null"
      @confirmar="confirmarCancelamentoReserva"
    />

    <Lightbox
      v-if="fotoAberta !== null"
      :fotos="fotos"
      :indice="fotoAberta"
      @fechar="fotoAberta = null"
      @navegar="fotoAberta = $event"
    />

    <!-- Só depois que os números chegam: o tour mostra os totais reais. -->
    <WelcomeTour v-if="tourVisivel && !loading" :metrics="metrics" @concluir="concluir" />

    <Transition
      enter-active-class="transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      enter-from-class="opacity-0 translate-y-3"
      leave-active-class="transition duration-200"
      leave-to-class="opacity-0"
    >
      <p
        v-if="aviso"
        role="status"
        class="fixed left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm text-surface-0 shadow-elev-3"
        style="bottom: max(5.5rem, calc(env(safe-area-inset-bottom) + 5rem))"
      >
        {{ aviso }}
      </p>
    </Transition>
  </div>
</template>
