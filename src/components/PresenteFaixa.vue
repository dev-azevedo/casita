<script setup>
import { computed } from 'vue'
import { ArrowUpRight, Check } from '@lucide/vue'
import MarcaPrioridade from './MarcaPrioridade.vue'

/**
 * Uma linha da lista publica. Faixa larga, nao card: numa lista de 40 presentes,
 * 40 caixas com sombra viram ruido e o olho perde onde estava.
 *
 * O link do produto e a segunda coisa mais forte da faixa, depois do nome — e,
 * quando existe, o proprio nome e o link. Foi pedido explicito: o convidado
 * precisa conseguir ver o que e antes de decidir.
 */
const props = defineProps({
  presente: { type: Object, required: true },
})

defineEmits(['reservar'])

const temLink = computed(() => !!props.presente.link)
</script>

<template>
  <li
    class="group relative border-b border-line-soft transition-colors last:border-b-0"
    :class="presente.reservado ? '' : 'hover:bg-surface-1'"
  >
    <div class="flex items-start gap-4 py-5 pr-1 pl-1 sm:gap-6">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <MarcaPrioridade :prioridade="presente.prioridade" :tamanho="11" />

          <!-- Nome = link. Sem link, vira texto e ninguem sente falta. -->
          <component
            :is="temLink ? 'a' : 'span'"
            v-bind="
              temLink
                ? { href: presente.link, target: '_blank', rel: 'noopener noreferrer' }
                : {}
            "
            class="font-[family-name:var(--font-display)] text-lg leading-tight font-semibold transition-colors"
            style="font-variation-settings: 'SOFT' 70, 'WONK' 1, 'opsz' 40"
            :class="[
              presente.reservado ? 'text-ink-faint' : 'text-ink',
              temLink && !presente.reservado ? 'hover:text-accent' : '',
            ]"
          >
            {{ presente.item }}
            <ArrowUpRight
              v-if="temLink"
              :size="17"
              :stroke-width="2"
              class="ml-0.5 inline-block align-[-0.1em] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </component>

          <span v-if="presente.quantidade > 1" class="tnum text-xs text-ink-faint">
            ×{{ presente.quantidade }}
          </span>
        </div>

        <p v-if="presente.observacoes" class="mt-1.5 text-sm text-ink-soft">
          {{ presente.observacoes }}
        </p>

        <a
          v-if="temLink"
          :href="presente.link"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-2 inline-flex min-h-9 items-center text-sm font-medium text-accent underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70"
        >
          ver na loja
        </a>
      </div>

      <!-- Reservar / reservado: alvo de toque cheio, alinhado ao topo da faixa -->
      <div class="shrink-0 pt-0.5">
        <button
          v-if="!presente.reservado"
          type="button"
          class="min-h-11 rounded-full bg-accent px-5 text-sm font-medium text-on-accent transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:bg-accent-hover active:scale-95"
          @click="$emit('reservar', presente)"
        >
          Reservar
        </button>

        <span
          v-else
          class="flex min-h-11 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-sm font-medium text-accent-ink"
        >
          <Check :size="15" :stroke-width="2.6" />
          reservado
        </span>
      </div>
    </div>
  </li>
</template>
