<script setup>
import { ref, computed, nextTick } from 'vue'
import { Check, Pencil, Trash2 } from '@lucide/vue'
import { formatBRL } from '@/lib/format'
import Casinha from './Casinha.vue'
import MarcaPrioridade from './MarcaPrioridade.vue'

const props = defineProps({
  item: { type: Object, required: true },
})

const emit = defineEmits(['toggle', 'edit', 'remove'])

const perguntandoPreco = ref(false)
const precoReal = ref(null)
const inputPreco = ref(null)
const comemorando = ref(false)

const comprado = computed(() => props.item.status === 'Comprado')

async function onCheckboxChange() {
  if (comprado.value) {
    emit('toggle', props.item, null) // desmarcar limpa o preço real
    return
  }
  precoReal.value = Number(props.item.preco_estimado) || null
  perguntandoPreco.value = true
  await nextTick()
  inputPreco.value?.select()
}

function confirmarCompra() {
  perguntandoPreco.value = false
  const valor = precoReal.value === null || precoReal.value === '' ? null : Number(precoReal.value)
  emit('toggle', props.item, valor)

  // Vôo curto de comemoração. Reduced motion desliga via CSS.
  comemorando.value = true
  setTimeout(() => (comemorando.value = false), 900)
}
</script>

<template>
  <li
    class="@container relative border-b border-line-soft transition-colors last:border-b-0"
    :class="comprado ? '' : 'hover:bg-surface-1'"
  >
    <div class="flex items-start gap-3 py-4 pr-1 pl-1">
      <!-- Alvo de toque generoso mesmo com a caixa pequena -->
      <label class="relative grid size-11 shrink-0 cursor-pointer place-items-center">
        <input
          type="checkbox"
          :checked="comprado"
          class="peer sr-only"
          :aria-label="`Marcar ${item.item} como comprado`"
          @change="onCheckboxChange"
        />
        <span
          class="grid size-6 place-items-center rounded-full border-2 border-line-strong transition-all duration-200 peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
        >
          <Check
            :size="13"
            :stroke-width="3.2"
            class="text-on-accent transition-transform duration-200"
            :class="comprado ? 'scale-100' : 'scale-0'"
          />
        </span>
      </label>

      <div class="min-w-0 flex-1 pt-2">
        <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <MarcaPrioridade :prioridade="item.prioridade" :tamanho="11" />
          <span
            class="font-medium transition-colors"
            :class="comprado ? 'text-ink-faint line-through' : 'text-ink'"
          >
            {{ item.item }}
          </span>
          <span v-if="item.quantidade > 1" class="tnum text-xs text-ink-faint">
            ×{{ item.quantidade }}
          </span>
          <span
            v-if="item.tipo === 'Compra pessoal'"
            class="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-soft"
          >
            pessoal
          </span>
        </div>

        <div class="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
          <span class="tnum" :class="comprado ? 'text-ink-faint line-through' : 'text-ink-soft'">
            {{ formatBRL(item.preco_estimado) }}
          </span>
          <span v-if="item.quantidade > 1" class="tnum text-xs text-ink-faint">
            {{ item.quantidade }} × {{ formatBRL(item.preco_unitario) }}
          </span>
          <span v-if="item.preco_real != null" class="tnum font-medium text-accent">
            pago {{ formatBRL(item.preco_real) }}
          </span>
          <a
            v-if="item.link"
            :href="item.link"
            target="_blank"
            rel="noopener noreferrer"
            class="text-ink-faint underline underline-offset-2 transition-colors hover:text-accent"
          >
            link
          </a>
        </div>

        <p v-if="item.observacoes" class="mt-1.5 text-sm text-ink-faint italic">
          {{ item.observacoes }}
        </p>
      </div>

      <!-- Sempre presentes: esconder até o hover deixaria o app sem editar no
           celular, que é onde ele vai ser usado. No mouse, ganham contraste. -->
      <div class="flex shrink-0 gap-0.5">
        <button
          type="button"
          aria-label="Editar item"
          title="Editar"
          class="grid size-11 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
          @click="emit('edit', item)"
        >
          <Pencil :size="17" :stroke-width="1.8" />
        </button>
        <button
          type="button"
          aria-label="Excluir item"
          title="Excluir"
          class="grid size-11 place-items-center rounded-full text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
          @click="emit('remove', item)"
        >
          <Trash2 :size="17" :stroke-width="1.8" />
        </button>
      </div>
    </div>

    <!-- Preço real, ao marcar como comprado -->
    <Transition
      enter-active-class="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] grid"
      enter-from-class="grid-rows-[0fr] opacity-0"
      enter-to-class="grid-rows-[1fr] opacity-100"
      leave-active-class="transition-all duration-200 grid"
      leave-from-class="grid-rows-[1fr] opacity-100"
      leave-to-class="grid-rows-[0fr] opacity-0"
    >
      <div v-if="perguntandoPreco" class="grid">
        <div class="overflow-hidden">
          <div class="mb-4 ml-12 flex flex-wrap items-center gap-2 rounded-2xl bg-accent-soft p-3">
            <label :for="`preco-${item.id}`" class="text-sm text-accent-ink">Quanto pagou?</label>
            <input
              :id="`preco-${item.id}`"
              ref="inputPreco"
              v-model="precoReal"
              type="number"
              step="0.01"
              min="0"
              inputmode="decimal"
              class="tnum h-11 w-28 rounded-xl border border-line-strong bg-surface-0 px-3 text-ink outline-none focus:border-accent"
              @keyup.enter="confirmarCompra"
              @keyup.escape="perguntandoPreco = false"
            />
            <button
              type="button"
              class="h-11 rounded-xl bg-accent px-4 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
              @click="confirmarCompra"
            >
              Confirmar
            </button>
            <button
              type="button"
              class="h-11 rounded-xl px-3 text-sm text-accent-ink transition-opacity hover:opacity-70"
              @click="perguntandoPreco = false"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Comemoração: mais uma coisa entrou em casa -->
    <Casinha
      v-if="comemorando"
      variante="casa"
      :tamanho="34"
      class="pointer-events-none absolute top-3 left-9 text-accent"
      style="animation: entrou-em-casa 900ms cubic-bezier(0.25, 1, 0.5, 1) forwards"
    />
  </li>
</template>

<style>
@keyframes entrou-em-casa {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.6);
  }
  30% {
    opacity: 1;
    transform: translateY(0) scale(1.1);
  }
  60% {
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-14px) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  @keyframes entrou-em-casa {
    0% {
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
}
</style>
