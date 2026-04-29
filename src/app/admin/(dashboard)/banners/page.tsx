'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image                                                   from 'next/image'
import { createBrowserClient }                                 from '@supabase/ssr'
import { Banner, HeroConfig }                                  from '@/lib/types'
import styles                                                  from './banners.module.css'

export default function BannersPage() {
  const [banners,    setBanners]    = useState<Banner[]>([])
  const [heroConfig, setHeroConfig] = useState<HeroConfig | null>(null)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editing,    setEditing]    = useState<Banner | null>(null)
  const [busy,       setBusy]       = useState<string | null>(null)

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

  const toggleAtivo = async (banner: Banner) => {
    setBusy(banner.id)
    await supabase.from('banners').update({ ativo: !banner.ativo }).eq('id', banner.id)
    setBanners(b => b.map(x => x.id === banner.id ? { ...x, ativo: !x.ativo } : x))
    setBusy(null)
  }

  const deleteBanner = async (banner: Banner) => {
    if (!confirm(`Excluir o banner "${banner.titulo ?? 'sem título'}"?`)) return
    setBusy(banner.id)
    const fileName = banner.url_imagem.split('/').pop()
    if (fileName) await supabase.storage.from('banners').remove([fileName])
    await supabase.from('banners').delete().eq('id', banner.id)
    setBanners(b => b.filter(x => x.id !== banner.id))
    setBusy(null)
  }

  const openNew   = () => { setEditing(null); setModalOpen(true) }
  const openEdit  = (b: Banner) => { setEditing(b); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const onSaved = (saved: Banner) => {
    setBanners(prev => {
      const idx = prev.findIndex(x => x.id === saved.id)
      return idx >= 0
        ? prev.map(x => x.id === saved.id ? saved : x)
        : [...prev, saved]
    })
    closeModal()
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Banners</h1>
          <p className={styles.count}>{banners.length} banner{banners.length !== 1 ? 's' : ''} cadastrado{banners.length !== 1 ? 's' : ''}</p>
        </div>
        <button className={styles.btnNew} onClick={openNew}>+ Novo Banner</button>
      </div>

      {/* ── Hero Principal ── */}
      <HeroConfigSection
        config={heroConfig}
        supabase={supabase}
        onSaved={setHeroConfig}
      />

      {banners.length === 0 ? (
        <div className={styles.empty}>
          <p>Nenhum banner cadastrado ainda.</p>
          <button className={styles.btnNewEmpty} onClick={openNew}>Adicionar primeiro banner</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {banners.map(b => (
            <div key={b.id} className={`${styles.card} ${!b.ativo ? styles.cardInativo : ''}`}>
              <div className={styles.cardThumb}>
                <Image
                  src={b.url_imagem}
                  alt={b.titulo ?? 'Banner'}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className={styles.cardImg}
                />
                {!b.ativo && <div className={styles.inativoOverlay}>Inativo</div>}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardInfo}>
                  <p className={styles.cardTitulo}>{b.titulo ?? <span className={styles.sem}>Sem título</span>}</p>
                  {b.subtitulo && <p className={styles.cardSub}>{b.subtitulo}</p>}
                  <p className={styles.cardOrdem}>Ordem: {b.ordem}</p>
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={`${styles.btnToggle} ${b.ativo ? styles.btnToggleOn : styles.btnToggleOff}`}
                    onClick={() => toggleAtivo(b)}
                    disabled={busy === b.id}
                  >
                    {b.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                  <button className={styles.btnEdit} onClick={() => openEdit(b)} disabled={busy === b.id}>
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

      {modalOpen && (
        <BannerModal
          banner={editing}
          supabase={supabase}
          onClose={closeModal}
          onSaved={onSaved}
          nextOrdem={banners.length}
        />
      )}
    </div>
  )
}

// ─── Hero Config Section ──────────────────────────────────────────────────────

function HeroConfigSection({ config, supabase, onSaved }: {
  config:   HeroConfig | null
  supabase: ReturnType<typeof createBrowserClient>
  onSaved:  (c: HeroConfig) => void
}) {
  const fileRef  = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    eyebrow:   config?.eyebrow   ?? 'Corretor de Imóveis · CRECI 000000',
    titulo_1:  config?.titulo_1  ?? 'O imóvel certo',
    titulo_2:  config?.titulo_2  ?? 'para cada',
    titulo_3:  config?.titulo_3  ?? 'história.',
    subtitulo: config?.subtitulo ?? 'Atendimento personalizado · Compra, venda e locação',
    intervalo: config?.intervalo ?? 5,
  })
  const [preview,  setPreview]  = useState<string | null>(config?.url_imagem ?? null)
  const [file,     setFile]     = useState<File | null>(null)
  const [busy,     setBusy]     = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')

  // Sync form se o config carregar depois
  useEffect(() => {
    if (!config) return
    setForm({
      eyebrow:   config.eyebrow,
      titulo_1:  config.titulo_1,
      titulo_2:  config.titulo_2,
      titulo_3:  config.titulo_3,
      subtitulo: config.subtitulo,
      intervalo: config.intervalo ?? 5,
    })
    setPreview(config.url_imagem ?? null)
  }, [config])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSave = async () => {
    setBusy(true)
    setError('')
    setSaved(false)

    let url = config?.url_imagem ?? null

    if (file) {
      const ext      = file.name.split('.').pop() ?? 'jpg'
      const fileName = `hero-principal.${ext}`
      await supabase.storage.from('banners').remove([fileName])
      const { error: upErr } = await supabase.storage
        .from('banners')
        .upload(fileName, file, { cacheControl: '3600', upsert: true })
      if (upErr) { setError(upErr.message); setBusy(false); return }
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
      url = `${publicUrl}?t=${Date.now()}`
    }

    const payload = { ...form, intervalo: Number(form.intervalo), url_imagem: url, updated_at: new Date().toISOString() }

    let result: HeroConfig | null = null
    if (config) {
      const { data, error: err } = await supabase
        .from('hero_config').update(payload).eq('id', config.id).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      result = data as HeroConfig
    } else {
      const { data, error: err } = await supabase
        .from('hero_config').insert(payload).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      result = data as HeroConfig
    }

    setFile(null)
    onSaved(result!)
    setSaved(true)
    setBusy(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className={styles.heroSection}>
      <div className={styles.heroSectionHeader}>
        <div>
          <h2 className={styles.heroSectionTitle}>Slide 0 — Hero Principal</h2>
          <p className={styles.heroSectionSub}>Imagem de fundo e textos do primeiro slide</p>
        </div>
        <button className={styles.btnSaveHero} onClick={handleSave} disabled={busy}>
          {busy ? 'Salvando…' : saved ? '✓ Salvo' : 'Salvar'}
        </button>
      </div>

      {error && <p className={styles.heroError}>{error}</p>}

      <div className={styles.heroBody}>
        {/* Imagem */}
        <div className={styles.heroImgCol}>
          <p className={styles.heroFieldLabel}>Imagem de fundo</p>
          <div className={styles.heroUpload} onClick={() => fileRef.current?.click()}>
            {preview ? (
              <div className={styles.heroPreviewWrap}>
                <Image src={preview} alt="Hero" fill sizes="320px" className={styles.heroPreviewImg} />
                <div className={styles.heroPreviewHover}>Trocar imagem</div>
              </div>
            ) : (
              <div className={styles.heroUploadPlaceholder}>
                <UploadIcon />
                <p>Clique para selecionar</p>
                <span>PNG, JPG, WebP</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className={styles.fileInput} onChange={handleFile} />
          <p className={styles.heroHint}>Se vazio, usa a imagem padrão do servidor</p>
        </div>

        {/* Textos */}
        <div className={styles.heroTextsCol}>
          <p className={styles.heroFieldLabel}>Textos</p>

          <label className={styles.heroLabel}>
            Eyebrow (linha pequena)
            <input
              className={styles.heroInput}
              value={form.eyebrow}
              onChange={e => set('eyebrow', e.target.value)}
              placeholder="Ex: Corretor de Imóveis · CRECI 000000"
            />
          </label>

          <label className={styles.heroLabel}>
            Título — linha 1
            <input
              className={styles.heroInput}
              value={form.titulo_1}
              onChange={e => set('titulo_1', e.target.value)}
            />
          </label>

          <label className={styles.heroLabel}>
            Título — linha 2
            <input
              className={styles.heroInput}
              value={form.titulo_2}
              onChange={e => set('titulo_2', e.target.value)}
            />
          </label>

          <label className={styles.heroLabel}>
            Título — linha 3 (itálico dourado)
            <input
              className={styles.heroInput}
              value={form.titulo_3}
              onChange={e => set('titulo_3', e.target.value)}
            />
          </label>

          <label className={styles.heroLabel}>
            Subtítulo
            <input
              className={styles.heroInput}
              value={form.subtitulo}
              onChange={e => set('subtitulo', e.target.value)}
              placeholder="Ex: Atendimento personalizado · Compra, venda e locação"
            />
          </label>

          <label className={styles.heroLabel}>
            Intervalo entre banners (segundos)
            <div className={styles.heroIntervalRow}>
              <input
                className={styles.heroInput}
                type="number"
                min={2}
                max={30}
                value={form.intervalo}
                onChange={e => setForm(f => ({ ...f, intervalo: Number(e.target.value) }))}
              />
              <span className={styles.heroIntervalHint}>{form.intervalo}s por slide</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  banner:     Banner | null
  supabase:   ReturnType<typeof createBrowserClient>
  onClose:    () => void
  onSaved:    (b: Banner) => void
  nextOrdem:  number
}

function BannerModal({ banner, supabase, onClose, onSaved, nextOrdem }: ModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [titulo,    setTitulo]    = useState(banner?.titulo    ?? '')
  const [subtitulo, setSubtitulo] = useState(banner?.subtitulo ?? '')
  const [ordem,     setOrdem]     = useState(banner?.ordem     ?? nextOrdem)
  const [preview,   setPreview]   = useState<string | null>(banner?.url_imagem ?? null)
  const [file,      setFile]      = useState<File | null>(null)
  const [busy,      setBusy]      = useState(false)
  const [error,     setError]     = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSave = async () => {
    if (!preview && !file) { setError('Selecione uma imagem.'); return }
    setBusy(true)
    setError('')

    let url = banner?.url_imagem ?? ''

    if (file) {
      const ext      = file.name.split('.').pop() ?? 'png'
      const fileName = `${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('banners')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (upErr) { setError(upErr.message); setBusy(false); return }
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
      url = publicUrl
    }

    const payload = {
      url_imagem: url,
      titulo:     titulo || null,
      subtitulo:  subtitulo || null,
      ordem,
      updated_at: new Date().toISOString(),
    }

    if (banner) {
      const { data, error: err } = await supabase
        .from('banners').update(payload).eq('id', banner.id).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      onSaved(data as Banner)
    } else {
      const { data, error: err } = await supabase
        .from('banners').insert({ ...payload, ativo: true }).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      onSaved(data as Banner)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{banner ? 'Editar Banner' : 'Novo Banner'}</h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {error && <p className={styles.error}>{error}</p>}

          {/* Image */}
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
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={handleFile}
          />

          {/* Fields */}
          <div className={styles.fields}>
            <label className={styles.label}>
              Título
              <input
                className={styles.input}
                placeholder="Ex: Imóveis exclusivos em Bairro"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Subtítulo
              <input
                className={styles.input}
                placeholder="Texto secundário (opcional)"
                value={subtitulo}
                onChange={e => setSubtitulo(e.target.value)}
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
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose} disabled={busy}>Cancelar</button>
          <button className={styles.btnSave}   onClick={handleSave} disabled={busy}>
            {busy ? 'Salvando…' : 'Salvar Banner'}
          </button>
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
