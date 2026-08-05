/**
 * Cores da casa.
 *
 * Cada preset e so um par (hue, chroma) em OKLCH. Esse par alimenta o accent E os
 * neutros do app inteiro — trocar a cor retinge fundos, bordas e texto de leve, em vez
 * de so repintar botao. Ver src/style.css.
 *
 * Os hues vem da paleta do Tailwind v4 (node_modules/tailwindcss/theme.css, shade 500),
 * que ja e definida em OKLCH. O chroma e nosso: o -500 do Tailwind e saturado demais
 * para o tom pastel que a gente quer, entao usamos ~1/3 dele.
 */
export const CORES = [
  // — os pasteis de casa —
  { id: 'musgo', nome: 'Musgo', grupo: 'Nossos verdes', h: 140, c: 0.062 },
  { id: 'oliva', nome: 'Oliva', grupo: 'Nossos verdes', h: 110, c: 0.07 },
  { id: 'salvia', nome: 'Sálvia', grupo: 'Nossos verdes', h: 155, c: 0.045 },

  // — vivas —
  // Chroma calculado, nao chutado: e ~92% do maximo que cada matiz alcanca
  // dentro do sRGB considerando TODAS as variantes derivadas do accent. Passar
  // disso faria o navegador cortar a cor, e a bolinha do seletor mostraria uma
  // cor diferente da aplicada. Amarelo e turquesa ficam menores porque o sRGB
  // nao tem amarelo saturado em clareza media — e limite fisico, nao escolha.
  { id: 'rubi', nome: 'Rubi', grupo: 'Vivas', h: 25.331, c: 0.14 },
  { id: 'coral', nome: 'Coral', grupo: 'Vivas', h: 47.604, c: 0.122 },
  { id: 'ambar', nome: 'Âmbar', grupo: 'Vivas', h: 70.08, c: 0.097 },
  { id: 'ouro', nome: 'Ouro', grupo: 'Vivas', h: 86.047, c: 0.091 },
  { id: 'limao', nome: 'Limão', grupo: 'Vivas', h: 130.85, c: 0.122 },
  { id: 'verde', nome: 'Verde', grupo: 'Vivas', h: 149.579, c: 0.124 },
  { id: 'esmeralda', nome: 'Esmeralda', grupo: 'Vivas', h: 162.48, c: 0.097 },
  { id: 'petroleo', nome: 'Petróleo', grupo: 'Vivas', h: 182.503, c: 0.079 },
  { id: 'turquesa', nome: 'Turquesa', grupo: 'Vivas', h: 215.221, c: 0.079 },
  { id: 'ceu', nome: 'Céu', grupo: 'Vivas', h: 237.323, c: 0.098 },
  { id: 'azul', nome: 'Azul', grupo: 'Vivas', h: 259.815, c: 0.123 },
  { id: 'anil', nome: 'Anil', grupo: 'Vivas', h: 277.117, c: 0.124 },
  { id: 'violeta', nome: 'Violeta', grupo: 'Vivas', h: 292.717, c: 0.135 },
  { id: 'ameixa', nome: 'Ameixa', grupo: 'Vivas', h: 303.9, c: 0.152 },
  { id: 'magenta', nome: 'Magenta', grupo: 'Vivas', h: 322.15, c: 0.212 },
  { id: 'pink', nome: 'Pink', grupo: 'Vivas', h: 354.308, c: 0.16 },
  { id: 'framboesa', nome: 'Framboesa', grupo: 'Vivas', h: 16.439, c: 0.141 },

  // — suaves —
  { id: 'terroso', nome: 'Terroso', grupo: 'Suaves', h: 40, c: 0.048 },
  { id: 'areia', nome: 'Areia', grupo: 'Suaves', h: 58.071, c: 0.03 },
  { id: 'trigo', nome: 'Trigo', grupo: 'Suaves', h: 86.047, c: 0.045 },
  { id: 'brisa', nome: 'Brisa', grupo: 'Suaves', h: 200, c: 0.04 },
  { id: 'nevoa', nome: 'Névoa', grupo: 'Suaves', h: 235, c: 0.055 },
  { id: 'ardosia', nome: 'Ardósia', grupo: 'Suaves', h: 257.417, c: 0.028 },
  { id: 'alfazema', nome: 'Alfazema', grupo: 'Suaves', h: 292.717, c: 0.05 },
  { id: 'rosa-antigo', nome: 'Rosa antigo', grupo: 'Suaves', h: 354.308, c: 0.045 },
]

export const COR_PADRAO = 'musgo'

/** 'claro' | 'escuro' | 'sistema' */
export const TEMA_PADRAO = 'sistema'

export const CHAVES = {
  tema: 'casita:tema',
  cor: 'casita:cor',
  // Par h/c ja resolvido. Existe para o script inline do index.html pintar antes
  // da primeira pintura sem precisar carregar (nem duplicar) a tabela acima.
  hc: 'casita:hc',
  tour: 'casita:onboarded:v1',
}

/** Presets agrupados, na ordem em que aparecem no seletor. */
export const GRUPOS_DE_COR = [...new Set(CORES.map((c) => c.grupo))].map((grupo) => ({
  grupo,
  cores: CORES.filter((c) => c.grupo === grupo),
}))

export function corPorId(id) {
  return CORES.find((c) => c.id === id) ?? CORES.find((c) => c.id === COR_PADRAO)
}

/** Amostra do seletor: mesma formula do --accent em style.css, para o preview
 *  mostrar exatamente a cor que vai ser aplicada. */
export function amostraDaCor(cor, escuro = false) {
  return escuro ? `oklch(74% ${cor.c * 0.85} ${cor.h})` : `oklch(52% ${cor.c} ${cor.h})`
}

/** 'sistema' resolve para o que o SO pede agora. */
export function resolverTema(tema) {
  if (tema === 'claro' || tema === 'escuro') return tema
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'
}

/** Cor da barra do navegador no celular: acompanha o fundo do app. */
function corDaBarra(escuro, cor) {
  // Mesmos valores de --surface-0 em src/style.css.
  return escuro ? `oklch(23% 0.014 ${cor.h})` : `oklch(98.5% 0.008 ${cor.h})`
}

/** Escreve tema e cor no <html>. */
export function aplicarNoDocumento(tema, corId) {
  const raiz = document.documentElement
  const cor = corPorId(corId)
  const escuro = resolverTema(tema) === 'escuro'

  raiz.dataset.theme = escuro ? 'escuro' : 'claro'
  raiz.style.setProperty('--h', cor.h)
  raiz.style.setProperty('--c', cor.c)

  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.content = corDaBarra(escuro, cor)

  return cor
}
