# Site Carlos Fondelo — Corretor de Imóveis

Site institucional completo para corretor de imóveis, com painel administrativo integrado. Desenvolvido por [Molda.io](https://www.molda.io/).

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 18 + CSS Modules + Framer Motion |
| Backend / Banco | Supabase (PostgreSQL + Auth + Storage) |
| E-mail | Resend |
| Deploy | Vercel |
| Tipagem | TypeScript 5 |
| Fontes | Google Fonts via `next/font` |

---

## Funcionalidades

### Site público
- **Hero slideshow** — slide principal editável visualmente + banners PNG ou com camadas de texto/botão
- **Busca de imóveis** — filtro por tipo, finalidade, bairro, quartos, faixa de preço
- **Página de imóveis** — listagem paginada com filtros
- **Página de imóvel** — galeria de fotos, vídeo, mapa, formulário de contato
- **Destaques / Exclusivos / Alto Padrão** — grids curados de imóveis
- **Seção de vídeos** — Reels/shorts dos imóveis em carrossel
- **Avaliações** — depoimentos de clientes
- **Seção cinemascope** — foto pessoal do corretor em proporção 2.35:1 (oculta se vazia)
- **Captação / Newsletter** — formulários de captação de leads
- **Sobre mim** — bio, foto, estatísticas animadas
- **Rodapé** com contatos e links legais

### Admin (`/admin`)
Protegido por autenticação Supabase Auth (email/password).

| Seção | O que faz |
|---|---|
| **Imóveis** | CRUD completo, upload de fotos com marca d'água, geração de slug |
| **Leads** | Visualização e pipeline de contatos recebidos |
| **Newsletter** | Lista de inscritos, envio de disparo |
| **Banners** | Editor visual de slides (drag-and-drop de camadas), upload PNG |
| **Avaliações** | Aprovação/rejeição e ordenação de depoimentos |
| **Sobre mim** | Edição de perfil, foto com crop circular, foto cinemascope |
| **Configurações** | Marca d'água aplicada automaticamente nas fotos de imóveis |

---

## Estrutura do banco (Supabase)

```
imoveis            — imóveis com todos os atributos
fotos_imoveis      — fotos vinculadas a cada imóvel
banners            — slides do hero (tipo png | editavel)
hero_config        — configuração do slide 0 (principal)
perfil_corretor    — dados do corretor exibidos no site
leads              — contatos recebidos pelos formulários
avaliacoes         — depoimentos (aprovação manual)
configuracoes      — settings globais (chave/valor)
pipeline_etapas    — etapas do funil de leads
```

### Supabase Storage
```
banners/    — imagens de banners, foto de perfil, foto cinemascope
imoveis/    — fotos dos imóveis + watermark
```

---

## Arquitetura

```
src/
├── app/
│   ├── layout.tsx           ← Root layout: carrega todas as 10 fontes Google
│   ├── page.tsx             ← Home: fetch paralelo de todos os dados via Supabase server
│   ├── imoveis/             ← Listagem e detalhe de imóveis (client-side filters)
│   ├── admin/               ← Dashboard protegido pelo middleware
│   │   ├── login/           ← Login com Supabase Auth
│   │   └── (dashboard)/     ← Layout com sidebar + todas as seções admin
│   ├── api/
│   │   ├── lead/notify/     ← POST: envia e-mail para o corretor via Resend
│   │   ├── newsletter/welcome/ ← POST: envia e-mail de boas-vindas ao inscrito
│   │   └── cloudinary-signature/ ← Assinatura para upload direto no Cloudinary
│   └── obrigado/ politica/ termos/
│
├── components/              ← Um diretório por componente, sempre com .module.css
├── lib/
│   ├── types.ts             ← Todos os tipos TypeScript do projeto
│   ├── supabase-server.ts   ← Cliente Supabase para Server Components
│   ├── supabase.ts          ← Cliente Supabase para Client Components
│   ├── hero-fonts.ts        ← Banco de fontes disponíveis no editor visual
│   └── utils.ts             ← Formatação de preço, área, slug, WhatsApp URL
└── middleware.ts             ← Proteção de todas as rotas /admin/*
```

### Fluxo de dados — Home
```
page.tsx (Server Component)
  └─ Promise.all([...10 queries Supabase])
       ├─ bannersAtivos   → <Hero>
       ├─ heroConfigData  → <Hero>
       ├─ destaquesData   → <Destaques>
       ├─ imoveisComVideo → <Videos>
       ├─ exclusivos      → <ExclusiveProperties>
       ├─ avaliacoesData  → <Reviews>
       ├─ altopadrao      → <HighEnd>
       ├─ perfilData      → <CinemaSection> + <CaptacaoSection> + <About> + <Footer>
       └─ bairrosData     → <Search>
```

### Fluxo do Hero
```
Hero.tsx
  ├─ Slide 0  → hero_config (imagem + camadas de texto/botão + overlay)
  │              se camadas[] vazia → renderiza layout legado (eyebrow/title/subtitle/botões)
  └─ Slides 1+ → banners ativos
                  tipo=editavel → camadas de texto/botão + overlay configurável
                  tipo=png      → imagem pura (sem overlay fixo)
```

### Editor visual de banners
```
HeroEditor.tsx / BannerEditavelModal.tsx
  ├─ Canvas proporcional a 1440px — escala com ResizeObserver
  ├─ Drag-and-drop de camadas via PointerEvents + setPointerCapture
  ├─ LayerEditorShared.tsx — painel lateral de propriedades reutilizado por ambos
  └─ Salva camadas[] + overlay_config em JSONB no Supabase
```

---

## Variáveis de ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Resend (e-mail)
RESEND_API_KEY=
RESEND_FROM=                  # ex: Carlos Fondelo <contato@carlosfondelo.com.br>
RESEND_NOTIFY_TO=             # e-mail do corretor para receber leads

# Cloudinary (upload de fotos de imóveis)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Rodar localmente

```bash
npm install
# crie .env.local com as variáveis acima
npm run dev
```

Acesse `http://localhost:3000` (site) e `/admin` (painel).

---

## Deploy

O projeto é configurado para Vercel. Basta conectar o repositório e adicionar as variáveis de ambiente no painel da Vercel.

```bash
# ou via CLI
vercel deploy --prod
```

---

## Tipos principais (`src/lib/types.ts`)

| Tipo | Tabela | Descrição |
|---|---|---|
| `Imovel` | `imoveis` | Imóvel com todas as propriedades |
| `FotoImovel` | `fotos_imoveis` | Foto vinculada a um imóvel |
| `Banner` | `banners` | Slide do hero (png ou editavel) |
| `HeroConfig` | `hero_config` | Configuração do slide 0 |
| `HeroLayer` | JSONB em banners/hero_config | Camada de texto ou botão no editor visual |
| `HeroOverlayConfig` | JSONB em banners/hero_config | Película sobre a imagem (sólido, gradiente) |
| `PerfilCorretor` | `perfil_corretor` | Dados do corretor |
| `Lead` | `leads` | Contato recebido |
| `Avaliacao` | `avaliacoes` | Depoimento |
| `PipelineEtapa` | `pipeline_etapas` | Etapa do funil de leads |

---

## Fontes disponíveis no editor

O editor visual permite escolher entre 10 fontes Google carregadas no `layout.tsx`:

| Nome | CSS var | Categoria |
|---|---|---|
| DM Sans | `--font-body` | sans |
| Inter | `--font-inter` | sans |
| Montserrat | `--font-montserrat` | sans |
| Raleway | `--font-raleway` | sans |
| Josefin Sans | `--font-josefin` | sans |
| Lora | `--font-lora` | serif |
| Playfair Display | `--font-playfair` | serif |
| Cormorant Garamond | `--font-cormorant` | serif |
| EB Garamond | `--font-eb-garamond` | serif |
| Cinzel | `--font-cinzel` | display |
