'use client'

import { useState, useRef, useEffect } from 'react'
import Image                            from 'next/image'
import { createBrowserClient }          from '@supabase/ssr'
import styles                           from './configuracoes.module.css'

export default function ConfiguracoesPage() {
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null)
  const [preview,      setPreview]      = useState<string | null>(null)
  const [uploading,    setUploading]    = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [error,        setError]        = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    e.target.value = ''
  }

  const handleSave = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file && !watermarkUrl) return
    setUploading(true)
    setError('')
    setSaved(false)

    let finalUrl = watermarkUrl

    if (file || preview) {
      const input = document.querySelector<HTMLInputElement>('input[type=file]')
      const f = input?.files?.[0]
      if (f) {
        const path = `watermark/logo.${f.name.split('.').pop()}`
        const { data, error: upErr } = await supabase.storage
          .from('imoveis')
          .upload(path, f, { upsert: true, contentType: f.type })
        if (upErr || !data) {
          setError('Erro ao fazer upload da imagem.')
          setUploading(false)
          return
        }
        const { data: { publicUrl } } = supabase.storage.from('imoveis').getPublicUrl(data.path)
        finalUrl = publicUrl
      }
    }

    const { error: dbErr } = await supabase
      .from('configuracoes')
      .upsert({ chave: 'watermark_url', valor: finalUrl, updated_at: new Date().toISOString() })

    if (dbErr) {
      setError('Erro ao salvar configuração.')
    } else {
      setWatermarkUrl(finalUrl)
      setPreview(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setUploading(false)
  }

  const handleRemove = async () => {
    if (!confirm('Remover marca d\'água? As novas fotos não terão marca d\'água.')) return
    await supabase.from('configuracoes').upsert({ chave: 'watermark_url', valor: null })
    setWatermarkUrl(null)
    setPreview(null)
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

        {error  && <p className={styles.error}>{error}</p>}
        {saved  && <p className={styles.success}>Salvo com sucesso!</p>}

        <button
          className={styles.btnSave}
          onClick={handleSave}
          disabled={uploading || (!preview && !!watermarkUrl && !preview)}
        >
          {uploading ? 'Salvando…' : 'Salvar configurações'}
        </button>
      </section>
    </div>
  )
}
