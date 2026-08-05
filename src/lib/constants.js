export const CATEGORIAS = [
  'Área de serviço',
  'Banheiro',
  'Cozinha',
  'Diversos',
  'Limpeza',
  'Quarto',
  'Sala',
]

export const PRIORIDADES = ['Essencial', 'Importante', 'Desejável']

export const STATUS = ['A comprar', 'Comprado']

export const TIPOS = ['Chá de Panela', 'Compra pessoal']

/** Ordem de exibicao: Essencial primeiro. */
export const PRIORIDADE_ORDEM = {
  Essencial: 0,
  Importante: 1,
  Desejável: 2,
}

/**
 * Prioridade vira um ponto colorido, nao um badge grande — e metadado, nao
 * manchete. As cores vivem em src/style.css para acompanharem tema claro/escuro.
 */
export const PRIORIDADE_COR = {
  Essencial: 'var(--p-essencial)',
  Importante: 'var(--p-importante)',
  Desejável: 'var(--p-desejavel)',
}
