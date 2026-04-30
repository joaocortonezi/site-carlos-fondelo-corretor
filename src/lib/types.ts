export type ImovelTipo      = 'apartamento' | 'casa' | 'terreno' | 'comercial'
export type ImovelFinalidade = 'venda' | 'aluguel' | 'ambos'
export type ImovelStatus    = 'disponivel' | 'vendido' | 'alugado'
export type ImovelSituacao  = 'construcao' | 'novo' | 'planta' | 'usado'

export interface Imovel {
  id:          string
  slug:        string | null
  referencia:  string | null
  titulo:      string
  descricao:   string | null
  tipo:        ImovelTipo
  finalidade:  ImovelFinalidade
  preco:       number | null
  area:        number | null
  quartos:     number
  banheiros:   number
  vagas:       number
  endereco:    string | null
  bairro:      string | null
  cidade:      string
  estado:      string
  cep:         string | null
  destaque:          boolean
  exclusivo:         boolean
  alto_padrao:       boolean
  situacao:          ImovelSituacao | null
  status:            ImovelStatus
  video_vertical:    string | null
  video_horizontal:  string | null
  created_at:        string
  updated_at:        string
  fotos?:            FotoImovel[]
}

export interface FotoImovel {
  id:         string
  imovel_id:  string
  url:        string
  ordem:      number
  created_at: string
}

export type LeadStatus = string  // 'novo' | 'descartado' | <pipeline_etapa_slug>

export interface Lead {
  id:             string
  nome:           string
  telefone:       string
  email:          string | null
  mensagem:       string | null
  imovel_id:      string | null
  imovel_titulo:  string | null
  origem:         string
  status:         LeadStatus
  created_at:     string
}

export interface Banner {
  id:          string
  titulo:      string | null
  subtitulo:   string | null
  url_imagem:  string
  ordem:       number
  ativo:       boolean
  created_at:  string
  updated_at:  string
}

export interface HeroLayer {
  id:            string
  tipo:          'texto' | 'botao'
  texto:         string
  x:             number   // 0–100 (% do canvas)
  y:             number   // 0–100 (% do canvas)
  fontSize:      number   // rem
  fontFamily?:   string   // CSS var, ex: 'var(--font-playfair)'
  fontWeight:    number
  cor:           string   // hex
  opacity:       number   // 0–1
  letterSpacing: number   // em
  lineHeight:    number
  textAlign:     'left' | 'center' | 'right'
  italic:        boolean
  uppercase:     boolean
  // apenas para tipo === 'botao'
  corFundo?:           string
  opacidadeFundo?:     number
  corContorno?:        string
  opacidadeContorno?:  number
  paddingX?:           number  // rem
  paddingY?:           number  // rem
  borderRadius?:       number  // px
  href?:               string
}

export interface HeroGradientStop {
  id:        string
  cor:       string
  opacidade: number  // 0–1
  posicao:   number  // 0–100
}

export interface HeroOverlayConfig {
  tipo:     'nenhum' | 'solido' | 'gradiente_linear' | 'gradiente_radial'
  cor?:     string
  opacidade?: number
  angulo?:  number        // graus (gradiente_linear)
  centroX?: number        // 0–100 (gradiente_radial)
  centroY?: number        // 0–100 (gradiente_radial)
  paradas?: HeroGradientStop[]
}

export interface HeroConfig {
  id:                   string
  url_imagem:           string | null
  eyebrow:              string
  titulo_1:             string
  titulo_2:             string
  titulo_3:             string
  subtitulo:            string
  intervalo:            number
  cor_fundo:            string
  cor_fundo_opacidade:  number
  cor_eyebrow:          string
  cor_titulo_1:         string
  cor_titulo_2:         string
  cor_titulo_3:         string
  cor_subtitulo:        string
  peso_eyebrow:         number
  peso_titulo_1:        number
  peso_titulo_2:        number
  peso_titulo_3:        number
  peso_subtitulo:       number
  btn1_texto:              string
  btn1_cor_texto:          string
  btn1_peso:               number
  btn1_cor_fundo:          string
  btn1_opacidade_fundo:    number
  btn1_cor_contorno:       string
  btn1_opacidade_contorno: number
  btn2_texto:              string
  btn2_cor_texto:          string
  btn2_peso:               number
  btn2_cor_fundo:          string
  btn2_opacidade_fundo:    number
  btn2_cor_contorno:       string
  btn2_opacidade_contorno: number
  camadas?:        HeroLayer[]       | null
  overlay_config?: HeroOverlayConfig | null
  updated_at:      string
}

export interface PerfilCorretor {
  id:               string
  nome:             string
  creci:            string
  email:            string
  telefone:         string
  cidade_estado:    string
  foto_url:         string | null
  bio_1:            string | null
  bio_2:            string | null
  anos_experiencia:  number
  imoveis_vendidos:  number
  avaliacao_google:  number
  updated_at:        string
}

export interface LeadNota {
  id:         string
  lead_id:    string
  texto:      string
  created_at: string
}

export interface PipelineEtapa {
  id:    string
  slug:  string
  nome:  string
  cor:   string
  ordem: number
}

export type AvaliacaoOrigem = 'cliente' | 'admin'

export interface Avaliacao {
  id:         string
  nome:       string
  texto:      string
  estrelas:   number
  via:        string | null
  aprovado:   boolean
  origem:     AvaliacaoOrigem
  ordem:      number
  created_at: string
  updated_at: string
}
