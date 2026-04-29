import Link                    from 'next/link'
import { notFound }            from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import ImovelForm              from '../../ImovelForm'
import styles                  from '../../imoveis-admin.module.css'

interface PageProps { params: Promise<{ id: string }> }

export default async function EditarImovelPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const { data: imovel } = await supabase
    .from('imoveis')
    .select('*, fotos:fotos_imoveis(id, url, ordem)')
    .eq('id', id)
    .single()

  if (!imovel) notFound()

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Editar imóvel</h1>
          <p className={styles.count}><Link href="/admin/imoveis">← Voltar</Link></p>
        </div>
      </div>
      <ImovelForm imovel={imovel} />
    </div>
  )
}
