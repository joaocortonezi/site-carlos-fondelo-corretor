// ─── Tipos globais do projeto ────────────────────────────────────────────────
// Este arquivo é a fonte única de verdade para todos os tipos TypeScript.
// Toda tabela do Supabase tem uma interface correspondente aqui.

// ─── Imóveis ─────────────────────────────────────────────────────────────────

export type ImovelTipo      = 'apartamento' | 'casa' | 'terreno' | 'comercial'
export type ImovelFinalidade = 'venda' | 'aluguel' | 'ambos'
export type ImovelStatus    = 'disponivel' | 'vendido' | 'alugado'
export type ImovelSituacao  = 'construcao' | 'novo' | 'planta' | 'usado'

/** Representa uma linha da tabela `imoveis`. */
export interface Imovel {
  id:          string
  slug:        string | null        // URL amigável gerada a partir do título + cidade
  referencia:  string | null        // código interno do corretor
  titulo:      string
  subtitulo:   string | null        // breve linha exibida abaixo do título (máx 120)
  descricao:   string | null
  tipo:        ImovelTipo
  finalidade:  ImovelFinalidade
  preco:       number | null
  area:        number | null        // m² — campo legado/geral (compat com imóveis antigos)
  area_construida: number | null    // m² — área edificada (só estrutura)
  area_terreno:    number | null    // m² — área do lote (terreno total)
  quartos:     number
  banheiros:   number
  vagas:       number               // vagas de garagem
  endereco:    string | null
  bairro:      string | null
  cidade:      string
  estado:      string
  cep:         string | null
  destaque:          boolean        // aparece na seção Destaques da home
  exclusivo:         boolean        // aparece na seção Exclusivos
  alto_padrao:       boolean        // aparece na seção Alto Padrão (ou preco >= 900k)
  situacao:          ImovelSituacao | null
  status:            ImovelStatus
  video_vertical:    string | null  // URL do Reels/short para a seção de vídeos
  video_horizontal:  string | null
  created_at:        string
  updated_at:        string
  fotos?:            FotoImovel[]   // join com fotos_imoveis (não vem por padrão)
}

/** Foto individual de um imóvel (tabela `fotos_imoveis`). */
export interface FotoImovel {
  id:         string
  imovel_id:  string
  url:        string
  ordem:      number    // posição na galeria (0 = capa)
  created_at: string
}

// ─── Leads ────────────────────────────────────────────────────────────────────

/** Status é uma string livre: 'novo' | 'descartado' | <slug de etapa do pipeline>. */
export type LeadStatus = string

/** Contato recebido via qualquer formulário do site (tabela `leads`). */
export interface Lead {
  id:             string
  nome:           string
  telefone:       string
  email:          string | null
  mensagem:       string | null
  imovel_id:      string | null    // preenchido quando o lead vem da página de um imóvel
  imovel_titulo:  string | null
  origem:         string           // 'hero' | 'sobre' | 'nav' | 'imovel' | 'captacao'
  status:         LeadStatus
  created_at:     string
}

// ─── Banners ──────────────────────────────────────────────────────────────────

/**
 * Slide do hero slideshow (tabela `banners`).
 * - tipo='png'      → imagem simples, sem overlay
 * - tipo='editavel' → imagem + camadas de texto/botão + overlay configurável
 */
export interface Banner {
  id:              string
  titulo:          string | null    // nome interno, não exibido no site
  subtitulo:       string | null
  url_imagem:      string | null
  ordem:           number           // posição no slideshow (0 = primeiro após o slide 0)
  ativo:           boolean          // false = não aparece no site
  tipo:            'png' | 'editavel'
  camadas?:        HeroLayer[] | null         // JSONB: array de camadas (apenas editavel)
  overlay_config?: HeroOverlayConfig | null   // JSONB: película sobre a imagem
  // ── Variantes mobile (viewport < 768px). Null = usa a variante desktop como fallback. ──
  // Banner mobile foi feito pra preencher tela vertical → tipicamente aspect 9:16.
  url_imagem_mobile?:     string | null
  camadas_mobile?:        HeroLayer[]       | null
  overlay_config_mobile?: HeroOverlayConfig | null
  created_at:      string
  updated_at:      string
}

// ─── Editor visual — Camadas ─────────────────────────────────────────────────

/**
 * Uma camada de texto ou botão posicionada sobre o hero.
 * Coordenadas x/y são percentuais (0–100) em relação ao canvas de 1440px.
 * Salva como JSONB no campo `camadas` de `banners` e `hero_config`.
 */
export interface HeroLayer {
  id:            string
  tipo:          'texto' | 'botao'
  texto:         string
  x:             number   // posição horizontal (% do canvas)
  y:             number   // posição vertical (% do canvas)
  fontSize:      number   // rem — escalado pelo fator canvasW/1440
  fontFamily?:   string   // valor de CSS var, ex: 'var(--font-playfair)'
  fontWeight:    number   // 100–900
  cor:           string   // hex
  opacity:       number   // 0–1
  letterSpacing: number   // em
  lineHeight:    number
  textAlign:     'left' | 'center' | 'right'
  italic:        boolean
  uppercase:     boolean
  // propriedades exclusivas de tipo='botao'
  corFundo?:           string
  opacidadeFundo?:     number
  corContorno?:        string
  opacidadeContorno?:  number
  paddingX?:           number   // rem
  paddingY?:           number   // rem
  borderRadius?:       number   // px
  href?:               string   // destino do link ao clicar
}

// ─── Editor visual — Overlay (película) ──────────────────────────────────────

/** Uma parada de cor de um gradiente. */
export interface HeroGradientStop {
  id:        string
  cor:       string
  opacidade: number   // 0–1
  posicao:   number   // 0–100 (posição no gradiente em %)
}

/**
 * Película colorida sobreposta à imagem de fundo do hero.
 * Salva como JSONB em `overlay_config` de `banners` e `hero_config`.
 */
export interface HeroOverlayConfig {
  tipo:     'nenhum' | 'solido' | 'gradiente_linear' | 'gradiente_radial'
  cor?:     string         // apenas tipo='solido'
  opacidade?: number       // apenas tipo='solido'
  angulo?:  number         // graus (apenas gradiente_linear)
  centroX?: number         // 0–100 (apenas gradiente_radial)
  centroY?: number         // 0–100 (apenas gradiente_radial)
  paradas?: HeroGradientStop[]  // apenas gradiente_linear / gradiente_radial
}

// ─── Hero Config (Slide 0) ────────────────────────────────────────────────────

/**
 * Configuração do slide principal do hero (tabela `hero_config`, 1 linha).
 * Quando `camadas` está preenchido, o editor visual é usado.
 * Quando vazio, o layout legado (eyebrow/titulo/subtitulo/botões) é renderizado.
 */
export interface HeroConfig {
  id:                   string
  url_imagem:           string | null
  // ── Layout legado (usado quando camadas[] está vazio) ──
  eyebrow:              string
  titulo_1:             string
  titulo_2:             string
  titulo_3:             string
  subtitulo:            string
  intervalo:            number           // segundos entre slides no slideshow
  cor_fundo:            string           // cor do overlay legado
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
  // ── Editor visual (quando preenchido, substitui o layout legado) ──
  camadas?:        HeroLayer[]       | null
  overlay_config?: HeroOverlayConfig | null
  // ── Variantes mobile (viewport < 768px). Null = usa a variante desktop como fallback. ──
  url_imagem_mobile?:     string | null
  camadas_mobile?:        HeroLayer[]       | null
  overlay_config_mobile?: HeroOverlayConfig | null
  updated_at:      string
}

// ─── Perfil do Corretor ───────────────────────────────────────────────────────

/**
 * Dados públicos do corretor (tabela `perfil_corretor`, 1 linha).
 * Exibidos na seção "Sobre mim", rodapé e meta tags.
 */
export interface PerfilCorretor {
  id:               string
  nome:             string
  creci:            string
  email:            string
  telefone:         string
  cidade_estado:    string        // ex: 'Sinop · MT'
  foto_url:         string | null             // foto circular do perfil
  foto_cinemascope_url?: string | null        // foto de proporção 2.35:1 (CinemaSection)
  bio_1:                 string | null        // 1º parágrafo da bio
  bio_2:                 string | null        // 2º parágrafo da bio
  anos_experiencia:  number
  imoveis_vendidos:  number
  avaliacao_google:  number       // 0–5
  mostrar_anos_experiencia: boolean   // controla exibição na seção "Sobre mim"
  mostrar_imoveis_vendidos: boolean
  mostrar_avaliacao_google: boolean
  updated_at:        string
}

// ─── Captação (Para Proprietários) ────────────────────────────────────────────

/**
 * Textos da seção "Para proprietários" (tabela `captacao_config`, 1 linha).
 * Editáveis pelo admin para personalizar a chamada de captação de imóveis.
 */
export interface CaptacaoConfig {
  id:             string
  eyebrow:        string
  titulo_linha_1: string
  titulo_linha_2: string
  texto_1:        string
  texto_2:        string
  updated_at:     string
}

// ─── Notas de Leads ───────────────────────────────────────────────────────────

/** Anotação interna sobre um lead (tabela `lead_notas`). */
export interface LeadNota {
  id:         string
  lead_id:    string
  texto:      string
  created_at: string
}

// ─── Pipeline de Leads ────────────────────────────────────────────────────────

/** Etapa do funil de leads (tabela `pipeline_etapas`). */
export interface PipelineEtapa {
  id:    string
  slug:  string   // usado como valor em Lead.status
  nome:  string
  cor:   string   // hex, usada no badge da etapa
  ordem: number
}

// ─── Avaliações ───────────────────────────────────────────────────────────────

export type AvaliacaoOrigem = 'cliente' | 'admin'

/** Depoimento de cliente (tabela `avaliacoes`). Exibe apenas os aprovados no site. */
export interface Avaliacao {
  id:         string
  nome:       string
  texto:      string
  estrelas:   number   // 1–5
  via:        string | null   // 'Google' | 'WhatsApp' | etc
  aprovado:   boolean         // false = oculto no site, pendente de aprovação
  origem:     AvaliacaoOrigem
  ordem:      number          // posição no carrossel
  created_at: string
  updated_at: string
}
