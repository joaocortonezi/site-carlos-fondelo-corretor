'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient }              from '@supabase/ssr'
import styles                               from './newsletter.module.css'

interface Subscriber {
  id:              string
  email:           string
  nome:            string | null
  confirmado:      boolean
  opt_in_origem:   string | null
  created_at:      string
}

export default function NewsletterPage() {
  const [subs,    setSubs]    = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<'todos' | 'confirmados'>('confirmados')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const load = useCallback(async () => {
    setLoading(true)
    const q = supabase
      .from('newsletter_subscribers')
      .select('id, email, nome, confirmado, opt_in_origem, created_at')
      .order('created_at', { ascending: false })

    if (tab === 'confirmados') q.eq('confirmado', true)

    const { data } = await q
    setSubs(data ?? [])
    setLoading(false)
  }, [supabase, tab])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este e-mail da lista?')) return
    await supabase.from('newsletter_subscribers').delete().eq('id', id)
    setSubs(s => s.filter(x => x.id !== id))
  }

  const exportCSV = () => {
    const header = 'Nome,Email,Confirmado,Origem,Cadastro'
    const rows = subs.map(s => [
      s.nome ?? '',
      s.email,
      s.confirmado ? 'Sim' : 'Não',
      s.opt_in_origem ?? '',
      new Date(s.created_at).toLocaleDateString('pt-BR'),
    ].map(v => `"${v}"`).join(','))
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `newsletter_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Newsletter</h1>
          <p className={styles.count}>{subs.length} contato{subs.length !== 1 ? 's' : ''}</p>
        </div>
        <button className={styles.btnExport} onClick={exportCSV} disabled={subs.length === 0}>
          Exportar CSV
        </button>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'confirmados' ? styles.tabActive : ''}`} onClick={() => setTab('confirmados')}>
          Confirmados
        </button>
        <button className={`${styles.tab} ${tab === 'todos' ? styles.tabActive : ''}`} onClick={() => setTab('todos')}>
          Todos
        </button>
      </div>

      {loading ? (
        <p className={styles.loading}>Carregando…</p>
      ) : subs.length === 0 ? (
        <p className={styles.empty}>Nenhum cadastro encontrado.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Nome</th>
                <th>Origem</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {subs.map(s => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>{s.nome ?? <span className={styles.none}>—</span>}</td>
                  <td>{s.opt_in_origem ?? <span className={styles.none}>—</span>}</td>
                  <td>
                    <span className={s.confirmado ? styles.badgeOk : styles.badgePending}>
                      {s.confirmado ? 'Confirmado' : 'Pendente'}
                    </span>
                  </td>
                  <td>{fmt(s.created_at)}</td>
                  <td>
                    <button className={styles.btnDel} onClick={() => handleDelete(s.id)} title="Remover">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
