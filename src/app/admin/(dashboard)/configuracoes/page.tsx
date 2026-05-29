'use client'

import { useState, useRef, useEffect } from 'react'
import Image                            from 'next/image'
import { createBrowserClient }          from '@supabase/ssr'
import styles                           from './configuracoes.module.css'

export default function ConfiguracoesPage() {
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null)
  const [pendingFile,  setPendingFile]  = useState<File | null>(null)
  const [preview,      setPreview]      = useState<string | null>(null)
  const [uploading,    setUploading]    = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [error,        setError]        = useState('')
  const [bakedCount,   setBakedCount]   = useState<number>(0)
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
    // Conta quantas fotos antigas têm watermark queimada nos pixels — essas
    // não recebem overlay (pra evitar marca duplicada) e só somem se o Carlos
    // re-subir cada uma manualmente.
    supabase
      .from('fotos_imoveis')
      .select('id', { count: 'exact', head: true })
      .not('watermark_url_aplicada', 'is', null)
      .then(({ count }) => setBakedCount(count ?? 0))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    if (!confirm('Remover a marca d\'água?\n\nO overlay para de aparecer nas fotos instantaneamente — sem reprocessar nada. Você pode religar a qualquer momento.')) return
    await supabase
      .from('configuracoes')
      .upsert({ chave: 'watermark_url', valor: null, updated_at: new Date().toISOString() })
    setWatermarkUrl(null)
    setPendingFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const current = preview ?? watermarkUrl

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Configurações</h1>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Marca d'água nas fotos</h2>
        <p className={styles.cardDesc}>
          A marca d'água é aplicada como overlay (sobreposição) nas fotos dos imóveis — não modifica
          o arquivo original. Você pode ligar, desligar ou trocar a logo a qualquer momento sem
          reprocessar nenhuma foto.
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
          {watermarkUrl && (
            <button className={styles.btnRemove} onClick={handleRemove}>
              Remover marca d'água
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

        {bakedCount > 0 && (
          <div style={{
            marginTop:     '1.5rem',
            padding:       '0.9rem 1rem',
            background:    'var(--form-error-bg, #fff7e6)',
            border:        '1px solid var(--form-error-border, #ffd591)',
            borderRadius:  '6px',
            fontSize:      '0.8rem',
            color:         'var(--admin-text-2)',
            lineHeight:    1.5,
          }}>
            <strong>⚠ Atenção:</strong> existem <strong>{bakedCount} foto{bakedCount > 1 ? 's' : ''}</strong> antiga{bakedCount > 1 ? 's' : ''} com
            marca d'água queimada diretamente nos pixels (de uma aplicação anterior).
            Pra essas fotos, o overlay não é aplicado (pra não ficar marca duplicada) e
            ligar/desligar a watermark aqui não afeta elas.
            Pra deixá-las limpas, abra cada imóvel e re-suba as fotos originais.
          </div>
        )}
      </section>
    </div>
  )
}
