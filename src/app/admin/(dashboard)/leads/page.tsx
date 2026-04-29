'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createBrowserClient }                        from '@supabase/ssr'
import { Lead, LeadNota, PipelineEtapa }              from '@/lib/types'
import styles                                         from './leads.module.css'

const ORIGEM_LABELS: Record<string, string> = {
  nav:    'Nav',
  video:  'Vídeo',
  imovel: 'Imóvel',
  sobre:  'Sobre',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads,         setLeads]         = useState<Lead[]>([])
  const [etapas,        setEtapas]        = useState<PipelineEtapa[]>([])
  const [busy,          setBusy]          = useState<string | null>(null)
  const [view,          setView]          = useState<'kanban' | 'lista'>('kanban')
  const [showTrash,     setShowTrash]     = useState(false)
  const [selectedLead,  setSelectedLead]  = useState<Lead | null>(null)
  const [showEtapasMgr, setShowEtapasMgr] = useState(false)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ), [])

  const fetchLeads = useCallback(async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    setLeads(data ?? [])
  }, [supabase])

  const fetchEtapas = useCallback(async () => {
    const { data } = await supabase
      .from('pipeline_etapas')
      .select('*')
      .order('ordem', { ascending: true })
    setEtapas(data ?? [])
  }, [supabase])

  useEffect(() => {
    fetchLeads()
    fetchEtapas()
  }, [fetchLeads, fetchEtapas])

  const updateStatus = useCallback(async (id: string, status: string) => {
    setBusy(id)
    await supabase.from('leads').update({ status }).eq('id', id)
    setLeads(l => l.map(x => x.id === id ? { ...x, status } : x))
    setSelectedLead(sl => sl?.id === id ? { ...sl, status } : sl)
    setBusy(null)
  }, [supabase])

  const deleteLead = useCallback(async (id: string) => {
    if (!confirm('Apagar permanentemente este lead? Não pode ser desfeito.')) return
    await supabase.from('leads').delete().eq('id', id)
    setLeads(l => l.filter(x => x.id !== id))
  }, [supabase])

  const activeLeads = leads.filter(l => l.status !== 'descartado')
  const trashLeads  = leads.filter(l => l.status === 'descartado')

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pipeline de Leads</h1>
          <p className={styles.count}>
            {activeLeads.length} ativo{activeLeads.length !== 1 ? 's' : ''}
            {trashLeads.length > 0 && ` · ${trashLeads.length} na lixeira`}
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={`${styles.trashBtn} ${showTrash ? styles.trashBtnActive : ''}`}
            onClick={() => setShowTrash(t => !t)}
            title="Lixeira"
          >
            <TrashIcon />
            Lixeira
            {trashLeads.length > 0 && (
              <span className={styles.trashBadge}>{trashLeads.length}</span>
            )}
          </button>

          <button className={styles.etapasBtn} onClick={() => setShowEtapasMgr(true)}>
            <SettingsIcon />
            Etapas
          </button>

          {!showTrash && (
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${view === 'kanban' ? styles.viewBtnActive : ''}`}
                onClick={() => setView('kanban')}
              >
                <KanbanIcon />
                Pipeline
              </button>
              <button
                className={`${styles.viewBtn} ${view === 'lista' ? styles.viewBtnActive : ''}`}
                onClick={() => setView('lista')}
              >
                <ListIcon />
                Lista
              </button>
            </div>
          )}
        </div>
      </div>

      {showTrash ? (
        <TrashView
          leads={trashLeads}
          busy={busy}
          onRestore={id => updateStatus(id, 'novo')}
          onDelete={deleteLead}
        />
      ) : view === 'kanban' ? (
        <KanbanView
          leads={activeLeads}
          etapas={etapas}
          busy={busy}
          onUpdate={updateStatus}
          onSelect={setSelectedLead}
        />
      ) : (
        <ListView
          leads={activeLeads}
          etapas={etapas}
          busy={busy}
          onUpdate={updateStatus}
          onSelect={setSelectedLead}
        />
      )}

      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          etapas={etapas}
          busy={busy}
          supabase={supabase}
          onClose={() => setSelectedLead(null)}
          onUpdate={updateStatus}
          onDiscard={id => { updateStatus(id, 'descartado'); setSelectedLead(null) }}
        />
      )}

      {showEtapasMgr && (
        <EtapasManager
          etapas={etapas}
          supabase={supabase}
          onClose={() => setShowEtapasMgr(false)}
          onChange={fetchEtapas}
        />
      )}
    </div>
  )
}

// ─── Kanban ──────────────────────────────────────────────────────────────────

function KanbanView({ leads, etapas, busy, onUpdate, onSelect }: {
  leads:    Lead[]
  etapas:   PipelineEtapa[]
  busy:     string | null
  onUpdate: (id: string, status: string) => void
  onSelect: (lead: Lead) => void
}) {
  const allCols = [
    { slug: 'novo', nome: 'Novo', cor: '#3b82f6' },
    ...etapas.map(e => ({ slug: e.slug, nome: e.nome, cor: e.cor })),
  ]

  const moveForward = (lead: Lead) => {
    const slugs = allCols.map(c => c.slug)
    const idx = slugs.indexOf(lead.status)
    if (idx >= 0 && idx < slugs.length - 1) onUpdate(lead.id, slugs[idx + 1])
  }

  const moveBack = (lead: Lead) => {
    const slugs = allCols.map(c => c.slug)
    const idx = slugs.indexOf(lead.status)
    if (idx > 0) onUpdate(lead.id, slugs[idx - 1])
  }

  return (
    <div className={styles.kanban}>
      {allCols.map((col, colIdx) => (
        <KanbanCol
          key={col.slug}
          col={col}
          leads={leads.filter(l => l.status === col.slug)}
          busy={busy}
          canBack={colIdx > 0}
          canForward={colIdx < allCols.length - 1}
          onBack={l    => moveBack(l)}
          onForward={l => moveForward(l)}
          onDiscard={l => onUpdate(l.id, 'descartado')}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function KanbanCol({ col, leads, busy, canBack, canForward, onBack, onForward, onDiscard, onSelect }: {
  col:        { slug: string; nome: string; cor: string }
  leads:      Lead[]
  busy:       string | null
  canBack:    boolean
  canForward: boolean
  onBack:     (l: Lead) => void
  onForward:  (l: Lead) => void
  onDiscard:  (l: Lead) => void
  onSelect:   (l: Lead) => void
}) {
  return (
    <div className={styles.kanbanCol} style={{ borderTopColor: col.cor } as React.CSSProperties}>
      <div className={styles.kanbanColHeader}>
        <span className={styles.kanbanColTitle}>{col.nome}</span>
        <span className={styles.kanbanColBadge} style={{ background: col.cor + '22', color: col.cor }}>
          {leads.length}
        </span>
      </div>

      <div className={styles.kanbanCards}>
        {leads.length === 0 && (
          <div className={styles.kanbanEmpty}>Nenhum lead</div>
        )}
        {leads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            busy={busy}
            canBack={canBack}
            canForward={canForward}
            onBack={() => onBack(lead)}
            onForward={() => onForward(lead)}
            onDiscard={() => onDiscard(lead)}
            onSelect={() => onSelect(lead)}
          />
        ))}
      </div>
    </div>
  )
}

function LeadCard({ lead, busy, canBack, canForward, onBack, onForward, onDiscard, onSelect }: {
  lead:       Lead
  busy:       string | null
  canBack:    boolean
  canForward: boolean
  onBack:     () => void
  onForward:  () => void
  onDiscard:  () => void
  onSelect:   () => void
}) {
  const isDisabled  = busy === lead.id
  const origemLabel = ORIGEM_LABELS[lead.origem] ?? lead.origem

  const stopProp = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation()
    fn()
  }

  return (
    <div
      className={`${styles.card} ${isDisabled ? styles.cardBusy : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
    >
      <div className={styles.cardTop}>
        <span className={`${styles.origemBadge} ${styles[`origem_${lead.origem}`]}`}>
          {origemLabel}
        </span>
        <span className={styles.cardDate}>{fmt(lead.created_at)}</span>
      </div>

      <p className={styles.cardName}>{lead.nome}</p>
      {lead.email && <p className={styles.cardEmail}>{lead.email}</p>}

      <a
        href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.cardPhone}
        onClick={e => e.stopPropagation()}
      >
        {lead.telefone}
      </a>

      {lead.imovel_titulo && (
        <p className={styles.cardImovel}>{lead.imovel_titulo}</p>
      )}
      {lead.mensagem && (
        <p className={styles.cardMsg}>&quot;{lead.mensagem}&quot;</p>
      )}

      <div className={styles.cardActions}>
        {canBack && (
          <button className={styles.btnMove} onClick={stopProp(onBack)} disabled={isDisabled} title="Voltar etapa">
            ←
          </button>
        )}
        {canForward && (
          <button className={styles.btnAdvance} onClick={stopProp(onForward)} disabled={isDisabled}>
            Avançar →
          </button>
        )}
        <button className={styles.btnDiscard} onClick={stopProp(onDiscard)} disabled={isDisabled} title="Descartar">
          <TrashSmIcon />
        </button>
      </div>
    </div>
  )
}

// ─── Lead Modal ───────────────────────────────────────────────────────────────

function LeadModal({ lead, etapas, busy, supabase, onClose, onUpdate, onDiscard }: {
  lead:      Lead
  etapas:    PipelineEtapa[]
  busy:      string | null
  supabase:  ReturnType<typeof createBrowserClient>
  onClose:   () => void
  onUpdate:  (id: string, status: string) => void
  onDiscard: (id: string) => void
}) {
  const [notas,    setNotas]    = useState<LeadNota[]>([])
  const [novaNota, setNovaNota] = useState('')
  const [addBusy,  setAddBusy]  = useState(false)

  useEffect(() => {
    supabase
      .from('lead_notas')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: true })
      .then(({ data }: { data: LeadNota[] | null }) => setNotas(data ?? []))
  }, [lead.id, supabase])

  const addNota = async () => {
    const texto = novaNota.trim()
    if (!texto) return
    setAddBusy(true)
    const { data } = await supabase
      .from('lead_notas')
      .insert({ lead_id: lead.id, texto })
      .select()
      .single()
    if (data) setNotas(n => [...n, data])
    setNovaNota('')
    setAddBusy(false)
  }

  const deleteNota = async (id: string) => {
    await supabase.from('lead_notas').delete().eq('id', id)
    setNotas(n => n.filter(x => x.id !== id))
  }

  const allCols = [
    { slug: 'novo', nome: 'Novo' },
    ...etapas.map(e => ({ slug: e.slug, nome: e.nome })),
  ]

  const origemLabel = ORIGEM_LABELS[lead.origem] ?? lead.origem
  const isDisabled  = busy === lead.id

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalPanel} onClick={e => e.stopPropagation()}>

        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalName}>{lead.nome}</h2>
            <span className={`${styles.origemBadge} ${styles[`origem_${lead.origem}`]}`}>{origemLabel}</span>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className={styles.modalBody}>
          {/* Info */}
          <div className={styles.modalSection}>
            <div className={styles.modalInfoGrid}>
              <div className={styles.modalInfoItem}>
                <span className={styles.modalInfoLabel}>Telefone</span>
                <a
                  href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.modalPhone}
                >
                  {lead.telefone} ↗
                </a>
              </div>
              {lead.email && (
                <div className={styles.modalInfoItem}>
                  <span className={styles.modalInfoLabel}>E-mail</span>
                  <span className={styles.modalInfoValue}>{lead.email}</span>
                </div>
              )}
              <div className={styles.modalInfoItem}>
                <span className={styles.modalInfoLabel}>Recebido em</span>
                <span className={styles.modalInfoValue}>{fmt(lead.created_at)}</span>
              </div>
              {lead.imovel_titulo && (
                <div className={styles.modalInfoItem}>
                  <span className={styles.modalInfoLabel}>Imóvel</span>
                  <span className={styles.modalInfoValue}>{lead.imovel_titulo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mensagem completa */}
          {lead.mensagem && (
            <div className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>Mensagem</h3>
              <p className={styles.modalMensagem}>{lead.mensagem}</p>
            </div>
          )}

          {/* Etapa atual */}
          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Etapa</h3>
            <div className={styles.etapaSelect}>
              {allCols.map(col => (
                <button
                  key={col.slug}
                  className={`${styles.etapaBtn} ${lead.status === col.slug ? styles.etapaBtnActive : ''}`}
                  onClick={() => onUpdate(lead.id, col.slug)}
                  disabled={isDisabled}
                >
                  {col.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Comentários */}
          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Comentários</h3>

            {notas.length > 0 && (
              <div className={styles.notasList}>
                {notas.map(nota => (
                  <div key={nota.id} className={styles.notaItem}>
                    <div className={styles.notaHeader}>
                      <span className={styles.notaDate}>{fmt(nota.created_at)}</span>
                      <button className={styles.notaDelete} onClick={() => deleteNota(nota.id)} title="Remover">✕</button>
                    </div>
                    <p className={styles.notaTexto}>{nota.texto}</p>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.notaForm}>
              <textarea
                className={styles.notaInput}
                placeholder="Adicionar comentário… (Ctrl+Enter para salvar)"
                value={novaNota}
                onChange={e => setNovaNota(e.target.value)}
                rows={3}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNota()
                }}
              />
              <button
                className={styles.notaSubmit}
                onClick={addNota}
                disabled={addBusy || !novaNota.trim()}
              >
                {addBusy ? 'Salvando…' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.modalDiscard}
            onClick={() => onDiscard(lead.id)}
            disabled={isDisabled}
          >
            <TrashSmIcon />
            Enviar para lixeira
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Trash View ───────────────────────────────────────────────────────────────

function TrashView({ leads, busy, onRestore, onDelete }: {
  leads:     Lead[]
  busy:      string | null
  onRestore: (id: string) => void
  onDelete:  (id: string) => void
}) {
  return (
    <div className={styles.trashView}>
      <p className={styles.trashInfo}>
        {leads.length === 0
          ? 'Lixeira vazia.'
          : `${leads.length} lead${leads.length !== 1 ? 's' : ''} descartado${leads.length !== 1 ? 's' : ''}. Apague permanentemente para liberar espaço.`}
      </p>

      {leads.length > 0 && (
        <div className={styles.trashGrid}>
          {leads.map(lead => (
            <div key={lead.id} className={`${styles.card} ${styles.cardTrash}`}>
              <div className={styles.cardTop}>
                <span className={`${styles.origemBadge} ${styles[`origem_${lead.origem}`]}`}>
                  {ORIGEM_LABELS[lead.origem] ?? lead.origem}
                </span>
                <span className={styles.cardDate}>{fmt(lead.created_at)}</span>
              </div>

              <p className={styles.cardName}>{lead.nome}</p>
              {lead.email && <p className={styles.cardEmail}>{lead.email}</p>}

              <a
                href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.cardPhone}
              >
                {lead.telefone}
              </a>

              {lead.imovel_titulo && (
                <p className={styles.cardImovel}>{lead.imovel_titulo}</p>
              )}
              {lead.mensagem && (
                <p className={styles.cardMsg}>&quot;{lead.mensagem}&quot;</p>
              )}

              <div className={styles.cardActions}>
                <button
                  className={styles.btnRestore}
                  onClick={() => onRestore(lead.id)}
                  disabled={busy === lead.id}
                >
                  ↩ Restaurar
                </button>
                <button
                  className={styles.btnDelete}
                  onClick={() => onDelete(lead.id)}
                  disabled={busy === lead.id}
                  title="Apagar permanentemente"
                >
                  <TrashSmIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Etapas Manager ───────────────────────────────────────────────────────────

function EtapasManager({ etapas, supabase, onClose, onChange }: {
  etapas:   PipelineEtapa[]
  supabase: ReturnType<typeof createBrowserClient>
  onClose:  () => void
  onChange: () => void
}) {
  const [nome, setNome] = useState('')
  const [cor,  setCor]  = useState('#3b82f6')
  const [busy, setBusy] = useState(false)

  const addEtapa = async () => {
    const n = nome.trim()
    if (!n) return
    setBusy(true)
    const slug  = slugify(n) + '_' + Date.now().toString(36)
    const ordem = etapas.length > 0 ? Math.max(...etapas.map(e => e.ordem)) + 10 : 10
    await supabase.from('pipeline_etapas').insert({ slug, nome: n, cor, ordem })
    setNome('')
    onChange()
    setBusy(false)
  }

  const deleteEtapa = async (etapa: PipelineEtapa) => {
    if (!confirm(`Remover a etapa "${etapa.nome}"? Leads nela voltarão para "Novo".`)) return
    await supabase.from('leads').update({ status: 'novo' }).eq('status', etapa.slug)
    await supabase.from('pipeline_etapas').delete().eq('id', etapa.id)
    onChange()
  }

  const swap = async (a: PipelineEtapa, b: PipelineEtapa) => {
    await Promise.all([
      supabase.from('pipeline_etapas').update({ ordem: b.ordem }).eq('id', a.id),
      supabase.from('pipeline_etapas').update({ ordem: a.ordem }).eq('id', b.id),
    ])
    onChange()
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalPanel} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalName}>Gerenciar Etapas</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.etapasInfo}>
            Etapas <strong>Novo</strong> (entrada) e <strong>Descartado</strong> (lixeira) são fixas.
            Configure as etapas intermediárias abaixo.
          </p>

          {/* Etapa fixa — Novo */}
          <div className={styles.etapasList}>
            <div className={`${styles.etapaRow} ${styles.etapaRowFixed}`}>
              <span className={styles.etapaCorDot} style={{ background: '#3b82f6' }} />
              <span className={styles.etapaNome}>Novo</span>
              <span className={styles.etapaFixedBadge}>fixo</span>
            </div>

            {etapas.map((etapa, idx) => (
              <div key={etapa.id} className={styles.etapaRow}>
                <span className={styles.etapaCorDot} style={{ background: etapa.cor }} />
                <span className={styles.etapaNome}>{etapa.nome}</span>
                <div className={styles.etapaRowActions}>
                  <button
                    className={styles.etapaOrderBtn}
                    onClick={() => idx > 0 && swap(etapa, etapas[idx - 1])}
                    disabled={idx === 0}
                    title="Subir"
                  >↑</button>
                  <button
                    className={styles.etapaOrderBtn}
                    onClick={() => idx < etapas.length - 1 && swap(etapa, etapas[idx + 1])}
                    disabled={idx === etapas.length - 1}
                    title="Descer"
                  >↓</button>
                  <button
                    className={styles.etapaDelete}
                    onClick={() => deleteEtapa(etapa)}
                    title="Remover"
                  >✕</button>
                </div>
              </div>
            ))}

            <div className={`${styles.etapaRow} ${styles.etapaRowFixed}`}>
              <span className={styles.etapaCorDot} style={{ background: '#9ca3af' }} />
              <span className={styles.etapaNome}>Descartado</span>
              <span className={styles.etapaFixedBadge}>lixeira</span>
            </div>
          </div>

          <div className={styles.etapaAddForm}>
            <h3 className={styles.modalSectionTitle}>Nova etapa</h3>
            <div className={styles.etapaAddRow}>
              <input
                type="text"
                className={styles.etapaInput}
                placeholder="Nome (ex: Proposta Enviada)"
                value={nome}
                onChange={e => setNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEtapa()}
              />
              <input
                type="color"
                className={styles.etapaColor}
                value={cor}
                onChange={e => setCor(e.target.value)}
                title="Cor da etapa"
              />
              <button
                className={styles.etapaAddBtn}
                onClick={addEtapa}
                disabled={busy || !nome.trim()}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Lista ───────────────────────────────────────────────────────────────────

function ListView({ leads, etapas, busy, onUpdate, onSelect }: {
  leads:    Lead[]
  etapas:   PipelineEtapa[]
  busy:     string | null
  onUpdate: (id: string, status: string) => void
  onSelect: (lead: Lead) => void
}) {
  const [filter, setFilter] = useState('todos')

  const allCols = [
    { slug: 'novo', nome: 'Novo' },
    ...etapas.map(e => ({ slug: e.slug, nome: e.nome })),
  ]

  const visible  = filter === 'todos' ? leads : leads.filter(l => l.status === filter)
  const countFor = (slug: string) => leads.filter(l => l.status === slug).length

  return (
    <>
      <div className={styles.pipeline}>
        <div
          className={`${styles.pipeCol} ${filter === 'todos' ? styles.pipeColActive : ''}`}
          onClick={() => setFilter('todos')}
        >
          <span className={styles.pipeCount}>{leads.length}</span>
          <span className={styles.pipeLabel}>Todos</span>
        </div>
        {allCols.map(col => (
          <div
            key={col.slug}
            className={`${styles.pipeCol} ${filter === col.slug ? styles.pipeColActive : ''}`}
            onClick={() => setFilter(f => f === col.slug ? 'todos' : col.slug)}
          >
            <span className={styles.pipeCount}>{countFor(col.slug)}</span>
            <span className={styles.pipeLabel}>{col.nome}</span>
          </div>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <p>Nenhum lead {filter !== 'todos' ? 'nesta etapa' : 'ainda'}.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Imóvel</th>
                <th>Origem</th>
                <th>Data</th>
                <th>Etapa</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(lead => (
                <tr key={lead.id} className={styles.tableRow} onClick={() => onSelect(lead)}>
                  <td>
                    <span className={styles.leadNome}>{lead.nome}</span>
                    {lead.email && <span className={styles.leadEmail}>{lead.email}</span>}
                  </td>
                  <td>
                    <a
                      href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.telLink}
                      onClick={e => e.stopPropagation()}
                    >
                      {lead.telefone}
                    </a>
                  </td>
                  <td className={styles.imovelCell}>
                    {lead.imovel_titulo ?? <span className={styles.nenhum}>—</span>}
                  </td>
                  <td><span className={styles.origem}>{ORIGEM_LABELS[lead.origem] ?? lead.origem}</span></td>
                  <td className={styles.data}>{fmt(lead.created_at)}</td>
                  <td>
                    <select
                      className={styles.statusSelect}
                      value={lead.status}
                      disabled={busy === lead.id}
                      onChange={e => { e.stopPropagation(); onUpdate(lead.id, e.target.value) }}
                      onClick={e => e.stopPropagation()}
                    >
                      {allCols.map(col => (
                        <option key={col.slug} value={col.slug}>{col.nome}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function KanbanIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3"  y="3" width="5" height="18" rx="1"/>
      <rect x="10" y="3" width="5" height="12" rx="1"/>
      <rect x="17" y="3" width="5" height="15" rx="1"/>
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  )
}

function TrashSmIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
