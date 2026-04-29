export type PropertyTag = 'exclusivo' | 'destaque' | 'venda' | 'lancamento'

export interface Property {
  id: string
  name: string
  location: string
  price: string
  beds?: number
  baths?: number
  area: number
  parking?: number
  tag: PropertyTag
  ref?: string
  image: string
}

export const exclusiveProperties: Property[] = [
  {
    id: '001',
    name: 'Apto 3 dorms · 90 m²',
    location: 'Bairro · Cidade',
    price: 'R$ 750.000',
    beds: 3,
    baths: 2,
    area: 90,
    parking: 1,
    tag: 'exclusivo',
    ref: '#001',
    image: '/images/imovel-01.jpg',
  },
  {
    id: '002',
    name: 'Casa 4 dorms · 200 m²',
    location: 'Bairro · Cidade',
    price: 'R$ 1.200.000',
    beds: 4,
    baths: 3,
    area: 200,
    parking: 2,
    tag: 'exclusivo',
    image: '/images/imovel-02.jpg',
  },
  {
    id: '003',
    name: 'Apto 2 dorms · 65 m²',
    location: 'Bairro · Cidade',
    price: 'R$ 480.000',
    beds: 2,
    baths: 1,
    area: 65,
    parking: 1,
    tag: 'exclusivo',
    image: '/images/imovel-03.jpg',
  },
]

export const highEndProperties: Property[] = [
  {
    id: '101',
    name: 'Cobertura Duplex',
    location: 'Bairro Nobre · 380 m² · 4 suítes',
    price: 'R$ 3.500.000',
    beds: 4,
    baths: 4,
    area: 380,
    parking: 4,
    tag: 'destaque',
    image: '/images/alto-01.jpg',
  },
  {
    id: '102',
    name: 'Casa em condomínio',
    location: '250 m²',
    price: 'R$ 1.600.000',
    area: 250,
    tag: 'venda',
    image: '/images/alto-02.jpg',
  },
  {
    id: '103',
    name: 'Flat executivo',
    location: '120 m²',
    price: 'R$ 1.200.000',
    area: 120,
    tag: 'venda',
    image: '/images/alto-03.jpg',
  },
]

export interface VideoItem {
  id:        string
  title:     string
  meta:      string
  thumb:     string
  videoUrl:  string | null
}

export const videoItems: VideoItem[] = [
  { id: '1', title: 'Apto 3 dorms',    meta: 'Bairro · R$ 750k',  thumb: '/images/imovel-01.jpg', videoUrl: null },
  { id: '2', title: 'Casa 4 dorms',    meta: 'Bairro · R$ 1,2M',  thumb: '/images/imovel-02.jpg', videoUrl: null },
  { id: '3', title: 'Cobertura Duplex',meta: 'Nobre · R$ 3,5M',   thumb: '/images/alto-01.jpg',   videoUrl: null },
  { id: '4', title: 'Casa condomínio', meta: 'Bairro · R$ 1,6M',  thumb: '/images/alto-02.jpg',   videoUrl: null },
  { id: '5', title: 'Flat executivo',  meta: 'Centro · R$ 1,2M',  thumb: '/images/alto-03.jpg',   videoUrl: null },
]

export const reviews = [
  {
    id: '1',
    initials: 'MA',
    name: 'Maria A.',
    text: 'Atendimento excelente! Encontrou o imóvel perfeito para a minha família. Profissional, atencioso e muito honesto em todas as etapas.',
    via: 'via Google · mai/2025',
  },
  {
    id: '2',
    initials: 'RS',
    name: 'Ricardo S.',
    text: 'Vendi meu apartamento em 3 semanas pelo valor pedido. O Carlos conhece o mercado de verdade e sabe conduzir uma negociação com segurança.',
    via: 'via Google · abr/2025',
  },
  {
    id: '3',
    initials: 'JP',
    name: 'Julia P.',
    text: 'Terceira compra com o Carlos. Simplesmente não vejo motivo para trabalhar com outro corretor. Confiança e resultado garantido.',
    via: 'via Google · mar/2025',
  },
]
