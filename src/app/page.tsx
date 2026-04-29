import Nav                   from '@/components/Nav/Nav'
import Hero                  from '@/components/Hero/Hero'
import Search                from '@/components/Search/Search'
import ExclusiveProperties   from '@/components/ExclusiveProperties/ExclusiveProperties'
import Videos                from '@/components/Videos/Videos'
import Reviews               from '@/components/Reviews/Reviews'
import HighEnd               from '@/components/HighEnd/HighEnd'
import Destaques             from '@/components/Destaques/Destaques'
import About                 from '@/components/About/About'
import Footer                from '@/components/Footer/Footer'
import { createSupabaseServer } from '@/lib/supabase-server'
import { PerfilCorretor }    from '@/lib/types'

export default async function Home() {
  const supabase = await createSupabaseServer()

  const [{ data: exclusivos }, { data: altopadrao }, { data: bairrosData }, { data: imoveisComVideo }, { data: avaliacoesData }, { data: bannersAtivos }, { data: heroConfigData }, { data: perfilData }, { data: destaquesData }] = await Promise.all([
    supabase
      .from('imoveis')
      .select('*, fotos:fotos_imoveis(id, url, ordem)')
      .eq('status', 'disponivel')
      .eq('exclusivo', true)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('imoveis')
      .select('*, fotos:fotos_imoveis(id, url, ordem)')
      .eq('status', 'disponivel')
      .or('alto_padrao.eq.true,preco.gte.900000')
      .order('preco', { ascending: false })
      .limit(3),
    supabase
      .from('imoveis')
      .select('bairro')
      .eq('status', 'disponivel')
      .not('bairro', 'is', null),
    supabase
      .from('imoveis')
      .select('id, titulo, bairro, cidade, preco, video_vertical, slug, fotos:fotos_imoveis(id, url, ordem)')
      .eq('status', 'disponivel')
      .not('video_vertical', 'is', null)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('avaliacoes')
      .select('id, nome, texto, via, estrelas')
      .eq('aprovado', true)
      .order('ordem', { ascending: true })
      .limit(6),
    supabase
      .from('banners')
      .select('url_imagem')
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .limit(10),
    supabase
      .from('hero_config')
      .select('*')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('perfil_corretor')
      .select('*')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('imoveis')
      .select('*, fotos:fotos_imoveis(id, url, ordem)')
      .eq('status', 'disponivel')
      .order('destaque',   { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const bairros = [...new Set(
    (bairrosData ?? []).map(i => i.bairro).filter(Boolean) as string[]
  )].sort()

  return (
    <>
      <Nav />
      <Hero banners={bannersAtivos ?? []} heroConfig={heroConfigData} />
      <Search bairros={bairros} />
      <Destaques imoveis={destaquesData ?? []} />
      <Videos imoveis={imoveisComVideo ?? []} />
      <ExclusiveProperties imoveis={exclusivos ?? []} />
      <Reviews avaliacoes={avaliacoesData ?? []} />
      <HighEnd imoveis={altopadrao ?? []} />
      <About perfil={perfilData as PerfilCorretor | null} />
      <Footer perfil={perfilData as PerfilCorretor | null} />
    </>
  )
}
