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

/**
 * O que a tela escreve no lugar do valor guardado.
 *
 * 'Chá de Panela' e o valor no banco — ele esta no `check` de items.tipo, nas
 * 59 linhas ja gravadas, na view `presentes_publicos` e na funcao
 * `reservar_presente()`. Renomear o valor seria migracao de dados; renomear o
 * rotulo e so isto aqui.
 *
 * Regra: valor no banco fica igual, tela le pelo mapa. Se um dia o valor mudar,
 * este mapa some junto.
 */
export const TIPO_ROTULO = {
  'Chá de Panela': 'Chá de casa nova',
  'Compra pessoal': 'Compra pessoal',
}

export const rotuloTipo = (tipo) => TIPO_ROTULO[tipo] ?? tipo

/**
 * Filtro exclusivo da lista publica. `status` e `tipo` sao vocabulario interno
 * e nao aparecem la — o convidado so quer saber se ainda da para pegar.
 */
export const DISPONIBILIDADE = ['Disponível', 'Reservado']

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
