<script setup>
/**
 * O respiro entre a capa e a lista.
 *
 * Para trocar o versículo, é só mexer aqui — não há nada dele em outro arquivo.
 */
const VERSICULO = {
  texto: 'Sobre todas essas coisas, porém, vistam-se do amor, que é o elo perfeito.',
  referencia: 'Colossenses 3:14',
}
</script>

<template>
  <section class="mx-auto max-w-5xl px-5 py-20 sm:px-6 sm:py-28">
    <figure>
      <!-- filete: acompanha a cor da casa -->
      <span class="surgir block h-px w-16 bg-accent" style="--i: 0" aria-hidden="true" />

      <blockquote
        cite="https://www.bibliaonline.com.br/nvi/cl/3/14"
        class="surgir mt-7 max-w-[34ch] font-[family-name:var(--font-display)] text-xl text-ink italic"
        style="--i: 1; font-variation-settings: 'SOFT' 70, 'WONK' 1, 'opsz' 100"
      >
        &ldquo;{{ VERSICULO.texto }}&rdquo;
      </blockquote>

      <figcaption
        class="surgir mt-6 text-xs tracking-[0.24em] text-ink-faint uppercase"
        style="--i: 2"
      >
        {{ VERSICULO.referencia }}
      </figcaption>
    </figure>
  </section>
</template>
