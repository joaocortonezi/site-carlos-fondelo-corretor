export type ImovelTipo      = 'apartamento' | 'casa' | 'terreno' | 'comercial'
export type ImovelFinalidade = 'venda' | 'aluguel'
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

export interface HeroConfig {
  id:         string
  url_imagem: string | null
  eyebrow:    string
  titulo_1:   string
  titulo_2:   string
  titulo_3:   string
  subtitulo:  string
  intervalo:  number
  updated_at: string
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
