'use client'

import Link                  from 'next/link'
import { useRouter }         from 'next/navigation'
import { useState }          from 'react'
import { createBrowserClient } from '@supabase/ssr'
import styles                from './imoveis-admin.module.css'

export default function AdminImovelActions({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleDelete = async () => {
    if (!confirming) { setConfirming(true); return }
    setLoading(true)
    await supabase.from('fotos_imoveis').delete().eq('imovel_id', id)
    await supabase.from('imoveis').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div className={styles.actions}>
      <Link href={`/admin/imoveis/${id}/editar`} className={styles.actionEdit}>Editar</Link>
      <button
        className={`${styles.actionDelete} ${confirming ? styles.actionDeleteConfirm : ''}`}
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? '…' : confirming ? 'Confirmar?' : 'Excluir'}
      </button>
      {confirming && !loading && (
        <button className={styles.actionCancel} onClick={() => setConfirming(false)}>Cancelar</button>
      )}
    </div>
  )
}
