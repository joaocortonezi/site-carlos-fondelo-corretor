'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient }              from '@supabase/ssr'
import styles                               from './newsletter.module.css'

interface Subscriber {
  id:            string
  email:         string
  nome:          string | null
  confirmado:    boolean
  opt_in_origem: string | null
  created_at:    string
}

type MainTab = 'lista' | 'disparar'
type ListTab = 'confirmados' | 'todos'

export default function NewsletterPage() {
  const [mainTab,  setMainTab]  = useState<MainTab>('lista')
  const [listTab,  setListTab]  = useState<ListTab>('confirmados')
  const [subs,     setSubs]     = useState<Subscriber[]>([])
  const [loading,  setLoading]  = useState(true)

  // dispatch state
  const [dispMode,   setDispMode]   = useState<'todos' | 'especifico'>('todos')
  const [dispTo,     setDispTo]     = useState('')
  const [dispSubj,   setDispSubj]   = useState('')
  const [dispBody,   setDispBody]   = useState('')
  const [sending,    setSending]    = useState(false)
  const [dispResult, setDispResult] = useState<{ ok: boolean; msg: string } | null>(null)

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

    if (listTab === 'confirmados') q.eq('confirmado', true)

    const { data } = await q
    setSubs(data ?? [])
    setLoading(false)
  }, [supabase, listTab])

  useEffect(() => { if (mainTab === 'lista') load() }, [load, mainTab])

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
    const csv  = [header, ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `newsletter_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setDispResult(null)

    if (!dispSubj.trim() || !dispBody.trim()) return

    if (dispMode === 'todos') {
      if (!confirm(`Enviar para todos os assinantes confirmados? Esta ação não pode ser desfeita.`)) return
    }

    setSending(true)

    let recipients: { email: string; nome: string | null }[] | string

    if (dispMode === 'especifico') {
      recipients = dispTo.trim()
    } else {
      const { data } = await supabase
        .from('newsletter_subscribers')
        .select('email, nome')
        .eq('confirmado', true)
      recipients = data ?? []
    }

    const res  = await fetch('/api/newsletter/dispatch', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ subject: dispSubj, body: dispBody, recipients }),
    })
    const json = await res.json()

    setSending(false)
    if (json.ok) {
      setDispResult({ ok: true, msg: `Enviado com sucesso para ${json.sent} destinatário${json.sent !== 1 ? 's' : ''}.` })
      setDispSubj('')
      setDispBody('')
      setDispTo('')
    } else {
      setDispResult({ ok: false, msg: json.error ?? 'Erro ao disparar.' })
    }
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

  const confirmedCount = subs.filter(s => s.confirmado).length

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Newsletter</h1>
          {mainTab === 'lista' && (
            <p className={styles.count}>{subs.length} contato{subs.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        {mainTab === 'lista' && (
          <button className={styles.btnExport} onClick={exportCSV} disabled={subs.length === 0}>
            Exportar CSV
          </button>
        )}
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${mainTab === 'lista'    ? styles.tabActive : ''}`} onClick={() => setMainTab('lista')}>
          Lista
        </button>
        <button className={`${styles.tab} ${mainTab === 'disparar' ? styles.tabActive : ''}`} onClick={() => setMainTab('disparar')}>
          Disparar
        </button>
      </div>

      {mainTab === 'lista' && (
        <>
          <div className={styles.tabs} style={{ marginBottom: '1rem' }}>
            <button className={`${styles.tab} ${listTab === 'confirmados' ? styles.tabActive : ''}`} onClick={() => setListTab('confirmados')}>
              Confirmados
            </button>
            <button className={`${styles.tab} ${listTab === 'todos' ? styles.tabActive : ''}`} onClick={() => setListTab('todos')}>
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
        </>
      )}

      {mainTab === 'disparar' && (
        <form className={styles.dispatchForm} onSubmit={handleDispatch}>
          <div className={styles.dispatchModeRow}>
            <label className={`${styles.modeBtn} ${dispMode === 'todos' ? styles.modeBtnActive : ''}`}>
              <input type="radio" name="mode" value="todos" checked={dispMode === 'todos'} onChange={() => setDispMode('todos')} />
              Todos os confirmados
              {confirmedCount > 0 && <span className={styles.modeCount}>{confirmedCount}</span>}
            </label>
            <label className={`${styles.modeBtn} ${dispMode === 'especifico' ? styles.modeBtnActive : ''}`}>
              <input type="radio" name="mode" value="especifico" checked={dispMode === 'especifico'} onChange={() => setDispMode('especifico')} />
              E-mail específico
            </label>
          </div>

          {dispMode === 'especifico' && (
            <input
              className={styles.dispatchInput}
              type="email"
              placeholder="destinatario@email.com"
              value={dispTo}
              onChange={e => setDispTo(e.target.value)}
              required
            />
          )}

          <input
            className={styles.dispatchInput}
            type="text"
            placeholder="Assunto do e-mail *"
            value={dispSubj}
            onChange={e => setDispSubj(e.target.value)}
            required
          />

          <textarea
            className={styles.dispatchTextarea}
            placeholder="Mensagem (texto simples, cada linha vira um parágrafo) *"
            value={dispBody}
            onChange={e => setDispBody(e.target.value)}
            rows={8}
            required
          />

          {dispResult && (
            <p className={dispResult.ok ? styles.dispatchOk : styles.dispatchErr}>
              {dispResult.msg}
            </p>
          )}

          <button type="submit" className={styles.btnDispatch} disabled={sending}>
            {sending ? 'Enviando…' : dispMode === 'todos' ? `Disparar para todos os confirmados` : 'Enviar'}
          </button>
        </form>
      )}
    </div>
  )
}
