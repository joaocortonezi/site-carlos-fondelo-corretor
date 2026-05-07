'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { CaptacaoConfig }      from '@/lib/types'
import styles                  from './captacao.module.css'

const DEFAULTS = {
  eyebrow:        'Para proprietários',
  titulo_linha_1: 'Quer anunciar ou',
  titulo_linha_2: 'alugar seu imóvel?',
  texto_1:        'Faço a administração e gestão completa da venda ou locação do seu imóvel com muita responsabilidade e respeito, zelando e trabalhando para negociá-lo da melhor forma e pelo melhor preço possível.',
  texto_2:        'Do primeiro contato à assinatura do contrato, cuido de cada detalhe para que você tenha tranquilidade e segurança em todo o processo.',
}

export default function CaptacaoPage() {
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ), [])

  const [config,  setConfig]  = useState<CaptacaoConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('captacao_config').select('*').limit(1).maybeSingle()
    if (data) setConfig(data as CaptacaoConfig)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  if (loading) return <p className={styles.loading}>Carregando…</p>

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Captação de imóveis</h1>
        <p className={styles.sub}>Textos da seção &quot;Para proprietários&quot; — chamada para anunciar ou alugar imóvel</p>
      </div>
      <CaptacaoForm config={config} supabase={supabase} onSaved={setConfig} />
    </div>
  )
}

function CaptacaoForm({ config, supabase, onSaved }: {
  config:   CaptacaoConfig | null
  supabase: ReturnType<typeof createBrowserClient>
  onSaved:  (c: CaptacaoConfig) => void
}) {
  const [form, setForm] = useState({
    eyebrow:        config?.eyebrow        ?? DEFAULTS.eyebrow,
    titulo_linha_1: config?.titulo_linha_1 ?? DEFAULTS.titulo_linha_1,
    titulo_linha_2: config?.titulo_linha_2 ?? DEFAULTS.titulo_linha_2,
    texto_1:        config?.texto_1        ?? DEFAULTS.texto_1,
    texto_2:        config?.texto_2        ?? DEFAULTS.texto_2,
  })

  const [busy,  setBusy]  = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!config) return
    setForm({
      eyebrow:        config.eyebrow,
      titulo_linha_1: config.titulo_linha_1,
      titulo_linha_2: config.titulo_linha_2,
      texto_1:        config.texto_1,
      texto_2:        config.texto_2,
    })
  }, [config])

  const set = (k: keyof typeof form, v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setBusy(true)
    setError('')
    setSaved(false)

    const payload = { ...form, updated_at: new Date().toISOString() }

    let result: CaptacaoConfig | null = null
    if (config) {
      const { data, error: err } = await supabase
        .from('captacao_config').update(payload).eq('id', config.id).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      result = data as CaptacaoConfig
    } else {
      const { data, error: err } = await supabase
        .from('captacao_config').insert(payload).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      result = data as CaptacaoConfig
    }

    onSaved(result!)
    setSaved(true)
    setBusy(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Textos da seção</h2>
          <p className={styles.cardSub}>Aparecem ao lado do formulário &quot;Fale com Carlos&quot; na home</p>
        </div>
        <button className={styles.btnSave} onClick={handleSave} disabled={busy}>
          {busy ? 'Salvando…' : saved ? '✓ Salvo' : 'Salvar'}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.fields}>
        <label className={styles.label}>
          Rótulo (eyebrow)
          <input
            className={styles.input}
            value={form.eyebrow}
            onChange={e => set('eyebrow', e.target.value)}
            placeholder={DEFAULTS.eyebrow}
          />
        </label>
        <p className={styles.hint}>Texto pequeno em destaque acima do título.</p>

        <div className={styles.row}>
          <label className={styles.label}>
            Título — 1ª linha
            <input
              className={styles.input}
              value={form.titulo_linha_1}
              onChange={e => set('titulo_linha_1', e.target.value)}
              placeholder={DEFAULTS.titulo_linha_1}
            />
          </label>
          <label className={styles.label}>
            Título — 2ª linha
            <input
              className={styles.input}
              value={form.titulo_linha_2}
              onChange={e => set('titulo_linha_2', e.target.value)}
              placeholder={DEFAULTS.titulo_linha_2}
            />
          </label>
        </div>
        <p className={styles.hint}>Quebra de linha entre as duas frases para realçar o título.</p>

        <label className={styles.label}>
          1º parágrafo
          <textarea
            className={styles.textarea}
            rows={3}
            value={form.texto_1}
            onChange={e => set('texto_1', e.target.value)}
            placeholder={DEFAULTS.texto_1}
          />
        </label>

        <label className={styles.label}>
          2º parágrafo
          <textarea
            className={styles.textarea}
            rows={3}
            value={form.texto_2}
            onChange={e => set('texto_2', e.target.value)}
            placeholder={DEFAULTS.texto_2}
          />
        </label>

        <div className={styles.preview}>
          <p className={styles.previewLabel}>Pré-visualização</p>
          <p className={styles.previewEyebrow}>{form.eyebrow || DEFAULTS.eyebrow}</p>
          <h3 className={styles.previewTitle}>
            {form.titulo_linha_1 || DEFAULTS.titulo_linha_1}<br />
            {form.titulo_linha_2 || DEFAULTS.titulo_linha_2}
          </h3>
          <p className={styles.previewText}>{form.texto_1 || DEFAULTS.texto_1}</p>
          <p className={styles.previewText}>{form.texto_2 || DEFAULTS.texto_2}</p>
        </div>
      </div>
    </div>
  )
}
