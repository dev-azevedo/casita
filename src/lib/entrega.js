/**
 * Como o presente chega ate a casa: PIX ou entrega na porta.
 *
 * Mora aqui, e nao em constants.js, porque nao e vocabulario do dominio — e dado
 * de vida real, que muda por mudanca de casa ou troca de banco, nao por regra de
 * negocio. E nao mora em `configuracoes` no banco porque nao e coisa que se
 * ajusta num clique de admin: quando mudar, muda com merge.
 */

/**
 * A chave nao aparece na tela: quem vai pagar cola no app do banco, e e-mail
 * lido de olho e digitado a mao erra. O botao copia, e so.
 */
export const PIX = {
  titular: 'Júlia Dezordi Ruas',
  banco: 'ITAÚ UNIBANCO S.A.',
  tipoChave: 'e-mail',
  chave: 'julia.dr9@hotmail.com',
}

const ENDERECO_BUSCA = 'Tv. Rafael Francisco Greca, 151, Água Verde, Curitiba - PR, 80620-150'

export const ENDERECO = {
  rua: 'Tv. Rafael Francisco Greca, 151 — Água Verde',
  cidade: 'Curitiba — PR, 80620-150',
  complemento: 'Apartamento 54A',
  /** Sem key de API: o link de busca do Maps resolve em qualquer aparelho. */
  mapa: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ENDERECO_BUSCA)}`,
}

/** DDD + numero, sem o 55: `linkWhatsApp()` ja poe o pais. */
export const WHATSAPP = '41998084313'

/**
 * O extrato do banco mostra valor e nome de quem mandou — nao mostra presente
 * nenhum. Sem esse aviso, um pix de R$ 180 e um enigma.
 */
export function mensagemPix(nomeItem) {
  const inicio = 'Oi, acabei de fazer o pix para o chá de casa nova'
  return nomeItem ? `${inicio}, referente ao item: ${nomeItem}` : `${inicio}.`
}

/** Uma linha so, para copiar e colar no app de entrega ou mandar pro motoboy. */
export const ENDERECO_LINHA = `${ENDERECO.rua}, ${ENDERECO.cidade} — ${ENDERECO.complemento}`
