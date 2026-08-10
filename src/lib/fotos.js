/**
 * Nossas fotos.
 *
 * Como adicionar:
 *   1. Coloque o arquivo em  public/fotos/
 *   2. Adicione uma linha aqui.
 *
 * Campos:
 *   src            caminho a partir de /public  (obrigatorio)
 *   legenda        texto curto sob a foto
 *   ano            aparece discreto junto da legenda  (ex: '2024')
 *   objectPosition qual parte da foto manter visivel quando ela e cortada.
 *                  'center 30%' puxa o recorte para cima (rostos no terco superior),
 *                  'center 60%' para baixo. Ajuste se alguem ficar sem cabeca.
 *
 * A PRIMEIRA da lista e a capa em tela cheia. As demais entram na faixa lateral.
 *
 * NOTA: este arquivo e so o manifesto. Quem decide o que aparece na tela e
 * src/composables/useFotos.js — em desenvolvimento nunca carregam, e o casal
 * pode desligar todas pelo painel (Aparencia da casa).
 *
 * ATENCAO: as legendas abaixo foram escritas olhando as fotos, mas os momentos sao
 * de voces — troque por como voces chamam cada um. Os anos ficaram em branco de
 * proposito: so voces sabem.
 */
export const TODAS = [
  { src: '/fotos/_01.JPEG', legenda: 'Correndo juntos', ano: '', objectPosition: 'center 32%' },
  { src: '/fotos/_13.JPEG', legenda: 'Outono no parque', ano: '', objectPosition: 'center 68%' },
  { src: '/fotos/_08.JPEG', legenda: 'A medalha e o beijo', ano: '', objectPosition: 'center 30%' },
  { src: '/fotos/_12.JPEG', legenda: 'No nosso ritmo', ano: '', objectPosition: 'center 32%' },
  { src: '/fotos/_07.JPEG', legenda: 'Só nós dois', ano: '', objectPosition: 'center 55%' },
  { src: '/fotos/_09.JPEG', legenda: 'Noite de show', ano: '', objectPosition: 'center 30%' },
  { src: '/fotos/_02.JPEG', legenda: 'Depois que a música acabou', ano: '', objectPosition: 'center 25%' },
  { src: '/fotos/_11.JPEG', legenda: 'Jantar em família', ano: '', objectPosition: 'center 45%' },
  { src: '/fotos/_10.JPEG', legenda: 'Aquela risada na mesa', ano: '', objectPosition: 'center 50%' },
  { src: '/fotos/_03.JPEG', legenda: 'Aquele abraço', ano: '', objectPosition: 'center 35%' },
  { src: '/fotos/_14.JPEG', legenda: 'Noite na La Santa', ano: '', objectPosition: 'center 40%' },
  { src: '/fotos/_05.JPEG', legenda: 'Dia de jogo', ano: '', objectPosition: 'center 38%' },
  { src: '/fotos/_04.JPEG', legenda: 'Antes do treino', ano: '', objectPosition: 'center 32%' },
  { src: '/fotos/_06.JPEG', legenda: 'Depois do treino', ano: '', objectPosition: 'center 28%' },
]

/**
 * Video de capa (opcional).
 *
 * Se preenchido, a capa vira um video mudo em loop no lugar da primeira foto —
 * ela continua sendo o poster enquanto o video carrega.
 *
 * DESLIGADO de proposito: public/fotos/first_.mp4 tem 13 MB. Isso e caro no 4G
 * dela e a capa e a primeira coisa que carrega. Para ligar, descomente a linha —
 * de preferencia depois de comprimir o arquivo para uns 2-3 MB.
 */
export const VIDEO_CAPA = null
// export const VIDEO_CAPA = '/fotos/first_.mp4'

/** Textos da capa. */
export const CAPA = {
  titulo: 'Nossa Casa',
  subtitulo: 'Construindo nosso lar, um item de cada vez.',
}
