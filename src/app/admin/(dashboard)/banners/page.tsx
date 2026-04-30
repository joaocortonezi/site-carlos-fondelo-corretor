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

  const openNew    = () => { setEditing(null); setModalOpen(true) }
  const openEdit   = (b: Banner) => { setEditing(b); setModalOpen(true) }
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
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    eyebrow:                 config?.eyebrow                 ?? 'Corretor de Imóveis · CRECI 000000',
    titulo_1:                config?.titulo_1                ?? 'O imóvel certo',
    titulo_2:                config?.titulo_2                ?? 'para cada',
    titulo_3:                config?.titulo_3                ?? 'história.',
    subtitulo:               config?.subtitulo               ?? 'Atendimento personalizado · Compra, venda e locação',
    intervalo:               config?.intervalo               ?? 5,
    cor_fundo:               config?.cor_fundo               ?? '#000000',
    cor_fundo_opacidade:     config?.cor_fundo_opacidade     ?? 0.55,
    cor_eyebrow:             config?.cor_eyebrow             ?? '',
    cor_titulo_1:            config?.cor_titulo_1            ?? '',
    cor_titulo_2:            config?.cor_titulo_2            ?? '',
    cor_titulo_3:            config?.cor_titulo_3            ?? '',
    cor_subtitulo:           config?.cor_subtitulo           ?? '',
    peso_eyebrow:            config?.peso_eyebrow            ?? 400,
    peso_titulo_1:           config?.peso_titulo_1           ?? 400,
    peso_titulo_2:           config?.peso_titulo_2           ?? 400,
    peso_titulo_3:           config?.peso_titulo_3           ?? 300,
    peso_subtitulo:          config?.peso_subtitulo          ?? 400,
    btn1_texto:              config?.btn1_texto              ?? 'Ver Imóveis',
    btn1_cor_texto:          config?.btn1_cor_texto          ?? '',
    btn1_peso:               config?.btn1_peso               ?? 600,
    btn1_cor_fundo:          config?.btn1_cor_fundo          ?? '',
    btn1_opacidade_fundo:    config?.btn1_opacidade_fundo    ?? 1,
    btn1_cor_contorno:       config?.btn1_cor_contorno       ?? '',
    btn1_opacidade_contorno: config?.btn1_opacidade_contorno ?? 0,
    btn2_texto:              config?.btn2_texto              ?? 'Conheça Carlos →',
    btn2_cor_texto:          config?.btn2_cor_texto          ?? '',
    btn2_peso:               config?.btn2_peso               ?? 600,
    btn2_cor_fundo:          config?.btn2_cor_fundo          ?? '',
    btn2_opacidade_fundo:    config?.btn2_opacidade_fundo    ?? 0,
    btn2_cor_contorno:       config?.btn2_cor_contorno       ?? '',
    btn2_opacidade_contorno: config?.btn2_opacidade_contorno ?? 0,
  })

  const [preview, setPreview] = useState<string | null>(config?.url_imagem ?? null)
  const [file,    setFile]    = useState<File | null>(null)
  const [busy,    setBusy]    = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!config) return
    setForm({
      eyebrow:                 config.eyebrow,
      titulo_1:                config.titulo_1,
      titulo_2:                config.titulo_2,
      titulo_3:                config.titulo_3,
      subtitulo:               config.subtitulo,
      intervalo:               config.intervalo               ?? 5,
      cor_fundo:               config.cor_fundo               ?? '#000000',
      cor_fundo_opacidade:     config.cor_fundo_opacidade     ?? 0.55,
      cor_eyebrow:             config.cor_eyebrow             ?? '',
      cor_titulo_1:            config.cor_titulo_1            ?? '',
      cor_titulo_2:            config.cor_titulo_2            ?? '',
      cor_titulo_3:            config.cor_titulo_3            ?? '',
      cor_subtitulo:           config.cor_subtitulo           ?? '',
      peso_eyebrow:            config.peso_eyebrow            ?? 400,
      peso_titulo_1:           config.peso_titulo_1           ?? 400,
      peso_titulo_2:           config.peso_titulo_2           ?? 400,
      peso_titulo_3:           config.peso_titulo_3           ?? 300,
      peso_subtitulo:          config.peso_subtitulo          ?? 400,
      btn1_texto:              config.btn1_texto              ?? 'Ver Imóveis',
      btn1_cor_texto:          config.btn1_cor_texto          ?? '',
      btn1_peso:               config.btn1_peso               ?? 600,
      btn1_cor_fundo:          config.btn1_cor_fundo          ?? '',
      btn1_opacidade_fundo:    config.btn1_opacidade_fundo    ?? 1,
      btn1_cor_contorno:       config.btn1_cor_contorno       ?? '',
      btn1_opacidade_contorno: config.btn1_opacidade_contorno ?? 0,
      btn2_texto:              config.btn2_texto              ?? 'Conheça Carlos →',
      btn2_cor_texto:          config.btn2_cor_texto          ?? '',
      btn2_peso:               config.btn2_peso               ?? 600,
      btn2_cor_fundo:          config.btn2_cor_fundo          ?? '',
      btn2_opacidade_fundo:    config.btn2_opacidade_fundo    ?? 0,
      btn2_cor_contorno:       config.btn2_cor_contorno       ?? '',
      btn2_opacidade_contorno: config.btn2_opacidade_contorno ?? 0,
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

    const payload = {
      ...form,
      intervalo:               Number(form.intervalo),
      cor_fundo_opacidade:     Number(form.cor_fundo_opacidade),
      peso_eyebrow:            Number(form.peso_eyebrow),
      peso_titulo_1:           Number(form.peso_titulo_1),
      peso_titulo_2:           Number(form.peso_titulo_2),
      peso_titulo_3:           Number(form.peso_titulo_3),
      peso_subtitulo:          Number(form.peso_subtitulo),
      btn1_peso:               Number(form.btn1_peso),
      btn1_opacidade_fundo:    Number(form.btn1_opacidade_fundo),
      btn1_opacidade_contorno: Number(form.btn1_opacidade_contorno),
      btn2_peso:               Number(form.btn2_peso),
      btn2_opacidade_fundo:    Number(form.btn2_opacidade_fundo),
      btn2_opacidade_contorno: Number(form.btn2_opacidade_contorno),
      url_imagem:              url,
      updated_at:              new Date().toISOString(),
    }

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

  const set    = (k: keyof typeof form, v: string)  => setForm(f => ({ ...f, [k]: v }))
  const setNum = (k: keyof typeof form, v: number) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className={styles.heroSection}>
      <div className={styles.heroSectionHeader}>
        <div>
          <h2 className={styles.heroSectionTitle}>Slide 0 — Hero Principal</h2>
          <p className={styles.heroSectionSub}>Imagem de fundo, textos e botões do primeiro slide</p>
        </div>
        <button className={styles.btnSaveHero} onClick={handleSave} disabled={busy}>
          {busy ? 'Salvando…' : saved ? '✓ Salvo' : 'Salvar'}
        </button>
      </div>

      {error && <p className={styles.heroError}>{error}</p>}

      <div className={styles.heroBody}>
        {/* Coluna esquerda — imagem + overlay */}
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

          <div className={styles.bgColorSection}>
            <p className={styles.heroFieldLabel}>Cor de fundo (overlay)</p>
            <div className={styles.bgColorRow}>
              <input
                type="color"
                className={styles.colorPicker}
                value={form.cor_fundo}
                onChange={e => set('cor_fundo', e.target.value)}
                title="Cor do overlay"
              />
              <span className={styles.bgColorHex}>{form.cor_fundo}</span>
              <span className={styles.bgColorSep}>·</span>
              <span className={styles.bgColorLabel}>Opacidade</span>
              <input
                type="range"
                className={styles.opacityRange}
                min={0} max={1} step={0.01}
                value={form.cor_fundo_opacidade}
                onChange={e => setNum('cor_fundo_opacidade', Number(e.target.value))}
              />
              <span className={styles.opacityVal}>{Math.round(Number(form.cor_fundo_opacidade) * 100)}%</span>
            </div>
            <div
              className={styles.bgPreview}
              style={{ background: form.cor_fundo, opacity: form.cor_fundo_opacidade }}
            />
          </div>
        </div>

        {/* Coluna direita — textos, pesos, botões */}
        <div className={styles.heroTextsCol}>
          <p className={styles.heroFieldLabel}>Textos, cores e pesos de fonte</p>

          <TextColorField
            label="Eyebrow (linha pequena)"
            value={form.eyebrow}
            color={form.cor_eyebrow}
            defaultColor="#bc6906"
            placeholder="Ex: Corretor de Imóveis · CRECI 000000"
            weight={form.peso_eyebrow}
            onText={v  => set('eyebrow', v)}
            onColor={v => set('cor_eyebrow', v)}
            onWeight={v => setNum('peso_eyebrow', v)}
          />

          <TextColorField
            label="Título — linha 1"
            value={form.titulo_1}
            color={form.cor_titulo_1}
            defaultColor="#ffffff"
            weight={form.peso_titulo_1}
            onText={v  => set('titulo_1', v)}
            onColor={v => set('cor_titulo_1', v)}
            onWeight={v => setNum('peso_titulo_1', v)}
          />

          <TextColorField
            label="Título — linha 2"
            value={form.titulo_2}
            color={form.cor_titulo_2}
            defaultColor="#ffffff"
            weight={form.peso_titulo_2}
            onText={v  => set('titulo_2', v)}
            onColor={v => set('cor_titulo_2', v)}
            onWeight={v => setNum('peso_titulo_2', v)}
          />

          <TextColorField
            label="Título — linha 3 (itálico)"
            value={form.titulo_3}
            color={form.cor_titulo_3}
            defaultColor="#d4800f"
            weight={form.peso_titulo_3}
            onText={v  => set('titulo_3', v)}
            onColor={v => set('cor_titulo_3', v)}
            onWeight={v => setNum('peso_titulo_3', v)}
          />

          <TextColorField
            label="Subtítulo"
            value={form.subtitulo}
            color={form.cor_subtitulo}
            defaultColor="#7a7265"
            placeholder="Ex: Atendimento personalizado · Compra, venda e locação"
            weight={form.peso_subtitulo}
            onText={v  => set('subtitulo', v)}
            onColor={v => set('cor_subtitulo', v)}
            onWeight={v => setNum('peso_subtitulo', v)}
          />

          <label className={styles.heroLabel}>
            Intervalo entre banners (segundos)
            <div className={styles.heroIntervalRow}>
              <input
                className={styles.heroInput}
                type="number"
                min={2}
                max={30}
                value={form.intervalo}
                onChange={e => setNum('intervalo', Number(e.target.value))}
              />
              <span className={styles.heroIntervalHint}>{form.intervalo}s por slide</span>
            </div>
          </label>

          {/* ── Botões ── */}
          <div className={styles.heroBtnsSection}>
            <p className={styles.heroFieldLabel}>Botões</p>

            <ButtonFields
              label="Botão 1 — Primário"
              texto={form.btn1_texto}
              corTexto={form.btn1_cor_texto}
              defaultCorTexto="#1a1006"
              peso={form.btn1_peso}
              corFundo={form.btn1_cor_fundo}
              opacidadeFundo={form.btn1_opacidade_fundo}
              corContorno={form.btn1_cor_contorno}
              opacidadeContorno={form.btn1_opacidade_contorno}
              onTexto={v  => set('btn1_texto', v)}
              onCorTexto={v => set('btn1_cor_texto', v)}
              onPeso={v => setNum('btn1_peso', v)}
              onCorFundo={v => set('btn1_cor_fundo', v)}
              onOpacidadeFundo={v => setNum('btn1_opacidade_fundo', v)}
              onCorContorno={v => set('btn1_cor_contorno', v)}
              onOpacidadeContorno={v => setNum('btn1_opacidade_contorno', v)}
            />

            <ButtonFields
              label="Botão 2 — Secundário"
              texto={form.btn2_texto}
              corTexto={form.btn2_cor_texto}
              defaultCorTexto="#7a7265"
              peso={form.btn2_peso}
              corFundo={form.btn2_cor_fundo}
              opacidadeFundo={form.btn2_opacidade_fundo}
              corContorno={form.btn2_cor_contorno}
              opacidadeContorno={form.btn2_opacidade_contorno}
              onTexto={v  => set('btn2_texto', v)}
              onCorTexto={v => set('btn2_cor_texto', v)}
              onPeso={v => setNum('btn2_peso', v)}
              onCorFundo={v => set('btn2_cor_fundo', v)}
              onOpacidadeFundo={v => setNum('btn2_opacidade_fundo', v)}
              onCorContorno={v => set('btn2_cor_contorno', v)}
              onOpacidadeContorno={v => setNum('btn2_opacidade_contorno', v)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  banner:    Banner | null
  supabase:  ReturnType<typeof createBrowserClient>
  onClose:   () => void
  onSaved:   (b: Banner) => void
  nextOrdem: number
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

// ─── TextColorField ───────────────────────────────────────────────────────────

interface TextColorFieldProps {
  label:        string
  value:        string
  color:        string
  defaultColor: string
  placeholder?: string
  weight?:      number
  onText:       (v: string) => void
  onColor:      (v: string) => void
  onWeight?:    (v: number) => void
}

function TextColorField({ label, value, color, defaultColor, placeholder, weight, onText, onColor, onWeight }: TextColorFieldProps) {
  return (
    <label className={styles.heroLabel}>
      <div className={styles.heroLabelRow}>
        <span>{label}</span>
        <div className={styles.colorControls}>
          {onWeight !== undefined && (
            <select
              className={styles.weightSelect}
              value={weight ?? 400}
              onChange={e => onWeight(Number(e.target.value))}
              title="Peso da fonte"
            >
              <option value={300}>Light 300</option>
              <option value={400}>Normal 400</option>
              <option value={500}>Medium 500</option>
              <option value={600}>Semi 600</option>
              <option value={700}>Bold 700</option>
              <option value={800}>Extra 800</option>
              <option value={900}>Black 900</option>
            </select>
          )}
          <input
            type="color"
            className={styles.colorPicker}
            value={color || defaultColor}
            onChange={e => onColor(e.target.value)}
            title={color ? color : 'Padrão'}
          />
          {color && (
            <button
              type="button"
              className={styles.colorClear}
              onClick={() => onColor('')}
              title="Restaurar cor padrão"
            >
              ×
            </button>
          )}
          {!color && <span className={styles.colorDefault}>padrão</span>}
        </div>
      </div>
      <input
        className={styles.heroInput}
        value={value}
        onChange={e => onText(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

// ─── ButtonFields ─────────────────────────────────────────────────────────────

interface ButtonFieldsProps {
  label:               string
  texto:               string
  corTexto:            string
  defaultCorTexto:     string
  peso:                number
  corFundo:            string
  opacidadeFundo:      number
  corContorno:         string
  opacidadeContorno:   number
  onTexto:             (v: string) => void
  onCorTexto:          (v: string) => void
  onPeso:              (v: number) => void
  onCorFundo:          (v: string) => void
  onOpacidadeFundo:    (v: number) => void
  onCorContorno:       (v: string) => void
  onOpacidadeContorno: (v: number) => void
}

function ButtonFields({
  label, texto, corTexto, defaultCorTexto, peso,
  corFundo, opacidadeFundo, corContorno, opacidadeContorno,
  onTexto, onCorTexto, onPeso, onCorFundo, onOpacidadeFundo, onCorContorno, onOpacidadeContorno,
}: ButtonFieldsProps) {
  return (
    <div className={styles.btnConfigBlock}>
      <p className={styles.btnConfigLabel}>{label}</p>

      {/* Texto + peso + cor do texto */}
      <label className={styles.heroLabel}>
        <div className={styles.heroLabelRow}>
          <span>Texto do botão</span>
          <div className={styles.colorControls}>
            <select
              className={styles.weightSelect}
              value={peso}
              onChange={e => onPeso(Number(e.target.value))}
              title="Peso da fonte"
            >
              <option value={300}>Light 300</option>
              <option value={400}>Normal 400</option>
              <option value={500}>Medium 500</option>
              <option value={600}>Semi 600</option>
              <option value={700}>Bold 700</option>
              <option value={800}>Extra 800</option>
            </select>
            <input
              type="color"
              className={styles.colorPicker}
              value={corTexto || defaultCorTexto}
              onChange={e => onCorTexto(e.target.value)}
              title={corTexto ? corTexto : 'Padrão'}
            />
            {corTexto && (
              <button type="button" className={styles.colorClear} onClick={() => onCorTexto('')}>×</button>
            )}
            {!corTexto && <span className={styles.colorDefault}>padrão</span>}
          </div>
        </div>
        <input
          className={styles.heroInput}
          value={texto}
          onChange={e => onTexto(e.target.value)}
          placeholder="Ex: Ver Imóveis"
        />
      </label>

      {/* Cor de fundo + opacidade */}
      <div className={styles.btnColorRow}>
        <span className={styles.btnColorLabel}>Fundo</span>
        <input
          type="color"
          className={styles.colorPicker}
          value={corFundo || '#bc6906'}
          onChange={e => onCorFundo(e.target.value)}
        />
        {corFundo ? (
          <>
            <button type="button" className={styles.colorClear} onClick={() => onCorFundo('')}>×</button>
            <input
              type="range"
              className={styles.opacityRange}
              min={0} max={1} step={0.01}
              value={opacidadeFundo}
              onChange={e => onOpacidadeFundo(Number(e.target.value))}
            />
            <span className={styles.opacityVal}>{Math.round(opacidadeFundo * 100)}%</span>
          </>
        ) : (
          <span className={styles.colorDefault}>padrão</span>
        )}
      </div>

      {/* Cor de contorno + opacidade */}
      <div className={styles.btnColorRow}>
        <span className={styles.btnColorLabel}>Contorno</span>
        <input
          type="color"
          className={styles.colorPicker}
          value={corContorno || '#bc6906'}
          onChange={e => onCorContorno(e.target.value)}
        />
        {corContorno ? (
          <>
            <button type="button" className={styles.colorClear} onClick={() => onCorContorno('')}>×</button>
            <input
              type="range"
              className={styles.opacityRange}
              min={0} max={1} step={0.01}
              value={opacidadeContorno}
              onChange={e => onOpacidadeContorno(Number(e.target.value))}
            />
            <span className={styles.opacityVal}>{Math.round(opacidadeContorno * 100)}%</span>
          </>
        ) : (
          <span className={styles.colorDefault}>padrão</span>
        )}
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
