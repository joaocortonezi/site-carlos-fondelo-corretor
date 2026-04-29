import Link        from 'next/link'
import ImovelForm  from '../ImovelForm'
import styles      from '../imoveis-admin.module.css'

export default function NovoImovelPage() {
  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Novo imóvel</h1>
          <p className={styles.count}><Link href="/admin/imoveis">← Voltar</Link></p>
        </div>
      </div>
      <ImovelForm />
    </div>
  )
}
