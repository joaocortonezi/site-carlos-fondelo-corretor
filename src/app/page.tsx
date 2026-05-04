// ─── Home page (Server Component) ────────────────────────────────────────────
// Busca todos os dados em paralelo no servidor e distribui para os componentes.
// Por ser um Server Component, não há JavaScript de busca enviado ao browser.

import Nav                   from '@/components/Nav/Nav'
import Hero                  from '@/components/Hero/Hero'
import Search                from '@/components/Search/Search'
import ExclusiveProperties   from '@/components/ExclusiveProperties/ExclusiveProperties'
import Videos                from '@/components/Videos/Videos'
import Reviews               from '@/components/Reviews/Reviews'
import HighEnd               from '@/components/HighEnd/HighEnd'
import Destaques             from '@/components/Destaques/Destaques'
import About                 from '@/components/About/About'
import CinemaSection         from '@/components/CinemaSection/CinemaSection'
import CaptacaoSection       from '@/components/CaptacaoSection/CaptacaoSection'
import NewsletterSection     from '@/components/NewsletterSection/NewsletterSection'
import Footer                from '@/components/Footer/Footer'
import { createSupabaseServer } from '@/lib/supabase-server'
import { PerfilCorretor }    from '@/lib/types'

export default async function Home() {
  const supabase = await createSupabaseServer()

  // Todas as 9 queries disparam ao mesmo tempo — não esperamos uma terminar para iniciar a outra
  const [
    { data: exclusivos },
    { data: altopadrao },
    { data: bairrosData },
    { data: imoveisComVideo },
    { data: avaliacoesData },
    { data: bannersAtivos },
    { data: heroConfigData },
    { data: perfilData },
    { data: destaquesData },
  ] = await Promise.all([
    // Imóveis exclusivos para a seção ExclusiveProperties
    supabase
      .from('imoveis')
      .select('*, fotos:fotos_imoveis(id, url, ordem)')
      .eq('status', 'disponivel')
      .eq('exclusivo', true)
      .order('created_at', { ascending: false })
      .limit(3),

    // Imóveis de alto padrão (flag ou preço >= R$ 900k)
    supabase
      .from('imoveis')
      .select('*, fotos:fotos_imoveis(id, url, ordem)')
      .eq('status', 'disponivel')
      .or('alto_padrao.eq.true,preco.gte.900000')
      .order('preco', { ascending: false })
      .limit(3),

    // Lista de bairros disponíveis para o filtro de busca
    supabase
      .from('imoveis')
      .select('bairro')
      .eq('status', 'disponivel')
      .not('bairro', 'is', null),

    // Imóveis com vídeo vertical para a seção de Reels
    supabase
      .from('imoveis')
      .select('id, titulo, bairro, cidade, preco, video_vertical, slug, fotos:fotos_imoveis(id, url, ordem)')
      .eq('status', 'disponivel')
      .not('video_vertical', 'is', null)
      .order('created_at', { ascending: false })
      .limit(12),

    // Avaliações aprovadas para o carrossel de depoimentos
    supabase
      .from('avaliacoes')
      .select('id, nome, texto, via, estrelas')
      .eq('aprovado', true)
      .order('ordem', { ascending: true })
      .limit(6),

    // Slides do hero (além do slide 0 que vem de hero_config)
    supabase
      .from('banners')
      .select('url_imagem, tipo, camadas, overlay_config')
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .limit(10),

    // Configuração do slide 0 do hero (sempre 1 linha)
    supabase
      .from('hero_config')
      .select('*')
      .limit(1)
      .maybeSingle(),

    // Perfil do corretor — usado em múltiplos componentes (CinemaSection, About, Footer)
    supabase
      .from('perfil_corretor')
      .select('*')
      .limit(1)
      .maybeSingle(),

    // Imóveis em destaque para a seção Destaques
    supabase
      .from('imoveis')
      .select('*, fotos:fotos_imoveis(id, url, ordem)')
      .eq('status', 'disponivel')
      .order('destaque',   { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  // Deduplica e ordena os bairros para o select de busca
  const bairros = [...new Set(
    (bairrosData ?? []).map(i => i.bairro).filter(Boolean) as string[]
  )].sort()

  return (
    <>
      <Nav />
      {/* Hero: slide 0 (hero_config) + slides adicionais (banners) */}
      <Hero banners={bannersAtivos ?? []} heroConfig={heroConfigData} />
      <Search bairros={bairros} />
      <Destaques imoveis={destaquesData ?? []} />
      <Videos imoveis={imoveisComVideo ?? []} />
      <ExclusiveProperties imoveis={exclusivos ?? []} />
      <Reviews avaliacoes={avaliacoesData ?? []} />
      <HighEnd imoveis={altopadrao ?? []} />
      {/* Seção cinemascope (2.35:1) — só renderiza se foto_cinemascope_url estiver preenchida */}
      <CinemaSection imageUrl={(perfilData as PerfilCorretor | null)?.foto_cinemascope_url} />
      <CaptacaoSection />
      <About perfil={perfilData as PerfilCorretor | null} />
      <NewsletterSection />
      <Footer perfil={perfilData as PerfilCorretor | null} />
    </>
  )
}
