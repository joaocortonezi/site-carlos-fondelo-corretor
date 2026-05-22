import { Suspense }             from 'react'
import Nav                      from '@/components/Nav/Nav'
import ImovelCard               from '@/components/ImovelCard/ImovelCard'
import ImovelFiltros            from './ImovelFiltros'
import { createSupabaseServer } from '@/lib/supabase-server'
import styles                   from './imoveis.module.css'

interface PageProps {
  searchParams: Promise<{
    tipo?:        string
    finalidade?:  string
    quartos?:     string
    bairro?:      string
    situacao?:    string
    preco_min?:   string
    preco_max?:   string
    exclusivo?:   string
    alto_padrao?: string
  }>
}

export const metadata = {
  title:       'Imóveis — Carlos Fondelo Corretor',
  description: 'Encontre o imóvel ideal para comprar ou alugar.',
}

export default async function ImoveisPage({ searchParams }: PageProps) {
  const params   = await searchParams
  const supabase = await createSupabaseServer()

  let query = supabase
    .from('imoveis')
    .select('*, fotos:fotos_imoveis(id, url, ordem)')
    .eq('status', 'disponivel')
    .order('destaque',   { ascending: false })
    .order('created_at', { ascending: false })

  if (params.tipo) {
    const tipos = params.tipo.split(',').filter(Boolean)
    if (tipos.length === 1) query = query.eq('tipo', tipos[0])
    else if (tipos.length > 1) query = query.in('tipo', tipos)
  }
  if (params.finalidade) {
    query = query.in('finalidade', [params.finalidade, 'ambos'])
  }
  if (params.quartos) {
    query = query.gte('quartos', Number(params.quartos))
  }
  if (params.bairro) {
    const bairros = params.bairro.split(',').filter(Boolean)
    if (bairros.length === 1) query = query.eq('bairro', bairros[0])
    else if (bairros.length > 1) query = query.in('bairro', bairros)
  }
  if (params.situacao) {
    const situacoes = params.situacao.split(',').filter(Boolean)
    if (situacoes.length === 1) query = query.eq('situacao', situacoes[0])
    else if (situacoes.length > 1) query = query.in('situacao', situacoes)
  }
  if (params.preco_min) query = query.gte('preco', Number(params.preco_min))
  if (params.preco_max) query = query.lte('preco', Number(params.preco_max))
  if (params.exclusivo   === 'true') query = query.eq('exclusivo', true)
  if (params.alto_padrao === 'true') query = query.eq('alto_padrao', true)

  const [{ data: imoveis }, { data: bairrosData }] = await Promise.all([
    query,
    supabase
      .from('imoveis')
      .select('bairro')
      .eq('status', 'disponivel')
      .not('bairro', 'is', null),
  ])

  const bairros = [...new Set(
    (bairrosData ?? []).map(i => i.bairro).filter(Boolean) as string[]
  )].sort()

  const total        = imoveis?.length ?? 0
  const isExclusivo  = params.exclusivo   === 'true'
  const isAltopadrao = params.alto_padrao === 'true'

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div className="container">
            <h1 className={styles.pageTitle}>
              {isExclusivo ? 'Imóveis Exclusivos' : isAltopadrao ? 'Imóveis de Alto Padrão' : 'Imóveis'}
            </h1>
            <p className={styles.pageCount}>
              {total} imóvel{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="container">
          <Suspense fallback={<div className={styles.filtros} />}>
            <ImovelFiltros bairros={bairros} />
          </Suspense>

          {imoveis && imoveis.length > 0 ? (
            <div className={styles.grid}>
              {imoveis.map(imovel => (
                <ImovelCard key={imovel.id} imovel={imovel} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <p>Nenhum imóvel encontrado com os filtros selecionados.</p>
              <a href="/imoveis" className={styles.limparFiltros}>Limpar filtros</a>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
