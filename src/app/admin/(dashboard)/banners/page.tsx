'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image                                                   from 'next/image'
import { createBrowserClient }                                 from '@supabase/ssr'
import { Banner, HeroConfig, PerfilCorretor }                  from '@/lib/types'
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
  const [perfil,     setPerfil]     = useState<PerfilCorretor | null>(null)
  const [busy,       setBusy]       = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ), [])

  const fetchBanners = useCallback(async () => {
    const [{ data: bannersData }, { data: heroData }, { data: perfilData }] = await Promise.all([
      supabase.from('banners').select('*').order('ordem', { ascending: true }),
      supabase.from('hero_config').select('*').limit(1).single(),
      supabase.from('perfil_corretor').select('*').limit(1).maybeSingle(),
    ])
    setBanners(bannersData ?? [])
    if (heroData)  setHeroConfig(heroData as HeroConfig)
    if (perfilData) setPerfil(perfilData as PerfilCorretor)
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

      <CinemaUploadCard
        perfil={perfil}
        supabase={supabase}
        onSaved={setPerfil}
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
  const fileRefDesktop = useRef<HTMLInputElement>(null)
  const fileRefMobile  = useRef<HTMLInputElement>(null)
  const [titulo,    setTitulo]    = useState(banner?.titulo    ?? '')
  const [subtitulo, setSubtitulo] = useState(banner?.subtitulo ?? '')
  const [ordem,     setOrdem]     = useState(banner?.ordem     ?? nextOrdem)

  // ── Variante desktop (obrigatória) ──
  const [previewDesktop, setPreviewDesktop] = useState<string | null>(banner?.url_imagem ?? null)
  const [fileDesktop,    setFileDesktop]    = useState<File | null>(null)

  // ── Variante mobile (opcional, fallback pra desktop no site) ──
  const [previewMobile, setPreviewMobile] = useState<string | null>(banner?.url_imagem_mobile ?? null)
  const [fileMobile,    setFileMobile]    = useState<File | null>(null)
  const [removeMobile,  setRemoveMobile]  = useState(false)  // marcar pra apagar a mobile existente

  const [busy,  setBusy]  = useState(false)
  const [error, setError] = useState('')

  const handleFileDesktop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setFileDesktop(f); setPreviewDesktop(URL.createObjectURL(f))
  }
  const handleFileMobile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setFileMobile(f); setPreviewMobile(URL.createObjectURL(f))
    setRemoveMobile(false)
  }
  const clearMobile = () => {
    setFileMobile(null); setPreviewMobile(null); setRemoveMobile(true)
    if (fileRefMobile.current) fileRefMobile.current.value = ''
  }

  // Faz upload de um File no bucket `banners` e devolve a public URL.
  const uploadFile = async (f: File, prefix: string): Promise<string | null> => {
    const ext = f.name.split('.').pop() ?? 'png'
    const fileName = `${prefix}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('banners').upload(fileName, f, { cacheControl: '3600', upsert: false })
    if (upErr) { setError(upErr.message); return null }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    return publicUrl
  }

  const handleSave = async () => {
    if (!previewDesktop && !fileDesktop) { setError('Selecione a imagem desktop.'); return }
    setBusy(true); setError('')

    let urlDesktop = banner?.url_imagem ?? ''
    if (fileDesktop) {
      const url = await uploadFile(fileDesktop, 'desktop')
      if (!url) { setBusy(false); return }
      urlDesktop = url
    }

    let urlMobile: string | null = banner?.url_imagem_mobile ?? null
    if (fileMobile) {
      const url = await uploadFile(fileMobile, 'mobile')
      if (!url) { setBusy(false); return }
      urlMobile = url
    } else if (removeMobile) {
      urlMobile = null
    }

    const payload = {
      url_imagem:        urlDesktop,
      url_imagem_mobile: urlMobile,
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

          <div className={styles.variantsGrid}>
            {/* Desktop — obrigatório */}
            <div className={styles.variantBlock}>
              <span className={styles.variantLabel}>Desktop · obrigatório</span>
              <div className={styles.uploadArea} onClick={() => fileRefDesktop.current?.click()}>
                {previewDesktop ? (
                  <div className={styles.previewWrap}>
                    <Image src={previewDesktop} alt="Preview desktop" fill sizes="500px" className={styles.previewImg} />
                    <div className={styles.previewHover}>Trocar imagem</div>
                  </div>
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    <UploadIcon />
                    <p>Clique para selecionar</p>
                    <span>PNG, JPG, WebP · 16:7</span>
                  </div>
                )}
              </div>
              <span className={styles.variantSub}>Aparece em telas ≥ 768px</span>
            </div>

            {/* Mobile — opcional, com fallback */}
            <div className={styles.variantBlock}>
              <span className={styles.variantLabel}>Mobile · opcional</span>
              <div className={`${styles.uploadArea} ${styles.uploadAreaMobile}`} onClick={() => fileRefMobile.current?.click()}>
                {previewMobile ? (
                  <div className={styles.previewWrap}>
                    <Image src={previewMobile} alt="Preview mobile" fill sizes="200px" className={styles.previewImg} />
                    <div className={styles.previewHover}>Trocar imagem</div>
                  </div>
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    <UploadIcon />
                    <p>Imagem retrato</p>
                    <span>9:16 · sem mobile usa o desktop</span>
                  </div>
                )}
              </div>
              {previewMobile && (
                <button type="button" className={styles.variantRemoveBtn} onClick={clearMobile}>
                  Remover mobile
                </button>
              )}
              <span className={styles.variantSub}>Aparece em telas &lt; 768px</span>
            </div>
          </div>

          <input ref={fileRefDesktop} type="file" accept="image/*" className={styles.fileInput} onChange={handleFileDesktop} />
          <input ref={fileRefMobile}  type="file" accept="image/*" className={styles.fileInput} onChange={handleFileMobile} />

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

// ─── CinemaUploadCard ─────────────────────────────────────────────────────────
// Card para upload da foto cinemascope (2.35:1) do corretor.
// A imagem é salva no bucket `banners` e o URL é gravado em `perfil_corretor.foto_cinemascope_url`.
// Se nenhuma imagem for definida, a CinemaSection no site fica oculta.

interface CinemaProps {
  perfil:   PerfilCorretor | null
  supabase: ReturnType<typeof createBrowserClient>
  onSaved:  (p: PerfilCorretor) => void
}

function CinemaUploadCard({ perfil, supabase, onSaved }: CinemaProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(perfil?.foto_cinemascope_url ?? null)
  const [busy,    setBusy]    = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    setPreview(perfil?.foto_cinemascope_url ?? null)
  }, [perfil])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    e.target.value = ''
    setBusy(true); setError('')

    const ext      = f.name.split('.').pop() ?? 'jpg'
    const fileName = `cinemascope.${ext}`
    await supabase.storage.from('banners').remove([fileName])
    const { error: upErr } = await supabase.storage
      .from('banners').upload(fileName, f, { cacheControl: '3600', upsert: true })
    if (upErr) { setError(upErr.message); setBusy(false); return }

    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    const url = `${publicUrl}?t=${Date.now()}`

    const payload = { foto_cinemascope_url: url, updated_at: new Date().toISOString() }
    let result: PerfilCorretor
    if (perfil) {
      const { data, error: err } = await supabase
        .from('perfil_corretor').update(payload).eq('id', perfil.id).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      result = data as PerfilCorretor
    } else {
      const { data, error: err } = await supabase
        .from('perfil_corretor').insert(payload).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      result = data as PerfilCorretor
    }
    setPreview(url)
    onSaved(result)
    setBusy(false)
  }

  const handleRemove = async () => {
    if (!perfil || !confirm('Remover a foto cinemascope?')) return
    setBusy(true)
    await supabase.storage.from('banners').remove(['cinemascope.jpg', 'cinemascope.png', 'cinemascope.webp'])
    const { data, error: err } = await supabase
      .from('perfil_corretor').update({ foto_cinemascope_url: null }).eq('id', perfil.id).select().single()
    if (err) { setError(err.message); setBusy(false); return }
    setPreview(null)
    onSaved(data as PerfilCorretor)
    setBusy(false)
  }

  return (
    <div className={styles.cinemaCard}>
      <div className={styles.cinemaCardHeader}>
        <div>
          <p className={styles.cinemaCardTitle}>Foto Cinemascope</p>
          <p className={styles.cinemaCardSub}>Seção decorativa em proporção 2.35:1 — oculta no site se vazia</p>
        </div>
        {preview && (
          <button className={styles.btnCinemaRemove} onClick={handleRemove} disabled={busy}>
            Remover
          </button>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div
        className={styles.cinemaUpload}
        onClick={() => !busy && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
      >
        {preview ? (
          <div className={styles.cinemaPreviewWrap}>
            <Image src={preview} alt="Cinemascope" fill sizes="100vw" className={styles.cinemaPreviewImg} />
            <div className={styles.cinemaHover}>{busy ? 'Enviando…' : 'Trocar imagem'}</div>
          </div>
        ) : (
          <div className={styles.cinemaPlaceholder}>
            <CinemaIcon />
            <p>{busy ? 'Enviando…' : 'Clique para enviar'}</p>
            <span>JPG, PNG, WebP · proporção livre</span>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className={styles.fileInput} onChange={handleFile} />
    </div>
  )
}

function CinemaIcon() {
  return (
    <svg width="32" height="20" viewBox="0 0 32 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="30" height="18" rx="2"/>
      <line x1="1" y1="5"  x2="31" y2="5"/>
      <line x1="1" y1="15" x2="31" y2="15"/>
    </svg>
  )
}
