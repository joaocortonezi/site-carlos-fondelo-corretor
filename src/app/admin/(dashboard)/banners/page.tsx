'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image                                                   from 'next/image'
import { createBrowserClient }                                 from '@supabase/ssr'
import { Banner, HeroConfig }                                  from '@/lib/types'
import HeroEditor                                              from './HeroEditor'
import BannerEditavelModal                                     from './BannerEditavelModal'
import styles                                                  from './banners.module.css'

export default function BannersPage() {
  const [banners,    setBanners]    = useState<Banner[]>([])
  const [heroConfig, setHeroConfig] = useState<HeroConfig | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [modalPng,     setModalPng]     = useState(false)
  const [editingPng,   setEditingPng]   = useState<Banner | null>(null)
  const [modalEditavel, setModalEditavel] = useState(false)
  const [editingEditavel, setEditingEditavel] = useState<Banner | null>(null)
  const [busy,       setBusy]       = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ), [])

  const fetchBanners = useCallback(async () => {
    const [{ data: bannersData }, { data: heroData }] = await Promise.all([
      supabase.from('banners').select('*').order('ordem', { ascending: true }),
      supabase.from('hero_config').select('*').limit(1).single(),
    ])
    setBanners(bannersData ?? [])
    if (heroData) setHeroConfig(heroData as HeroConfig)
  }, [supabase])

  useEffect(() => { fetchBanners() }, [fetchBanners])

  /* Fecha o dropdown ao clicar fora */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleAtivo = async (banner: Banner) => {
    setBusy(banner.id)
    await supabase.from('banners').update({ ativo: !banner.ativo }).eq('id', banner.id)
    setBanners(b => b.map(x => x.id === banner.id ? { ...x, ativo: !x.ativo } : x))
    setBusy(null)
  }

  const deleteBanner = async (banner: Banner) => {
    if (!confirm(`Excluir o banner "${banner.titulo ?? 'sem título'}"?`)) return
    setBusy(banner.id)
    if (banner.url_imagem) {
      const fileName = banner.url_imagem.split('/').pop()?.split('?')[0]
      if (fileName) await supabase.storage.from('banners').remove([fileName])
    }
    await supabase.from('banners').delete().eq('id', banner.id)
    setBanners(b => b.filter(x => x.id !== banner.id))
    setBusy(null)
  }

  const openNewPng = () => {
    setEditingPng(null)
    setModalPng(true)
    setDropdownOpen(false)
  }
  const openNewEditavel = () => {
    setEditingEditavel(null)
    setModalEditavel(true)
    setDropdownOpen(false)
  }
  const openEditBanner = (b: Banner) => {
    if (b.tipo === 'editavel') {
      setEditingEditavel(b)
      setModalEditavel(true)
    } else {
      setEditingPng(b)
      setModalPng(true)
    }
  }

  const onSavedPng = (saved: Banner) => {
    setBanners(prev => {
      const idx = prev.findIndex(x => x.id === saved.id)
      return idx >= 0
        ? prev.map(x => x.id === saved.id ? saved : x)
        : [...prev, saved]
    })
    setModalPng(false)
    setEditingPng(null)
  }

  const onSavedEditavel = (saved: Banner) => {
    setBanners(prev => {
      const idx = prev.findIndex(x => x.id === saved.id)
      return idx >= 0
        ? prev.map(x => x.id === saved.id ? saved : x)
        : [...prev, saved]
    })
    setModalEditavel(false)
    setEditingEditavel(null)
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Banners</h1>
          <p className={styles.count}>{banners.length} banner{banners.length !== 1 ? 's' : ''} cadastrado{banners.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Botão com dropdown de tipo */}
        <div className={styles.btnNewGroup} ref={dropdownRef}>
          <button className={styles.btnNew} onClick={() => setDropdownOpen(o => !o)}>
            + Novo Banner ▾
          </button>
          {dropdownOpen && (
            <div className={styles.btnNewDropdown}>
              <button className={styles.btnNewDropdownItem} onClick={openNewPng}>
                <span className={styles.btnNewDropdownTitle}>Banner PNG</span>
                <span className={styles.btnNewDropdownSub}>Upload de imagem com overlay fixo</span>
              </button>
              <button className={styles.btnNewDropdownItem} onClick={openNewEditavel}>
                <span className={styles.btnNewDropdownTitle}>Banner Editável</span>
                <span className={styles.btnNewDropdownSub}>Editor visual com camadas e película</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <HeroEditor
        config={heroConfig}
        supabase={supabase}
        onSaved={setHeroConfig}
      />

      {banners.length === 0 ? (
        <div className={styles.empty}>
          <p>Nenhum banner cadastrado ainda.</p>
          <button className={styles.btnNewEmpty} onClick={openNewPng}>Adicionar primeiro banner</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {banners.map(b => (
            <div key={b.id} className={`${styles.card} ${!b.ativo ? styles.cardInativo : ''}`}>
              <div className={styles.cardThumb}>
                {b.url_imagem ? (
                  <Image
                    src={b.url_imagem}
                    alt={b.titulo ?? 'Banner'}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className={styles.cardImg}
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-4)', fontSize: '0.78rem' }}>
                    Sem imagem de fundo
                  </div>
                )}
                {!b.ativo && <div className={styles.inativoOverlay}>Inativo</div>}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardInfo}>
                  <p className={styles.cardTitulo}>{b.titulo ?? <span className={styles.sem}>Sem título</span>}</p>
                  {b.subtitulo && <p className={styles.cardSub}>{b.subtitulo}</p>}
                  <p className={styles.cardOrdem}>Ordem: {b.ordem}</p>
                  <span className={`${styles.cardTipoBadge} ${b.tipo === 'editavel' ? styles.cardTipoBadgeEditavel : styles.cardTipoBadgePng}`}>
                    {b.tipo === 'editavel' ? '✦ Editável' : 'PNG'}
                  </span>
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={`${styles.btnToggle} ${b.ativo ? styles.btnToggleOn : styles.btnToggleOff}`}
                    onClick={() => toggleAtivo(b)}
                    disabled={busy === b.id}
                  >
                    {b.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                  <button className={styles.btnEdit} onClick={() => openEditBanner(b)} disabled={busy === b.id}>
                    Editar
                  </button>
                  <button className={styles.btnDelete} onClick={() => deleteBanner(b)} disabled={busy === b.id}>
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalPng && (
        <BannerPngModal
          banner={editingPng}
          supabase={supabase}
          onClose={() => { setModalPng(false); setEditingPng(null) }}
          onSaved={onSavedPng}
          nextOrdem={banners.length}
        />
      )}

      {modalEditavel && (
        <BannerEditavelModal
          banner={editingEditavel}
          supabase={supabase}
          onClose={() => { setModalEditavel(false); setEditingEditavel(null) }}
          onSaved={onSavedEditavel}
        />
      )}
    </div>
  )
}

// ─── BannerPngModal ───────────────────────────────────────────────────────────

interface PngModalProps {
  banner:    Banner | null
  supabase:  ReturnType<typeof createBrowserClient>
  onClose:   () => void
  onSaved:   (b: Banner) => void
  nextOrdem: number
}

function BannerPngModal({ banner, supabase, onClose, onSaved, nextOrdem }: PngModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [titulo,    setTitulo]    = useState(banner?.titulo    ?? '')
  const [subtitulo, setSubtitulo] = useState(banner?.subtitulo ?? '')
  const [ordem,     setOrdem]     = useState(banner?.ordem     ?? nextOrdem)
  const [preview,   setPreview]   = useState<string | null>(banner?.url_imagem ?? null)
  const [file,      setFile]      = useState<File | null>(null)
  const [busy,      setBusy]      = useState(false)
  const [error,     setError]     = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setFile(f); setPreview(URL.createObjectURL(f))
  }

  const handleSave = async () => {
    if (!preview && !file) { setError('Selecione uma imagem.'); return }
    setBusy(true); setError('')
    let url = banner?.url_imagem ?? ''

    if (file) {
      const ext = file.name.split('.').pop() ?? 'png'
      const fileName = `${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('banners').upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (upErr) { setError(upErr.message); setBusy(false); return }
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
      url = publicUrl
    }

    const payload = {
      url_imagem: url,
      titulo:     titulo || null,
      subtitulo:  subtitulo || null,
      ordem,
      tipo:       'png' as const,
      updated_at: new Date().toISOString(),
    }

    if (banner) {
      const { data, error: err } = await supabase.from('banners').update(payload).eq('id', banner.id).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      onSaved(data as Banner)
    } else {
      const { data, error: err } = await supabase.from('banners').insert({ ...payload, ativo: true }).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      onSaved(data as Banner)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{banner ? 'Editar Banner PNG' : 'Novo Banner PNG'}</h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.uploadArea} onClick={() => fileRef.current?.click()}>
            {preview ? (
              <div className={styles.previewWrap}>
                <Image src={preview} alt="Preview" fill sizes="500px" className={styles.previewImg} />
                <div className={styles.previewHover}>Trocar imagem</div>
              </div>
            ) : (
              <div className={styles.uploadPlaceholder}>
                <UploadIcon />
                <p>Clique para selecionar imagem</p>
                <span>PNG, JPG, WebP</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className={styles.fileInput} onChange={handleFile} />

          <div className={styles.fields}>
            <label className={styles.label}>
              Título
              <input className={styles.input} placeholder="Ex: Imóveis exclusivos" value={titulo} onChange={e => setTitulo(e.target.value)} />
            </label>
            <label className={styles.label}>
              Subtítulo
              <input className={styles.input} placeholder="Texto secundário (opcional)" value={subtitulo} onChange={e => setSubtitulo(e.target.value)} />
            </label>
            <label className={styles.label}>
              Ordem de exibição
              <input className={styles.input} type="number" min={0} value={ordem} onChange={e => setOrdem(Number(e.target.value))} />
            </label>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose} disabled={busy}>Cancelar</button>
          <button className={styles.btnSave}   onClick={handleSave} disabled={busy}>{busy ? 'Salvando…' : 'Salvar Banner'}</button>
        </div>
      </div>
    </div>
  )
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}
