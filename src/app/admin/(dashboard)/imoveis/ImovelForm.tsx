'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter }                   from 'next/navigation'
import Image                           from 'next/image'
import { createBrowserClient }         from '@supabase/ssr'
import { Imovel, FotoImovel }          from '@/lib/types'
import { generateSlug }                from '@/lib/utils'
import styles                          from './form.module.css'

interface Props { imovel?: Imovel }

const TIPOS       = ['apartamento', 'casa', 'terreno', 'comercial'] as const
const STATUS_LIST = ['disponivel', 'vendido', 'alugado'] as const
const SITUACOES   = [
  { value: 'construcao', label: 'Construção' },
  { value: 'novo',       label: 'Novo' },
  { value: 'planta',     label: 'Planta' },
  { value: 'usado',      label: 'Usado' },
] as const

// Definido fora do componente: declarar dentro causaria remount dos inputs
// a cada keystroke (React vê uma função nova a cada render).
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  )
}

/**
 * Comprime e converte imagem pra WebP (max 1920px no maior lado, qualidade 0.82).
 * NÃO aplica marca d'água — a watermark é renderizada como overlay CSS no site,
 * preservando a imagem original e permitindo ligar/desligar sem reprocessar.
 */
async function compressImage(file: File): Promise<File> {
  const MAX_PX  = 1920
  const QUALITY = 0.82
  return new Promise((resolve) => {
    const img    = new window.Image()
    const objUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objUrl)
      const { naturalWidth: w, naturalHeight: h } = img
      const needsResize = w > MAX_PX || h > MAX_PX
      const ratio   = needsResize ? Math.min(MAX_PX / w, MAX_PX / h) : 1
      const canvas  = document.createElement('canvas')
      canvas.width  = Math.round(w * ratio)
      canvas.height = Math.round(h * ratio)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          const name = file.name.replace(/\.[^.]+$/, '.webp')
          resolve(new File([blob], name, { type: 'image/webp', lastModified: Date.now() }))
        },
        'image/webp',
        QUALITY,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(file) }
    img.src = objUrl
  })
}

export default function ImovelForm({ imovel }: Props) {
  const isEdit = !!imovel
  const router = useRouter()

  const paraVenda   = imovel?.finalidade === 'venda'   || imovel?.finalidade === 'ambos'
  const paraLocacao = imovel?.finalidade === 'aluguel' || imovel?.finalidade === 'ambos'
  const [finalidadeVenda,   setFinalidadeVenda]   = useState(isEdit ? paraVenda   : true)
  const [finalidadeLocacao, setFinalidadeLocacao] = useState(isEdit ? paraLocacao : false)

  const getFinalidade = () => {
    if (finalidadeVenda && finalidadeLocacao) return 'ambos'
    if (finalidadeLocacao) return 'aluguel'
    return 'venda'
  }

  const [form, setForm] = useState({
    titulo:     imovel?.titulo     ?? '',
    subtitulo:  imovel?.subtitulo  ?? '',
    tipo:       imovel?.tipo       ?? 'apartamento',
    status:     imovel?.status     ?? 'disponivel',
    referencia: imovel?.referencia ?? '',
    destaque:    imovel?.destaque    ?? false,
    exclusivo:   imovel?.exclusivo   ?? false,
    alto_padrao: imovel?.alto_padrao ?? false,
    situacao:   imovel?.situacao   ?? '',
    preco:      imovel?.preco      != null ? String(imovel.preco)     : '',
    area:       imovel?.area       != null ? String(imovel.area)      : '',
    area_construida: imovel?.area_construida != null ? String(imovel.area_construida) : '',
    area_terreno:    imovel?.area_terreno    != null ? String(imovel.area_terreno)    : '',
    quartos:    imovel?.quartos    != null ? String(imovel.quartos)   : '0',
    banheiros:  imovel?.banheiros  != null ? String(imovel.banheiros) : '0',
    vagas:      imovel?.vagas      != null ? String(imovel.vagas)     : '0',
    endereco:   imovel?.endereco   ?? '',
    bairro:     imovel?.bairro     ?? '',
    cidade:     imovel?.cidade     ?? '',
    estado:     imovel?.estado     ?? '',
    cep:        imovel?.cep        ?? '',
    descricao:  imovel?.descricao  ?? '',
  })

  const [existingFotos, setExistingFotos] = useState<FotoImovel[]>(
    (imovel?.fotos ?? []).sort((a, b) => a.ordem - b.ordem)
  )
  const [newFiles,    setNewFiles]    = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [deletedIds,  setDeletedIds]  = useState<string[]>([])

  const [existingVideoV, setExistingVideoV] = useState<string | null>(imovel?.video_vertical   ?? null)
  const [existingVideoH, setExistingVideoH] = useState<string | null>(imovel?.video_horizontal ?? null)
  const [newVideoV,      setNewVideoV]      = useState<File | null>(null)
  const [newVideoH,      setNewVideoH]      = useState<File | null>(null)
  const [previewVideoV,  setPreviewVideoV]  = useState<string | null>(null)
  const [previewVideoH,  setPreviewVideoH]  = useState<string | null>(null)
  const [removedVideoV,  setRemovedVideoV]  = useState(false)
  const [removedVideoH,  setRemovedVideoH]  = useState(false)
  const videoVRef = useRef<HTMLInputElement>(null)
  const videoHRef = useRef<HTMLInputElement>(null)

  useEffect(() => () => {
    if (previewVideoV) URL.revokeObjectURL(previewVideoV)
    if (previewVideoH) URL.revokeObjectURL(previewVideoH)
  }, [previewVideoV, previewVideoH])

  const [uploading,     setUploading]     = useState(false)
  const [uploadStatus,  setUploadStatus]  = useState('')
  const [uploadStep,    setUploadStep]    = useState(0)
  const [uploadTotal,   setUploadTotal]   = useState(0)
  const [error,         setError]         = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (isEdit) return
    const gen = async () => {
      const { count } = await supabase
        .from('imoveis')
        .select('*', { count: 'exact', head: true })
      const next = (count ?? 0) + 1
      set('referencia', `CF-${String(next).padStart(4, '0')}`)
    }
    gen()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (field: string, value: string | boolean) =>
    setForm(f => ({ ...f, [field]: value }))

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setNewFiles(f => [...f, ...files])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setNewPreviews(p => [...p, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removeNewFile = (index: number) => {
    setNewFiles(f => f.filter((_, i) => i !== index))
    setNewPreviews(p => p.filter((_, i) => i !== index))
  }

  const removeExistingFoto = (id: string) => {
    setDeletedIds(d => [...d, id])
    setExistingFotos(f => f.filter(foto => foto.id !== id))
  }

  const handleVideoFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    tipo: 'vertical' | 'horizontal',
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    if (tipo === 'vertical') {
      if (previewVideoV) URL.revokeObjectURL(previewVideoV)
      setNewVideoV(file); setPreviewVideoV(url); setExistingVideoV(null); setRemovedVideoV(false)
    } else {
      if (previewVideoH) URL.revokeObjectURL(previewVideoH)
      setNewVideoH(file); setPreviewVideoH(url); setExistingVideoH(null); setRemovedVideoH(false)
    }
    e.target.value = ''
  }

  const removeVideo = (tipo: 'vertical' | 'horizontal') => {
    if (tipo === 'vertical') {
      if (previewVideoV) URL.revokeObjectURL(previewVideoV)
      setNewVideoV(null); setPreviewVideoV(null); setExistingVideoV(null); setRemovedVideoV(true)
    } else {
      if (previewVideoH) URL.revokeObjectURL(previewVideoH)
      setNewVideoH(null); setPreviewVideoH(null); setExistingVideoH(null); setRemovedVideoH(true)
    }
  }

  const uploadVideo = async (
    imovelId: string,
    file: File,
    tipo: 'vertical' | 'horizontal',
  ): Promise<{ url: string } | { error: string }> => {
    const publicId = `carlos-fondelo/${imovelId}/video-${tipo}`

    // Obter assinatura do servidor (mantém o API Secret fora do cliente)
    const sigRes = await fetch('/api/cloudinary-signature', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ public_id: publicId }),
    })
    if (!sigRes.ok) return { error: 'Falha ao gerar assinatura de upload' }
    const { signature, timestamp, api_key, cloud_name } = await sigRes.json()

    // Upload direto ao Cloudinary — sem passar pelo servidor Next.js
    const form = new FormData()
    form.append('file',       file)
    form.append('public_id',  publicId)
    form.append('api_key',    api_key)
    form.append('timestamp',  String(timestamp))
    form.append('signature',  signature)

    const upRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`,
      { method: 'POST', body: form },
    )
    if (!upRes.ok) {
      const err = await upRes.json().catch(() => ({}))
      return { error: err?.error?.message ?? 'Falha no upload do vídeo' }
    }
    const data = await upRes.json()
    return { url: data.secure_url }
  }

  /**
   * Upload de fotos novas. SEMPRE sobe a imagem LIMPA (sem watermark queimada).
   * A marca d'água é aplicada como overlay CSS no site — preserva o original
   * e permite ligar/desligar/trocar a watermark sem reprocessar nada.
   */
  const uploadFotos = async (imovelId: string): Promise<string[]> => {
    const urls: string[] = []
    for (let i = 0; i < newFiles.length; i++) {
      setUploadStatus(`Comprimindo e enviando foto ${i + 1} de ${newFiles.length}…`)
      setUploadStep(i + 1)
      const compressed = await compressImage(newFiles[i])
      const path = `${imovelId}/${Date.now()}-${i}.webp`
      const { data } = await supabase.storage
        .from('imoveis')
        .upload(path, compressed, { upsert: true, contentType: 'image/webp' })
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('imoveis').getPublicUrl(data.path)
        urls.push(publicUrl)
      }
    }
    return urls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setError('')
    setUploadStatus('Salvando dados…')
    setUploadStep(0)
    setUploadTotal(0)

    let imovelId = imovel?.id

    // Slug a partir de título + cidade + referência (referência garante unicidade).
    // Preserva o slug existente em edição se título/cidade não mudaram, para não
    // quebrar URLs já indexadas.
    const baseSlug = generateSlug(form.titulo, form.cidade)
    const refSuffix = (form.referencia || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
    const computedSlug = refSuffix ? `${baseSlug}-${refSuffix}` : baseSlug
    const slug = (isEdit && imovel?.slug && imovel.slug.length > 0)
      ? imovel.slug
      : computedSlug

    // Payload sem vídeos — são tratados separadamente após upload
    const payload = {
      titulo:     form.titulo,
      subtitulo:  form.subtitulo.trim() || null,
      slug,
      tipo:       form.tipo,
      finalidade: getFinalidade(),
      status:     form.status,
      referencia: form.referencia  || null,
      destaque:    form.destaque,
      exclusivo:   form.exclusivo,
      alto_padrao: form.alto_padrao,
      situacao:   form.situacao   || null,
      preco:      form.preco      ? Number(form.preco)     : null,
      area:       form.area       ? Number(form.area)      : null,
      area_construida: form.area_construida ? Number(form.area_construida) : null,
      area_terreno:    form.area_terreno    ? Number(form.area_terreno)    : null,
      quartos:    Number(form.quartos),
      banheiros:  Number(form.banheiros),
      vagas:      Number(form.vagas),
      endereco:   form.endereco   || null,
      bairro:     form.bairro     || null,
      cidade:     form.cidade,
      estado:     form.estado,
      cep:        form.cep        || null,
      descricao:  form.descricao  || null,
    }

    if (isEdit) {
      const { error: upErr } = await supabase
        .from('imoveis').update(payload).eq('id', imovelId!)
      if (upErr) { setError(upErr.message); setUploading(false); return }

      for (const id of deletedIds) {
        await supabase.from('fotos_imoveis').delete().eq('id', id)
      }
    } else {
      const { data, error: insErr } = await supabase
        .from('imoveis')
        .insert({ ...payload, video_vertical: null, video_horizontal: null })
        .select('id').single()
      if (insErr || !data) { setError(insErr?.message ?? 'Erro ao criar.'); setUploading(false); return }
      imovelId = data.id
    }

    // Upload vídeos com o ID real — banco só é atualizado após sucesso
    const videoUpdate: Record<string, string | null> = {}

    if (newVideoV) {
      setUploadStatus('Enviando vídeo vertical…')
      const result = await uploadVideo(imovelId!, newVideoV, 'vertical')
      if ('error' in result) {
        setError(`Vídeo vertical: ${result.error}`)
        setUploading(false)
        return
      }
      videoUpdate.video_vertical = result.url
    } else if (removedVideoV) {
      videoUpdate.video_vertical = null
    }

    if (newVideoH) {
      setUploadStatus('Enviando vídeo horizontal…')
      const result = await uploadVideo(imovelId!, newVideoH, 'horizontal')
      if ('error' in result) {
        setError(`Vídeo horizontal: ${result.error}`)
        setUploading(false)
        return
      }
      videoUpdate.video_horizontal = result.url
    } else if (removedVideoH) {
      videoUpdate.video_horizontal = null
    }

    if (Object.keys(videoUpdate).length > 0) {
      await supabase.from('imoveis').update(videoUpdate).eq('id', imovelId!)
    }

    // Upload fotos (limpas, sem watermark queimada — overlay aplicado via CSS)
    if (newFiles.length > 0) {
      setUploadTotal(newFiles.length)
      const urls = await uploadFotos(imovelId!)
      const ordemBase = existingFotos.length
      const fotoRows = urls.map((url, i) => ({
        imovel_id: imovelId!,
        url,
        ordem: ordemBase + i,
        // Foto subida sem watermark queimada → null. Permite overlay funcionar.
        watermark_url_aplicada: null,
      }))
      await supabase.from('fotos_imoveis').insert(fotoRows)
    }

    router.push('/admin/imoveis')
    router.refresh()
  }

  const progressPct = uploadTotal > 0 ? Math.round((uploadStep / uploadTotal) * 100) : null

  return (
    <form onSubmit={handleSubmit} className={styles.form}>

      {/* Seção: Informações básicas */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Informações básicas</h2>
        <div className={styles.grid2}>
          <Field label="Título *">
            <input className={styles.input} value={form.titulo} onChange={e => set('titulo', e.target.value)} required />
          </Field>
          <Field label={isEdit ? 'Referência' : 'Referência (auto)'}>
            <input
              className={styles.input}
              value={form.referencia}
              onChange={e => set('referencia', e.target.value)}
              readOnly={!isEdit}
              style={!isEdit ? { opacity: 0.7, cursor: 'default' } : undefined}
              placeholder="Gerando…"
            />
          </Field>
        </div>
        <Field label="Breve subtítulo (opcional)">
          <input
            className={styles.input}
            value={form.subtitulo}
            onChange={e => set('subtitulo', e.target.value)}
            maxLength={120}
            placeholder='Ex.: "Próximo ao centro · com vista para o parque"'
          />
        </Field>
        <div className={styles.grid4}>
          <Field label="Tipo *">
            <select className={styles.select} value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Finalidade *">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '0.4rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={finalidadeVenda} onChange={e => setFinalidadeVenda(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
                Para Venda
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={finalidadeLocacao} onChange={e => setFinalidadeLocacao(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
                Para Locação
              </label>
            </div>
          </Field>
          <Field label="Status *">
            <select className={styles.select} value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUS_LIST.map(s => <option key={s} value={s}>{{ disponivel: 'Disponível', vendido: 'Vendido', alugado: 'Alugado' }[s]}</option>)}
            </select>
          </Field>
          <Field label="Situação">
            <select className={styles.select} value={form.situacao} onChange={e => set('situacao', e.target.value)}>
              <option value="">Não informada</option>
              {SITUACOES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
        </div>
        <label className={styles.checkLabel}>
          <input type="checkbox" checked={form.destaque} onChange={e => set('destaque', e.target.checked)} className={styles.checkbox} />
          Marcar como destaque
        </label>
        <label className={styles.checkLabel}>
          <input type="checkbox" checked={form.exclusivo} onChange={e => set('exclusivo', e.target.checked)} className={styles.checkbox} />
          Imóvel exclusivo (captação própria)
        </label>
        <label className={styles.checkLabel}>
          <input type="checkbox" checked={form.alto_padrao} onChange={e => set('alto_padrao', e.target.checked)} className={styles.checkbox} />
          Alto padrão (aparece na seção de alto padrão da home)
        </label>
      </section>

      {/* Seção: Valores */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Valores e detalhes</h2>
        <div className={styles.grid3}>
          <Field label="Preço (R$)">
            <input type="number" className={styles.input} value={form.preco} onChange={e => set('preco', e.target.value)} placeholder="Ex: 350000" min="0" />
          </Field>
          <Field label="Área útil (m²)">
            <input type="number" className={styles.input} value={form.area} onChange={e => set('area', e.target.value)} placeholder="Ex: 75" min="0" />
          </Field>
          <Field label="Área construída (m²)">
            <input type="number" className={styles.input} value={form.area_construida} onChange={e => set('area_construida', e.target.value)} placeholder="Ex: 120" min="0" />
          </Field>
          <Field label="Área do terreno (m²)">
            <input type="number" className={styles.input} value={form.area_terreno} onChange={e => set('area_terreno', e.target.value)} placeholder="Ex: 300" min="0" />
          </Field>
          <Field label="Quartos">
            <input type="number" className={styles.input} value={form.quartos} onChange={e => set('quartos', e.target.value)} min="0" />
          </Field>
          <Field label="Banheiros">
            <input type="number" className={styles.input} value={form.banheiros} onChange={e => set('banheiros', e.target.value)} min="0" />
          </Field>
          <Field label="Vagas">
            <input type="number" className={styles.input} value={form.vagas} onChange={e => set('vagas', e.target.value)} min="0" />
          </Field>
        </div>
      </section>

      {/* Seção: Localização */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Localização</h2>
        <div className={styles.grid2}>
          <Field label="Endereço">
            <input className={styles.input} value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número" />
          </Field>
          <Field label="Bairro">
            <input className={styles.input} value={form.bairro} onChange={e => set('bairro', e.target.value)} />
          </Field>
          <Field label="Cidade *">
            <input className={styles.input} value={form.cidade} onChange={e => set('cidade', e.target.value)} required />
          </Field>
          <Field label="Estado">
            <input className={styles.input} value={form.estado} onChange={e => set('estado', e.target.value)} placeholder="Ex: SC" maxLength={2} />
          </Field>
          <Field label="CEP">
            <input className={styles.input} value={form.cep} onChange={e => set('cep', e.target.value)} placeholder="00000-000" />
          </Field>
        </div>
      </section>

      {/* Seção: Descrição */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Descrição</h2>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          value={form.descricao}
          onChange={e => set('descricao', e.target.value)}
          rows={5}
          placeholder="Descreva o imóvel com detalhes relevantes para o comprador..."
        />
      </section>

      {/* Seção: Fotos */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Fotos</h2>

        <div className={styles.fotosGrid}>
          {existingFotos.map(foto => (
            <div key={foto.id} className={styles.fotoItem}>
              <Image src={foto.url} alt="" fill className={styles.fotoImg} sizes="100px" />
              <button type="button" className={styles.fotoRemove} onClick={() => removeExistingFoto(foto.id)}>×</button>
            </div>
          ))}

          {newPreviews.map((preview, i) => (
            <div key={`new-${i}`} className={`${styles.fotoItem} ${styles.fotoNew}`}>
              <Image src={preview} alt="" fill className={styles.fotoImg} sizes="100px" />
              <button type="button" className={styles.fotoRemove} onClick={() => removeNewFile(i)}>×</button>
            </div>
          ))}

          <button type="button" className={styles.fotoAdd} onClick={() => fileRef.current?.click()}>
            <span>+</span>
            <span>Adicionar</span>
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className={styles.fileInput}
          onChange={handleFiles}
        />
        <p className={styles.fotoHint}>JPG, PNG ou WebP · comprimidas automaticamente para WebP ao salvar</p>
      </section>

      {/* Seção: Vídeos */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Vídeos</h2>
        <div className={styles.videosGrid}>

          <div className={styles.videoSlot}>
            <p className={styles.videoSlotTitle}>Vídeo vertical</p>
            <p className={styles.videoSlotSub}>Reels / Stories · proporção 9:16</p>
            {(previewVideoV ?? existingVideoV) && (
              <video
                src={previewVideoV ?? existingVideoV!}
                className={`${styles.videoPreview} ${styles.videoPreviewVertical}`}
                controls
                preload="metadata"
              />
            )}
            <div className={styles.videoActions}>
              <button type="button" className={styles.videoAdd} onClick={() => videoVRef.current?.click()}>
                {existingVideoV || previewVideoV ? 'Trocar vídeo' : '+ Adicionar vídeo'}
              </button>
              {(existingVideoV || previewVideoV) && (
                <button type="button" className={styles.videoRemove} onClick={() => removeVideo('vertical')}>
                  Remover
                </button>
              )}
            </div>
            <p className={styles.videoHint}>MP4, MOV ou WebM · sem limite de tamanho</p>
          </div>

          <div className={styles.videoSlot}>
            <p className={styles.videoSlotTitle}>Vídeo horizontal</p>
            <p className={styles.videoSlotSub}>Tour do imóvel · proporção 16:9</p>
            {(previewVideoH ?? existingVideoH) && (
              <video
                src={previewVideoH ?? existingVideoH!}
                className={`${styles.videoPreview} ${styles.videoPreviewHorizontal}`}
                controls
                preload="metadata"
              />
            )}
            <div className={styles.videoActions}>
              <button type="button" className={styles.videoAdd} onClick={() => videoHRef.current?.click()}>
                {existingVideoH || previewVideoH ? 'Trocar vídeo' : '+ Adicionar vídeo'}
              </button>
              {(existingVideoH || previewVideoH) && (
                <button type="button" className={styles.videoRemove} onClick={() => removeVideo('horizontal')}>
                  Remover
                </button>
              )}
            </div>
            <p className={styles.videoHint}>MP4, MOV ou WebM · sem limite de tamanho</p>
          </div>

        </div>

        <input ref={videoVRef} type="file" accept="video/mp4,video/quicktime,video/webm" className={styles.fileInput} onChange={e => handleVideoFile(e, 'vertical')} />
        <input ref={videoHRef} type="file" accept="video/mp4,video/quicktime,video/webm" className={styles.fileInput} onChange={e => handleVideoFile(e, 'horizontal')} />
      </section>

      {/* Actions */}
      <div className={styles.formActions}>
        {uploading && (
          <div className={styles.uploadStatus}>
            <span className={styles.spinner} />
            <span className={styles.uploadStatusText}>{uploadStatus}</span>
            {progressPct !== null && (
              <div className={styles.uploadProgressWrap}>
                <div className={styles.uploadProgressBar} style={{ width: `${progressPct}%` }} />
              </div>
            )}
          </div>
        )}
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.uploadButtons}>
          <button type="button" className={styles.btnCancelar} onClick={() => router.push('/admin/imoveis')} disabled={uploading}>
            Cancelar
          </button>
          <button type="submit" className={styles.btnSalvar} disabled={uploading}>
            {uploading ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar imóvel'}
          </button>
        </div>
      </div>
    </form>
  )
}
