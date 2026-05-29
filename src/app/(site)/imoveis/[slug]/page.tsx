import { notFound }             from 'next/navigation'
import Nav                      from '@/components/Nav/Nav'
import FotoGaleria              from '@/components/FotoGaleria/FotoGaleria'
import LeadForm                 from '@/components/LeadForm/LeadForm'
import { createSupabaseServer } from '@/lib/supabase-server'
import { formatPrice, formatArea } from '@/lib/utils'
import { PerfilCorretor }       from '@/lib/types'
import styles                   from './imovel.module.css'

interface PageProps { params: Promise<{ slug: string }> }

// UUID v4 — usado para distinguir slug textual de id UUID em URLs legadas
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function findImovel(slug: string) {
  const supabase = await createSupabaseServer()
  const column   = UUID_REGEX.test(slug) ? 'id' : 'slug'
  const { data } = await supabase
    .from('imoveis')
    .select('*, fotos:fotos_imoveis(id, url, ordem)')
    .eq(column, slug)
    .eq('status', 'disponivel')
    .maybeSingle()
  return data
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const data = await findImovel(slug)
  if (!data) return {}
  return {
    title:       `${data.titulo} — Carlos Fondelo Corretor`,
    description: data.subtitulo ?? data.descricao ?? `${data.titulo} em ${data.bairro ?? data.cidade}`,
  }
}

export default async function ImovelPage({ params }: PageProps) {
  const { slug } = await params
  const imovel = await findImovel(slug)

  if (!imovel) notFound()

  const supabase = await createSupabaseServer()
  const { data: perfilData } = await supabase
    .from('perfil_corretor')
    .select('*')
    .limit(1)
    .maybeSingle()
  const perfil = perfilData as PerfilCorretor | null

  const fotos  = (imovel.fotos ?? []).sort((a: {ordem:number}, b: {ordem:number}) => a.ordem - b.ordem)
  const tipoMap: Record<string, string> = {
    apartamento: 'Apartamento', casa: 'Casa', terreno: 'Terreno', comercial: 'Comercial',
  }

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className="container">
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb}>
            <a href="/">Início</a> / <a href="/imoveis">Imóveis</a> / <span>{imovel.titulo}</span>
          </nav>

          <div className={styles.layout}>
            {/* Coluna principal */}
            <div className={styles.col}>
              <FotoGaleria
                fotos={fotos}
                titulo={imovel.titulo}
                videoHorizontal={imovel.video_horizontal}
                videoVertical={imovel.video_vertical}
              />

              <div className={styles.infoBlock}>
                <div className={styles.tags}>
                  <span className={`${styles.tag} ${styles[`tag_${imovel.finalidade}`]}`}>
                    {imovel.finalidade === 'venda' ? 'Venda' : 'Aluguel'}
                  </span>
                  <span className={styles.tagTipo}>{tipoMap[imovel.tipo] ?? imovel.tipo}</span>
                  {imovel.destaque && <span className={styles.tagDestaque}>Destaque</span>}
                </div>

                <h1 className={styles.titulo}>{imovel.titulo}</h1>
                {imovel.subtitulo && (
                  <p className={styles.subtitulo}>{imovel.subtitulo}</p>
                )}
                <p className={styles.location}>
                  {[imovel.bairro, imovel.cidade, imovel.estado].filter(Boolean).join(' · ')}
                </p>
                <p className={styles.price}>{formatPrice(imovel.preco)}</p>

                <div className={styles.attrs}>
                  {imovel.quartos   > 0 && <AttrItem label="Quartos"   value={String(imovel.quartos)} />}
                  {imovel.banheiros > 0 && <AttrItem label="Banheiros" value={String(imovel.banheiros)} />}
                  {imovel.area_construida && <AttrItem label="Área construída" value={formatArea(imovel.area_construida)} />}
                  {imovel.area_terreno    && <AttrItem label="Área do terreno" value={formatArea(imovel.area_terreno)} />}
                  {/* Fallback: mostra "Área" geral apenas quando nenhuma específica foi preenchida (compat com imóveis antigos) */}
                  {imovel.area && !imovel.area_construida && !imovel.area_terreno && <AttrItem label="Área" value={formatArea(imovel.area)} />}
                  {imovel.vagas     > 0 && <AttrItem label="Vagas"     value={String(imovel.vagas)} />}
                </div>

                {imovel.descricao && (
                  <div className={styles.descricao}>
                    <h2 className={styles.secTitle}>Descrição</h2>
                    <p>{imovel.descricao}</p>
                  </div>
                )}

                {(imovel.endereco || imovel.bairro) && (
                  <div className={styles.localizacao}>
                    <h2 className={styles.secTitle}>Localização</h2>
                    <p>{[imovel.endereco, imovel.bairro, imovel.cidade, imovel.estado, imovel.cep].filter(Boolean).join(', ')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar de contato */}
            <aside className={styles.sidebar}>
              <div className={styles.ctaCard}>
                <p className={styles.ctaPrice}>{formatPrice(imovel.preco)}</p>
                {imovel.referencia && (
                  <p className={styles.ctaRef}>Ref: {imovel.referencia}</p>
                )}
                <p className={styles.ctaName}>{perfil?.nome ?? 'Carlos Fondelo'}</p>
                {perfil?.creci && <p className={styles.ctaCreci}>CRECI · {perfil.creci}</p>}
                <p className={styles.ctaFormLabel}>Tenho interesse neste imóvel</p>
                <LeadForm
                  imovelId={imovel.id}
                  imovelTitulo={imovel.titulo}
                  origem="imovel"
                />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}

function AttrItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.attrItem}>
      <span className={styles.attrValue}>{value}</span>
      <span className={styles.attrLabel}>{label}</span>
    </div>
  )
}

