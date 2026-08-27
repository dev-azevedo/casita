<script setup>
import { computed } from 'vue'
import { ArrowUpRight, Check } from '@lucide/vue'
import { formatTelefone } from '@/lib/format'
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

  /**
   * A reserva DESTE presente, quando ela e de quem esta olhando — { nome,
   * telefone, created_at }, vindo de minhas_reservas(). Null em todo o resto da
   * lista, inclusive nos itens reservados por outra pessoa: a view publica nem
   * traz esses campos, e o unico jeito de eles chegarem aqui e o convidado ter
   * provado o telefone.
   */
  minhaReserva: { type: Object, default: null },
})

defineEmits(['reservar', 'comoEntregar', 'desfazer'])

const temLink = computed(() => !!props.presente.link)
</script>

<template>
  <li
    class="group relative border-b border-line-soft transition-colors last:border-b-0"
    :class="presente.reservado ? '' : 'hover:bg-surface-1'"
  >
    <div class="flex flex-col gap-3 py-5 pr-1 pl-1 sm:flex-row sm:items-start sm:gap-6">
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

        <!-- Quem reservou, mostrado SO para quem reservou. A pergunta que abre a
             lista existe por causa desta linha: sem ela, trocar de navegador
             apagava a memoria do que ja era seu. -->
        <p v-if="minhaReserva" class="mt-2 text-sm text-accent-ink">
          {{ minhaReserva.nome }}
          <span class="tnum text-ink-soft"> · {{ formatTelefone(minhaReserva.telefone) }}</span>
        </p>

        <!-- Uma linha so: no celular os dois quebram juntos em vez de empilhar
             com espacamentos diferentes. -->
        <div
          v-if="temLink || presente.reservado"
          class="mt-2 flex flex-wrap items-center gap-x-4"
        >
          <a
            v-if="temLink"
            :href="presente.link"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex min-h-9 items-center text-sm font-medium text-accent underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70"
          >
            ver na loja
          </a>

          <!-- Reservado, o presente perde o botao e ficava sem saida nenhuma:
               este e o caminho de volta pro pix e pro endereco. -->
          <button
            v-if="presente.reservado"
            type="button"
            class="inline-flex min-h-9 items-center text-sm font-medium text-accent-ink underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70"
            @click="$emit('comoEntregar', presente)"
          >
            como entregar
          </button>

          <!-- Discreto de proposito: desistir e raro e destrutivo, nao pode
               competir de igual pra igual com "como entregar". -->
          <button
            v-if="minhaReserva"
            type="button"
            class="inline-flex min-h-9 items-center text-sm text-ink-faint underline decoration-1 underline-offset-4 transition-colors hover:text-danger"
            @click="$emit('desfazer', presente)"
          >
            desfazer reserva
          </button>
        </div>
      </div>

      <!-- Reservar / reservado: rodape da faixa no celular, coluna propria no
           desktop. Largura automatica, nao cheia: numa lista de 40 presentes,
           40 barras de accent empilhadas viram parede, nao chamada. -->
      <div class="flex sm:shrink-0 sm:pt-0.5">
        <button
          v-if="!presente.reservado"
          type="button"
          class="min-h-11 rounded-full bg-accent px-5 text-sm font-medium text-on-accent transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:bg-accent-hover active:scale-95"
          @click="$emit('reservar', presente)"
        >
          Reservar
        </button>

        <!-- Mesmo selo, palavra diferente: "reservado" e um aviso de que o item
             saiu; "sua reserva" e um reconhecimento. So muda para quem provou o
             telefone. -->
        <span
          v-else
          class="flex min-h-11 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-sm font-medium text-accent-ink"
          :class="minhaReserva ? 'ring-1 ring-accent' : ''"
        >
          <Check :size="15" :stroke-width="2.6" />
          {{ minhaReserva ? 'sua reserva' : 'reservado' }}
        </span>
      </div>
    </div>
  </li>
</template>
