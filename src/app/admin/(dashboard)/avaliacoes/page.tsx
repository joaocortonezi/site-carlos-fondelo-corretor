'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createBrowserClient }                        from '@supabase/ssr'
import { Avaliacao }                                  from '@/lib/types'
import styles                                         from './avaliacoes.module.css'

const STARS = [1, 2, 3, 4, 5]

function starsStr(n: number) { return '★'.repeat(n) + '☆'.repeat(5 - n) }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

type Tab = 'pendentes' | 'aprovadas'

export default function AvaliacoesPage() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [tab,        setTab]        = useState<Tab>('pendentes')
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editing,    setEditing]    = useState<Avaliacao | null>(null)
  const [busy,       setBusy]       = useState<string | null>(null)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ), [])

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from('avaliacoes')
      .select('*')
      .order('created_at', { ascending: false })
    setAvaliacoes((data ?? []) as Avaliacao[])
  }, [supabase])

  useEffect(() => { fetchAll() }, [fetchAll])

  const aprovar = async (id: string) => {
    setBusy(id)
    await supabase.from('avaliacoes').update({ aprovado: true }).eq('id', id)
    setAvaliacoes(a => a.map(x => x.id === id ? { ...x, aprovado: true } : x))
    setBusy(null)
  }

  const reprovar = async (id: string) => {
    setBusy(id)
    await supabase.from('avaliacoes').update({ aprovado: false }).eq('id', id)
    setAvaliacoes(a => a.map(x => x.id === id ? { ...x, aprovado: false } : x))
    setBusy(null)
  }

  const excluir = async (id: string, nome: string) => {
    if (!confirm(`Excluir avaliação de "${nome}"?`)) return
    setBusy(id)
    await supabase.from('avaliacoes').delete().eq('id', id)
    setAvaliacoes(a => a.filter(x => x.id !== id))
    setBusy(null)
  }

  const pendentes  = avaliacoes.filter(a => !a.aprovado && a.origem === 'cliente')
  const aprovadas  = avaliacoes.filter(a => a.aprovado)

  const openNew    = () => { setEditing(null); setModalOpen(true) }
  const openEdit   = (a: Avaliacao) => { setEditing(a); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const onSaved = (saved: Avaliacao) => {
    setAvaliacoes(prev => {
      const idx = prev.findIndex(x => x.id === saved.id)
      return idx >= 0 ? prev.map(x => x.id === saved.id ? saved : x) : [saved, ...prev]
    })
    closeModal()
  }

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Avaliações</h1>
          <p className={styles.count}>
            {pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''} · {aprovadas.length} aprovada{aprovadas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className={styles.btnNew} onClick={openNew}>+ Nova Avaliação</button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'pendentes' ? styles.tabActive : ''}`}
          onClick={() => setTab('pendentes')}
        >
          Pendentes
          {pendentes.length > 0 && <span className={styles.tabBadge}>{pendentes.length}</span>}
        </button>
        <button
          className={`${styles.tab} ${tab === 'aprovadas' ? styles.tabActive : ''}`}
          onClick={() => setTab('aprovadas')}
        >
          Aprovadas
          <span className={styles.tabCount}>{aprovadas.length}</span>
        </button>
      </div>

      {/* Content */}
      {tab === 'pendentes' && (
        <div>
          {pendentes.length === 0 ? (
            <div className={styles.empty}>Nenhuma avaliação pendente.</div>
          ) : (
            <div className={styles.list}>
              {pendentes.map(a => (
                <div key={a.id} className={`${styles.card} ${styles.cardPendente}`}>
                  <div className={styles.cardTop}>
                    <div>
                      <p className={styles.cardNome}>{a.nome}</p>
                      <p className={styles.cardStars}>{starsStr(a.estrelas)}</p>
                    </div>
                    <p className={styles.cardDate}>{fmtDate(a.created_at)}</p>
                  </div>
                  <p className={styles.cardTexto}>&quot;{a.texto}&quot;</p>
                  <div className={styles.cardActions}>
                    <button
                      className={styles.btnAprovar}
                      onClick={() => aprovar(a.id)}
                      disabled={busy === a.id}
                    >
                      ✓ Aprovar
                    </button>
                    <button
                      className={styles.btnRejeitar}
                      onClick={() => excluir(a.id, a.nome)}
                      disabled={busy === a.id}
                    >
                      ✕ Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'aprovadas' && (
        <div>
          {aprovadas.length === 0 ? (
            <div className={styles.empty}>
              Nenhuma avaliação aprovada ainda.{' '}
              <button className={styles.emptyLink} onClick={openNew}>Criar uma agora</button>
            </div>
          ) : (
            <div className={styles.list}>
              {aprovadas.map(a => (
                <div key={a.id} className={`${styles.card} ${a.origem === 'admin' ? styles.cardAdmin : ''}`}>
                  <div className={styles.cardTop}>
                    <div>
                      <p className={styles.cardNome}>
                        {a.nome}
                        {a.origem === 'admin' && <span className={styles.origemBadge}>admin</span>}
                      </p>
                      <p className={styles.cardStars}>{starsStr(a.estrelas)}</p>
                    </div>
                    <p className={styles.cardDate}>{fmtDate(a.created_at)}</p>
                  </div>
                  <p className={styles.cardTexto}>&quot;{a.texto}&quot;</p>
                  {a.via && <p className={styles.cardVia}>{a.via}</p>}
                  <div className={styles.cardActions}>
                    <button
                      className={styles.btnEditar}
                      onClick={() => openEdit(a)}
                      disabled={busy === a.id}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.btnReprovar}
                      onClick={() => reprovar(a.id)}
                      disabled={busy === a.id}
                    >
                      Remover do site
                    </button>
                    <button
                      className={styles.btnExcluir}
                      onClick={() => excluir(a.id, a.nome)}
                      disabled={busy === a.id}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <AvaliacaoModal
          avaliacao={editing}
          supabase={supabase}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  avaliacao: Avaliacao | null
  supabase:  ReturnType<typeof createBrowserClient>
  onClose:   () => void
  onSaved:   (a: Avaliacao) => void
}

function AvaliacaoModal({ avaliacao, supabase, onClose, onSaved }: ModalProps) {
  const [nome,     setNome]     = useState(avaliacao?.nome     ?? '')
  const [texto,    setTexto]    = useState(avaliacao?.texto    ?? '')
  const [estrelas, setEstrelas] = useState(avaliacao?.estrelas ?? 5)
  const [via,      setVia]      = useState(avaliacao?.via      ?? '')
  const [ordem,    setOrdem]    = useState(avaliacao?.ordem    ?? 0)
  const [busy,     setBusy]     = useState(false)
  const [error,    setError]    = useState('')

  const handleSave = async () => {
    if (!nome.trim())  { setError('Nome é obrigatório.'); return }
    if (!texto.trim()) { setError('Texto é obrigatório.'); return }
    setBusy(true)
    setError('')

    const payload = {
      nome:    nome.trim(),
      texto:   texto.trim(),
      estrelas,
      via:     via.trim() || null,
      ordem,
      aprovado: true,
      origem:  'admin' as const,
      updated_at: new Date().toISOString(),
    }

    if (avaliacao) {
      const { data, error: err } = await supabase
        .from('avaliacoes').update(payload).eq('id', avaliacao.id).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      onSaved(data as Avaliacao)
    } else {
      const { data, error: err } = await supabase
        .from('avaliacoes').insert(payload).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      onSaved(data as Avaliacao)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{avaliacao ? 'Editar Avaliação' : 'Nova Avaliação'}</h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {error && <p className={styles.error}>{error}</p>}

          <label className={styles.label}>
            Nome do autor *
            <input
              className={styles.input}
              placeholder="Ex: Maria A."
              value={nome}
              onChange={e => setNome(e.target.value)}
            />
          </label>

          <label className={styles.label}>
            Avaliação *
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Texto da avaliação..."
              value={texto}
              onChange={e => setTexto(e.target.value)}
              rows={4}
            />
          </label>

          <label className={styles.label}>
            Estrelas
            <div className={styles.starsInput}>
              {STARS.map(s => (
                <button
                  key={s}
                  type="button"
                  className={`${styles.starBtn} ${s <= estrelas ? styles.starBtnOn : ''}`}
                  onClick={() => setEstrelas(s)}
                >
                  ★
                </button>
              ))}
              <span className={styles.starsLabel}>{estrelas}/5</span>
            </div>
          </label>

          <label className={styles.label}>
            Via (fonte)
            <input
              className={styles.input}
              placeholder="Ex: via Google · mai/2025"
              value={via}
              onChange={e => setVia(e.target.value)}
            />
          </label>

          <label className={styles.label}>
            Ordem de exibição
            <input
              className={styles.input}
              type="number"
              min={0}
              value={ordem}
              onChange={e => setOrdem(Number(e.target.value))}
            />
          </label>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose} disabled={busy}>Cancelar</button>
          <button className={styles.btnSave}   onClick={handleSave} disabled={busy}>
            {busy ? 'Salvando…' : avaliacao ? 'Salvar alterações' : 'Publicar avaliação'}
          </button>
        </div>
      </div>
    </div>
  )
}
