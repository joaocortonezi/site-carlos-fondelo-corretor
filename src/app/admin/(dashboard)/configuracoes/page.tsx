'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image                                         from 'next/image'
import { createBrowserClient }                       from '@supabase/ssr'
import styles                                        from './configuracoes.module.css'

// ─── Helpers de marca d'água em batch ────────────────────────────────────────

/** Extrai bucket e path interno a partir de uma URL pública do Supabase Storage. */
function extractStoragePath(url: string): { bucket: string; path: string } | null {
  // formato: https://<host>/storage/v1/object/public/<bucket>/<path>?<query>
  const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+?)(?:\?|$)/)
  if (!m) return null
  return { bucket: m[1], path: decodeURIComponent(m[2]) }
}

/** Carrega uma URL como HTMLImageElement (com CORS anonymous). */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`falha ao carregar ${src}`))
    img.src = src
  })
}

/**
 * Baixa a foto, redesenha em canvas aplicando a watermark,
 * exporta como WebP com a MESMA lógica do compressImage do ImovelForm.
 */
async function rewatermarkFoto(
  fotoUrl: string,
  watermarkImg: HTMLImageElement,
): Promise<Blob> {
  const img = await loadImage(fotoUrl)
  const canvas = document.createElement('canvas')
  canvas.width  = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const wmW    = Math.round(canvas.width * 0.28)
  const wmH    = Math.round((watermarkImg.naturalHeight / watermarkImg.naturalWidth) * wmW)
  const margin = Math.round(canvas.width * 0.02)
  ctx.globalAlpha = 0.72
  ctx.drawImage(watermarkImg, canvas.width - wmW - margin, canvas.height - wmH - margin, wmW, wmH)
  ctx.globalAlpha = 1

  return new Promise<Blob>((res, rej) => {
    canvas.toBlob(b => b ? res(b) : rej(new Error('canvas.toBlob retornou null')), 'image/webp', 0.82)
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null)
  const [pendingFile,  setPendingFile]  = useState<File | null>(null)
  const [preview,      setPreview]      = useState<string | null>(null)
  const [uploading,    setUploading]    = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [error,        setError]        = useState('')

  // ── Reaplicação em fotos existentes ──
  const [pendingCount,  setPendingCount]  = useState<number | null>(null)
  const [applying,      setApplying]      = useState(false)
  const [applyProgress, setApplyProgress] = useState({ done: 0, total: 0 })
  const [applyMessage,  setApplyMessage]  = useState('')
  const [applyError,    setApplyError]    = useState('')

  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Carrega URL da watermark
  useEffect(() => {
    supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'watermark_url')
      .single()
      .then(({ data }) => {
        if (data?.valor) setWatermarkUrl(data.valor)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Conta fotos que precisam reprocessar (sem watermark OU com watermark antiga)
  const refreshPendingCount = useCallback(async () => {
    if (!watermarkUrl) { setPendingCount(null); return }
    const { count } = await supabase
      .from('fotos_imoveis')
      .select('id', { count: 'exact', head: true })
      .or(`watermark_url_aplicada.is.null,watermark_url_aplicada.neq.${watermarkUrl}`)
    setPendingCount(count ?? 0)
  }, [supabase, watermarkUrl])

  useEffect(() => { refreshPendingCount() }, [refreshPendingCount])

  // ── Handlers da watermark em si ──────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!pendingFile && !watermarkUrl) return
    setUploading(true); setError(''); setSaved(false)

    let finalUrl = watermarkUrl

    if (pendingFile) {
      const path = `watermark/logo.${pendingFile.name.split('.').pop()}`
      const { data, error: upErr } = await supabase.storage
        .from('imoveis')
        .upload(path, pendingFile, { upsert: true, contentType: pendingFile.type })
      if (upErr || !data) {
        setError('Erro ao fazer upload da imagem.')
        setUploading(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('imoveis').getPublicUrl(data.path)
      finalUrl = `${publicUrl}?t=${Date.now()}`
    }

    const { error: dbErr } = await supabase
      .from('configuracoes')
      .upsert({ chave: 'watermark_url', valor: finalUrl, updated_at: new Date().toISOString() })

    if (dbErr) {
      setError('Erro ao salvar configuração.')
    } else {
      setWatermarkUrl(finalUrl)
      setPendingFile(null)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setUploading(false)
  }

  const handleRemove = async () => {
    if (!confirm('Remover marca d\'água? As novas fotos não terão marca d\'água.')) return
    await supabase
      .from('configuracoes')
      .upsert({ chave: 'watermark_url', valor: null, updated_at: new Date().toISOString() })
    setWatermarkUrl(null)
    setPendingFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Aplicar marca d'água nas fotos existentes ─────────────────────────────
  const handleApplyToExisting = async () => {
    if (!watermarkUrl || !pendingCount) return
    const ok = confirm(
      `Aplicar marca d'água em ${pendingCount} foto${pendingCount > 1 ? 's' : ''} existente${pendingCount > 1 ? 's' : ''}?\n\n` +
      'Isso vai baixar cada foto, aplicar a marca d\'água atual e regravar no Storage.\n' +
      'Pode levar alguns minutos. Não feche esta aba durante o processamento.'
    )
    if (!ok) return

    setApplying(true); setApplyError(''); setApplyMessage('')
    setApplyProgress({ done: 0, total: pendingCount })

    // 1) Carrega a imagem da watermark (uma vez só)
    let watermarkImg: HTMLImageElement
    try {
      watermarkImg = await loadImage(watermarkUrl)
    } catch {
      setApplyError('Não foi possível carregar a imagem da marca d\'água. Recarregue a página.')
      setApplying(false)
      return
    }

    // 2) Busca fotos a processar
    const { data: fotos, error: selErr } = await supabase
      .from('fotos_imoveis')
      .select('id, url')
      .or(`watermark_url_aplicada.is.null,watermark_url_aplicada.neq.${watermarkUrl}`)
    if (selErr || !fotos) {
      setApplyError('Erro ao buscar fotos.')
      setApplying(false)
      return
    }

    // 3) Processa uma a uma (sequencial pra não estourar memória / CDN)
    let processed = 0
    let failed   = 0
    for (const foto of fotos) {
      try {
        const parsed = extractStoragePath(foto.url)
        if (!parsed) throw new Error('URL não reconhecida')

        const blob = await rewatermarkFoto(foto.url, watermarkImg)

        const { error: upErr } = await supabase.storage
          .from(parsed.bucket)
          .upload(parsed.path, blob, { upsert: true, contentType: 'image/webp' })
        if (upErr) throw upErr

        const { data: { publicUrl } } = supabase.storage.from(parsed.bucket).getPublicUrl(parsed.path)
        const newUrl = `${publicUrl}?t=${Date.now()}`

        const { error: dbErr } = await supabase
          .from('fotos_imoveis')
          .update({ url: newUrl, watermark_url_aplicada: watermarkUrl })
          .eq('id', foto.id)
        if (dbErr) throw dbErr

        processed++
      } catch (e) {
        console.error('Falha em foto', foto.id, e)
        failed++
      }
      setApplyProgress({ done: processed + failed, total: fotos.length })
    }

    if (failed === 0) {
      setApplyMessage(`Pronto! ${processed} foto${processed > 1 ? 's' : ''} processada${processed > 1 ? 's' : ''}.`)
    } else {
      setApplyError(`${processed} processada${processed > 1 ? 's' : ''}, ${failed} falhou. Veja console pra detalhes.`)
    }
    setApplying(false)
    refreshPendingCount()
  }

  const current = preview ?? watermarkUrl

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Configurações</h1>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Marca d'água nas fotos</h2>
        <p className={styles.cardDesc}>
          Toda foto de imóvel enviada pelo admin terá esta imagem aplicada automaticamente
          no canto inferior direito. Use uma PNG com fundo transparente (logo, por exemplo).
        </p>

        <div className={styles.preview}>
          {current ? (
            <div className={styles.previewImg}>
              <Image
                src={current}
                alt="Marca d'água"
                fill
                className={styles.img}
                sizes="200px"
                unoptimized
              />
            </div>
          ) : (
            <div className={styles.previewEmpty}>
              <span>Sem marca d'água</span>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.btnUpload} onClick={() => fileRef.current?.click()}>
            {current ? 'Trocar imagem' : '+ Escolher imagem'}
          </button>
          {current && (
            <button className={styles.btnRemove} onClick={handleRemove}>
              Remover
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/webp,image/svg+xml"
          className={styles.fileInput}
          onChange={handleFile}
        />

        <p className={styles.hint}>PNG ou WebP com fundo transparente · recomendado</p>

        {error && <p className={styles.error}>{error}</p>}
        {saved && <p className={styles.success}>Salvo com sucesso!</p>}

        <button
          className={styles.btnSave}
          onClick={handleSave}
          disabled={uploading || !pendingFile}
        >
          {uploading ? 'Salvando…' : 'Salvar configurações'}
        </button>
      </section>

      {/* ── Aplicar nas fotos existentes ─────────────────────────────────── */}
      {watermarkUrl && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Aplicar nas fotos existentes</h2>
          <p className={styles.cardDesc}>
            Fotos antigas (subidas antes da marca d'água ou com uma versão diferente)
            não recebem watermark automaticamente. Use o botão abaixo pra processar
            todas de uma vez.
          </p>

          {pendingCount === null ? (
            <p className={styles.hint}>Verificando fotos…</p>
          ) : pendingCount === 0 ? (
            <p className={styles.success} style={{ marginTop: 0 }}>
              ✓ Todas as fotos já têm a marca d'água atual.
            </p>
          ) : (
            <p className={styles.hint} style={{ marginBottom: '0.8rem' }}>
              {pendingCount} foto{pendingCount > 1 ? 's' : ''} sem a marca d'água atual.
            </p>
          )}

          {applying && (
            <p className={styles.hint} style={{ marginBottom: '0.8rem' }}>
              Processando… {applyProgress.done} / {applyProgress.total}
            </p>
          )}

          {applyMessage && <p className={styles.success}>{applyMessage}</p>}
          {applyError   && <p className={styles.error}>{applyError}</p>}

          <button
            className={styles.btnSave}
            onClick={handleApplyToExisting}
            disabled={applying || !pendingCount}
          >
            {applying
              ? `Processando ${applyProgress.done}/${applyProgress.total}…`
              : `Aplicar em ${pendingCount ?? 0} foto${(pendingCount ?? 0) === 1 ? '' : 's'}`}
          </button>
        </section>
      )}
    </div>
  )
}
