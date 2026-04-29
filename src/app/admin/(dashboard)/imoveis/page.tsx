import Link                     from 'next/link'
import { createSupabaseServer }  from '@/lib/supabase-server'
import { formatPrice }           from '@/lib/utils'
import AdminImovelActions        from './AdminImovelActions'
import styles                    from './imoveis-admin.module.css'

export default async function AdminImoveisPage() {
  const supabase = await createSupabaseServer()
  const { data: imoveis } = await supabase
    .from('imoveis')
    .select('id, titulo, tipo, finalidade, preco, bairro, cidade, status, destaque, referencia, created_at')
    .order('created_at', { ascending: false })

  const statusLabel: Record<string, string> = {
    disponivel: 'Disponível',
    vendido:    'Vendido',
    alugado:    'Alugado',
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Imóveis</h1>
          <p className={styles.count}>{imoveis?.length ?? 0} cadastrado{(imoveis?.length ?? 0) !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/imoveis/novo" className={styles.btnNovo}>
          + Novo imóvel
        </Link>
      </div>

      {imoveis && imoveis.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Finalidade</th>
                <th>Preço</th>
                <th>Localização</th>
                <th>Status</th>
                <th>Destaque</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {imoveis.map(imovel => (
                <tr key={imovel.id}>
                  <td>
                    <span className={styles.imovelTitulo}>{imovel.titulo}</span>
                    {imovel.referencia && <span className={styles.imovelRef}>Ref: {imovel.referencia}</span>}
                  </td>
                  <td className={styles.capitalize}>{imovel.tipo}</td>
                  <td className={styles.capitalize}>{imovel.finalidade}</td>
                  <td>{formatPrice(imovel.preco)}</td>
                  <td>{[imovel.bairro, imovel.cidade].filter(Boolean).join(', ')}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${imovel.status}`]}`}>
                      {statusLabel[imovel.status] ?? imovel.status}
                    </span>
                  </td>
                  <td>{imovel.destaque ? '★' : '—'}</td>
                  <td>
                    <AdminImovelActions id={imovel.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>
          <p>Nenhum imóvel cadastrado ainda.</p>
          <Link href="/admin/imoveis/novo" className={styles.btnNovo}>Cadastrar primeiro imóvel</Link>
        </div>
      )}
    </div>
  )
}
