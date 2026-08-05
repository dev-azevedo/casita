<script setup>
/**
 * Motivo da casa. Desenho original, traço solto.
 *
 * variantes:
 *   casa    — a casa em si (capa, tour, ponta do progresso)
 *   chave   — a chave da casa nova (login)
 *   planta  — vasinho (tela de carregamento)
 *   caixas  — caixas de mudança (lista vazia)
 *
 * Traço em currentColor: quem usa define a cor pela classe de texto.
 */
defineProps({
  variante: { type: String, default: 'casa' },
  tamanho: { type: Number, default: 96 },
})
</script>

<template>
  <svg
    :width="tamanho"
    :height="tamanho"
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    stroke-width="3"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="shrink-0 overflow-visible"
  >
    <!-- ................................................. casa -->
    <g v-if="variante === 'casa'">
      <!-- telhado -->
      <path d="M14 46 50 18l36 28" />
      <!-- chaminé -->
      <path d="M70 27v-8h9v15" />
      <!-- corpo -->
      <path d="M22 42v40h56V42" />
      <!-- porta -->
      <path d="M42 82V60a8 8 0 0 1 16 0v22" />
      <circle cx="54" cy="71" r="1.6" fill="currentColor" stroke="none" />
      <!-- janelas -->
      <rect x="28" y="50" width="10" height="10" rx="2" />
      <rect x="62" y="50" width="10" height="10" rx="2" />
      <!-- chão -->
      <path d="M10 82h80" opacity=".45" />
      <!-- fumaça: a casa está viva -->
      <path
        d="M74 14c3-2 3-5 0-7M81 12c2-2 2-4 0-6"
        stroke-width="2.2"
        opacity=".5"
      />
    </g>

    <!-- ................................................. chave -->
    <g v-else-if="variante === 'chave'">
      <!-- argola -->
      <circle cx="33" cy="34" r="16" />
      <circle cx="33" cy="34" r="6" />
      <!-- haste -->
      <path d="M44 45 78 79" />
      <!-- dentes -->
      <path d="M66 67l-9 9M74 75l-7 7" />
      <!-- brilho -->
      <path d="M20 66l-6 6M14 60l-3 3" stroke-width="2.2" opacity=".45" />
    </g>

    <!-- ................................................. planta -->
    <g v-else-if="variante === 'planta'">
      <!-- vaso -->
      <path d="M30 62h40l-5 26a4 4 0 0 1-4 3H39a4 4 0 0 1-4-3L30 62Z" />
      <path d="M26 62h48" />
      <!-- caule -->
      <path d="M50 62V36" />
      <!-- folhas -->
      <path d="M50 44c-2-10-9-15-19-15 0 11 8 17 19 15Z" />
      <path d="M50 52c2-12 10-18 22-17-1 12-10 19-22 17Z" />
      <!-- broto -->
      <circle cx="50" cy="31" r="3" fill="currentColor" stroke="none" opacity=".7" />
    </g>

    <!-- ................................................. caixas -->
    <g v-else>
      <!-- caixa de baixo, esquerda -->
      <path d="M14 58h34v32H14z" />
      <path d="M14 68h34M31 58v32" opacity=".5" />
      <!-- caixa de baixo, direita -->
      <path d="M52 66h34v24H52z" />
      <path d="M52 74h34M69 66v24" opacity=".5" />
      <!-- caixa de cima -->
      <path d="M28 30h34v26H28z" />
      <path d="M28 39h34M45 30v26" opacity=".5" />
      <!-- fita -->
      <path d="M45 24v8M45 24l-8-5M45 24l8-5" stroke-width="2.4" opacity=".6" />
    </g>
  </svg>
</template>
