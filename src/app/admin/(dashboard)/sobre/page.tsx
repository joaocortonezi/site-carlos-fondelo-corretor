'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image                                                   from 'next/image'
import Cropper                                                 from 'react-easy-crop'
import type { Area }                                           from 'react-easy-crop'
import { createBrowserClient }                                 from '@supabase/ssr'
import { PerfilCorretor }                                      from '@/lib/types'
import styles                                                  from './sobre.module.css'

// ── Canvas crop helper ────────────────────────────────────────────────────────
function getCroppedImg(src: string, crop: Area): Promise<{ blob: Blob; url: string }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = crop.width
      canvas.height = crop.height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas não disponível')); return }
      ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Falha ao gerar imagem')); return }
        resolve({ blob, url: URL.createObjectURL(blob) })
      }, 'image/webp', 0.92)
    }
    image.onerror = () => reject(new Error('Falha ao carregar imagem'))
    image.src = src
  })
}



// ── Page ─────────────────────────────────────────────────────────────────────
export default function SobrePage() {
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ), [])

  const [perfil,  setPerfil]  = useState<PerfilCorretor | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('perfil_corretor').select('*').limit(1).maybeSingle()
    if (data) setPerfil(data as PerfilCorretor)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  if (loading) return <p className={styles.loading}>Carregando…</p>

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Sobre mim</h1>
          <p className={styles.sub}>Foto, dados de contato e texto de apresentação</p>
        </div>
      </div>
      <PerfilForm perfil={perfil} supabase={supabase} onSaved={setPerfil} />
    </div>
  )
}

// ── Crop Modal ────────────────────────────────────────────────────────────────
function CropModal({ src, onConfirm, onCancel }: {
  src:       string
  onConfirm: (blob: Blob, url: string) => void
  onCancel:  () => void
}) {
  const [crop,        setCrop]        = useState({ x: 0, y: 0 })
  const [zoom,        setZoom]        = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [busy,        setBusy]        = useState(false)
  const [cropError,   setCropError]   = useState('')

  const handleConfirm = async () => {
    if (!croppedArea) { setCropError('Mova ou dê zoom na foto para iniciar.'); return }
    setBusy(true)
    setCropError('')
    try {
      const { blob, url } = await getCroppedImg(src, croppedArea)
      onConfirm(blob, url)
    } catch (e) {
      setCropError(e instanceof Error ? e.message : 'Erro ao cortar imagem')
      setBusy(false)
    }
  }

  return (
    <div className={styles.cropOverlay} onClick={onCancel}>
      <div className={styles.cropBox} onClick={e => e.stopPropagation()}>
        <div className={styles.cropHeader}>
          <h3 className={styles.cropTitle}>Cortar foto</h3>
          <button className={styles.cropCloseBtn} onClick={onCancel} aria-label="Fechar">×</button>
        </div>

        <div className={styles.cropArea}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, areaPixels) => setCroppedArea(areaPixels)}
          />
        </div>

        <div className={styles.cropControls}>
          <div className={styles.zoomRow}>
            <span className={styles.zoomLabel}>Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className={styles.zoomSlider}
            />
          </div>
          {cropError && <p className={styles.error}>{cropError}</p>}
          <div className={styles.cropActions}>
            <button className={styles.btnCropCancel} onClick={onCancel} disabled={busy}>Cancelar</button>
            <button className={styles.btnCropConfirm} onClick={handleConfirm} disabled={busy}>
              {busy ? 'Processando…' : 'Usar foto cortada'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Perfil Form ───────────────────────────────────────────────────────────────
function PerfilForm({ perfil, supabase, onSaved }: {
  perfil:   PerfilCorretor | null
  supabase: ReturnType<typeof createBrowserClient>
  onSaved:  (p: PerfilCorretor) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    nome:             perfil?.nome             ?? 'Carlos Fondelo',
    creci:            perfil?.creci            ?? '000000',
    email:            perfil?.email            ?? 'contato@corretor.com.br',
    telefone:         perfil?.telefone         ?? '(11) 99999-9000',
    cidade_estado:    perfil?.cidade_estado    ?? 'Cidade · Estado',
    bio_1:            perfil?.bio_1            ?? '',
    bio_2:            perfil?.bio_2            ?? '',
    anos_experiencia: perfil?.anos_experiencia  ?? 10,
    imoveis_vendidos: perfil?.imoveis_vendidos  ?? 200,
    avaliacao_google: perfil?.avaliacao_google  ?? 5.0,
  })

  const [preview,   setPreview]   = useState<string | null>(perfil?.foto_url ?? null)
  const [cropSrc,   setCropSrc]   = useState<string | null>(null)
  const [fileBlob,  setFileBlob]  = useState<Blob | null>(null)
  const [busy,      setBusy]      = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (!perfil) return
    setForm({
      nome:             perfil.nome,
      creci:            perfil.creci,
      email:            perfil.email,
      telefone:         perfil.telefone,
      cidade_estado:    perfil.cidade_estado,
      bio_1:            perfil.bio_1  ?? '',
      bio_2:            perfil.bio_2  ?? '',
      anos_experiencia: perfil.anos_experiencia,
      imoveis_vendidos: perfil.imoveis_vendidos,
      avaliacao_google: perfil.avaliacao_google,
    })
    setPreview(perfil.foto_url ?? null)
  }, [perfil])

  const set = (k: keyof typeof form, v: string | number) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    // Reset input so same file can be re-selected
    e.target.value = ''
    setCropSrc(URL.createObjectURL(f))
  }

  const handleCropConfirm = (blob: Blob, url: string) => {
    setFileBlob(blob)
    setPreview(url)
    setCropSrc(null)
  }

  const handleSave = async () => {
    setBusy(true)
    setError('')
    setSaved(false)

    let foto_url = perfil?.foto_url ?? null

    if (fileBlob) {
      const fileName = 'perfil-foto.webp'
      await supabase.storage.from('banners').remove([fileName])
      const { error: upErr } = await supabase.storage
        .from('banners')
        .upload(fileName, fileBlob, { cacheControl: '3600', upsert: true, contentType: 'image/webp' })
      if (upErr) { setError(upErr.message); setBusy(false); return }
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
      foto_url = `${publicUrl}?t=${Date.now()}`
    }

    const payload = {
      ...form,
      bio_1:            form.bio_1 || null,
      bio_2:            form.bio_2 || null,
      foto_url,
      anos_experiencia: Number(form.anos_experiencia),
      imoveis_vendidos: Number(form.imoveis_vendidos),
      avaliacao_google: Number(form.avaliacao_google),
      updated_at:       new Date().toISOString(),
    }

    let result: PerfilCorretor | null = null
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

    setFileBlob(null)
    onSaved(result!)
    setSaved(true)
    setBusy(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <>
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Perfil do Corretor</h2>
            <p className={styles.cardSub}>Aparece na seção "Sobre mim" e no rodapé do site</p>
          </div>
          <button className={styles.btnSave} onClick={handleSave} disabled={busy}>
            {busy ? 'Salvando…' : saved ? '✓ Salvo' : 'Salvar'}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.body}>
          {/* Foto */}
          <div className={styles.photoCol}>
            <p className={styles.fieldLabel}>Foto de perfil</p>
            <div className={styles.photoUpload} onClick={() => fileRef.current?.click()}>
              {preview ? (
                <div className={styles.photoPreviewWrap}>
                  <Image src={preview} alt="Foto" fill sizes="160px" className={styles.photoPreviewImg} />
                  <div className={styles.photoHover}>Trocar foto</div>
                </div>
              ) : (
                <div className={styles.photoPlaceholder}>
                  <PersonIcon />
                  <p>Clique para selecionar</p>
                  <span>PNG, JPG, WebP</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className={styles.fileInput} onChange={handleFileChange} />
            <p className={styles.photoHint}>Você poderá cortar a foto após selecionar</p>
          </div>

          {/* Campos */}
          <div className={styles.fieldsCol}>
            <div className={styles.row}>
              <label className={styles.label}>
                Nome completo
                <input className={styles.input} value={form.nome} onChange={e => set('nome', e.target.value)} />
              </label>
              <label className={styles.label}>
                CRECI
                <input className={styles.input} value={form.creci} onChange={e => set('creci', e.target.value)} placeholder="000000" />
              </label>
            </div>

            <div className={styles.row}>
              <label className={styles.label}>
                E-mail
                <input className={styles.input} type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </label>
              <label className={styles.label}>
                Telefone / WhatsApp
                <input className={styles.input} value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 99999-9000" />
              </label>
            </div>

            <label className={styles.label}>
              Cidade · Estado (exibido no rodapé)
              <input className={styles.input} value={form.cidade_estado} onChange={e => set('cidade_estado', e.target.value)} placeholder="São Paulo · SP" />
            </label>

            <label className={styles.label}>
              Apresentação — 1º parágrafo
              <textarea className={styles.textarea} rows={3} value={form.bio_1} onChange={e => set('bio_1', e.target.value)} placeholder="Trajetória profissional, especialidades e regiões de atuação…" />
            </label>

            <label className={styles.label}>
              Apresentação — 2º parágrafo
              <textarea className={styles.textarea} rows={3} value={form.bio_2} onChange={e => set('bio_2', e.target.value)} placeholder="Comprometido com transparência e resultados…" />
            </label>

            <div className={styles.row}>
              <label className={styles.label}>
                Anos de experiência
                <input className={styles.input} type="number" min={0} value={form.anos_experiencia} onChange={e => set('anos_experiencia', e.target.value)} />
              </label>
              <label className={styles.label}>
                Imóveis vendidos
                <input className={styles.input} type="number" min={0} value={form.imoveis_vendidos} onChange={e => set('imoveis_vendidos', e.target.value)} />
              </label>
              <label className={styles.label}>
                Avaliação Google (estrelas)
                <div className={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.starBtn} ${Number(form.avaliacao_google) >= n ? styles.starActive : ''}`}
                      onClick={() => set('avaliacao_google', n)}
                      aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                    >★</button>
                  ))}
                  <span className={styles.starsValue}>{Number(form.avaliacao_google).toFixed(1)}</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function PersonIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
