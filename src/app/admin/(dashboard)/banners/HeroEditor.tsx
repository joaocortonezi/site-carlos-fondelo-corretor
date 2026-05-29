// ─── Editor visual do Slide 0 (hero_config) ───────────────────────────────────
// Editor com 2 viewports: desktop (canvas 1440px / 16:9) e mobile (480px / 4:5).
// Ambos no site usam object-fit: contain (sem corte). Defaults legados só
// populam o desktop; mobile começa vazio.

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image                                          from 'next/image'
import { createBrowserClient }                        from '@supabase/ssr'
import { HeroConfig, HeroLayer, HeroOverlayConfig }   from '@/lib/types'
import { DEFAULT_FONT }                               from '@/lib/hero-fonts'
import {
  uid, hexRgb, overlayCssStr,
  LayersTab, BackgroundTab,
} from './LayerEditorShared'
import styles from './HeroEditor.module.css'

// ─── Defaults ────────────────────────────────────────────────────────────────

function makeDefaultLayers(c: HeroConfig | null): HeroLayer[] {
  if (!c) return []
  const layers: HeroLayer[] = []

  if (c.eyebrow) layers.push({
    id: uid(), tipo: 'texto', texto: c.eyebrow,
    x: 8, y: 34, fontSize: 0.68, fontWeight: c.peso_eyebrow ?? 400,
    cor: c.cor_eyebrow || '#bc6906', opacity: 1,
    letterSpacing: 0.28, lineHeight: 1.4,
    textAlign: 'left', italic: false, uppercase: true,
  })
  if (c.titulo_1) layers.push({
    id: uid(), tipo: 'texto', texto: c.titulo_1,
    x: 8, y: 41, fontSize: 7, fontWeight: c.peso_titulo_1 ?? 400,
    cor: c.cor_titulo_1 || '#ffffff', opacity: 1,
    letterSpacing: -0.02, lineHeight: 1.02,
    textAlign: 'left', italic: false, uppercase: false,
  })
  if (c.titulo_2) layers.push({
    id: uid(), tipo: 'texto', texto: c.titulo_2,
    x: 8, y: 56, fontSize: 7, fontWeight: c.peso_titulo_2 ?? 400,
    cor: c.cor_titulo_2 || '#ffffff', opacity: 1,
    letterSpacing: -0.02, lineHeight: 1.02,
    textAlign: 'left', italic: false, uppercase: false,
  })
  if (c.titulo_3) layers.push({
    id: uid(), tipo: 'texto', texto: c.titulo_3,
    x: 8, y: 70, fontSize: 7, fontWeight: c.peso_titulo_3 ?? 300,
    cor: c.cor_titulo_3 || '#d4800f', opacity: 1,
    letterSpacing: -0.02, lineHeight: 1.02,
    textAlign: 'left', italic: true, uppercase: false,
  })
  if (c.subtitulo) layers.push({
    id: uid(), tipo: 'texto', texto: c.subtitulo,
    x: 8, y: 80, fontSize: 0.82, fontWeight: c.peso_subtitulo ?? 400,
    cor: c.cor_subtitulo || '#7a7265', opacity: 1,
    letterSpacing: 0.2, lineHeight: 1.4,
    textAlign: 'left', italic: false, uppercase: true,
  })

  const btn1Texto = c.btn1_texto || 'Ver Imóveis'
  layers.push({
    id: uid(), tipo: 'botao', texto: btn1Texto,
    x: 8, y: 87, fontSize: 0.78, fontWeight: c.btn1_peso ?? 600,
    cor: c.btn1_cor_texto || '#1a1006', opacity: 1,
    letterSpacing: 0.14, lineHeight: 1,
    textAlign: 'center', italic: false, uppercase: true,
    corFundo: c.btn1_cor_fundo || '#bc6906', opacidadeFundo: c.btn1_opacidade_fundo ?? 1,
    corContorno: c.btn1_cor_contorno || '', opacidadeContorno: c.btn1_opacidade_contorno ?? 0,
    paddingX: 2.4, paddingY: 0.9, borderRadius: 2,
    href: '#imoveis',
  })
  layers.push({
    id: uid(), tipo: 'botao', texto: c.btn2_texto || 'Conheça Carlos →',
    x: 25, y: 87.3, fontSize: 0.78, fontWeight: c.btn2_peso ?? 600,
    cor: c.btn2_cor_texto || '#7a7265', opacity: 1,
    letterSpacing: 0.1, lineHeight: 1,
    textAlign: 'center', italic: false, uppercase: true,
    corFundo: c.btn2_cor_fundo || '', opacidadeFundo: c.btn2_opacidade_fundo ?? 0,
    corContorno: c.btn2_cor_contorno || '', opacidadeContorno: c.btn2_opacidade_contorno ?? 0,
    paddingX: 0, paddingY: 0.9, borderRadius: 0,
    href: '#sobre',
  })

  return layers
}

function makeDefaultOverlay(_c: HeroConfig | null): HeroOverlayConfig {
  return { tipo: 'nenhum' }
}

function cloneLayers(src: HeroLayer[]): HeroLayer[] {
  return src.map(l => ({ ...l, id: uid() }))
}

type Viewport = 'desktop' | 'mobile'

interface Props {
  config:   HeroConfig | null
  supabase: ReturnType<typeof createBrowserClient>
  onSaved:  (c: HeroConfig) => void
}

export default function HeroEditor({ config, supabase, onSaved }: Props) {
  const canvasRef  = useRef<HTMLDivElement>(null)
  const fileRef    = useRef<HTMLInputElement>(null)
  const dragRef    = useRef<{ layerId: string; sx: number; sy: number; lx: number; ly: number } | null>(null)

  // ── Variante desktop (defaults legados quando vazio) ──
  const [layersDesktop,    setLayersDesktop]    = useState<HeroLayer[]>(() =>
    config?.camadas && config.camadas.length > 0 ? config.camadas : makeDefaultLayers(config)
  )
  const [overlayDesktop,   setOverlayDesktop]   = useState<HeroOverlayConfig>(() =>
    config?.overlay_config ?? makeDefaultOverlay(config)
  )
  const [bgPreviewDesktop, setBgPreviewDesktop] = useState<string | null>(config?.url_imagem ?? null)
  const [bgFileDesktop,    setBgFileDesktop]    = useState<File | null>(null)

  // ── Variante mobile (vazia por default) ──
  const [layersMobile,    setLayersMobile]    = useState<HeroLayer[]>(() =>
    config?.camadas_mobile && config.camadas_mobile.length > 0 ? config.camadas_mobile : []
  )
  const [overlayMobile,   setOverlayMobile]   = useState<HeroOverlayConfig>(() =>
    config?.overlay_config_mobile ?? { tipo: 'nenhum' }
  )
  const [bgPreviewMobile, setBgPreviewMobile] = useState<string | null>(config?.url_imagem_mobile ?? null)
  const [bgFileMobile,    setBgFileMobile]    = useState<File | null>(null)
  const [removeBgMobile,  setRemoveBgMobile]  = useState(false)

  const [viewport,   setViewport]   = useState<Viewport>('desktop')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab,        setTab]        = useState<'camadas' | 'fundo'>('camadas')
  const [canvasW,    setCanvasW]    = useState(900)
  const [busy,       setBusy]       = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [error,      setError]      = useState('')

  const layers     = viewport === 'desktop' ? layersDesktop    : layersMobile
  const overlay    = viewport === 'desktop' ? overlayDesktop   : overlayMobile
  const bgPreview  = viewport === 'desktop' ? bgPreviewDesktop : bgPreviewMobile
  const setLayers  = viewport === 'desktop' ? setLayersDesktop : setLayersMobile
  const setOverlay = viewport === 'desktop' ? setOverlayDesktop : setOverlayMobile

  const canvasBase = viewport === 'desktop' ? 1440 : 480
  const scale      = canvasW / canvasBase

  useEffect(() => { setSelectedId(null) }, [viewport])

  useEffect(() => {
    if (!config) return
    setLayersDesktop(
      config.camadas && config.camadas.length > 0 ? config.camadas : makeDefaultLayers(config)
    )
    setOverlayDesktop(config.overlay_config ?? makeDefaultOverlay(config))
    setBgPreviewDesktop(config.url_imagem ?? null)
    setBgFileDesktop(null)
    setLayersMobile(config.camadas_mobile && config.camadas_mobile.length > 0 ? config.camadas_mobile : [])
    setOverlayMobile(config.overlay_config_mobile ?? { tipo: 'nenhum' })
    setBgPreviewMobile(config.url_imagem_mobile ?? null)
    setBgFileMobile(null)
    setRemoveBgMobile(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.id])

  useEffect(() => {
    const obs = new ResizeObserver(es => setCanvasW(es[0].contentRect.width))
    if (canvasRef.current) obs.observe(canvasRef.current)
    return () => obs.disconnect()
  }, [viewport])

  const updateLayer = useCallback((id: string, patch: Partial<HeroLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  }, [setLayers])

  const addLayer = (tipo: 'texto' | 'botao') => {
    const base: HeroLayer = tipo === 'texto' ? {
      id: uid(), tipo: 'texto', texto: 'Novo texto',
      x: 10, y: 45, fontSize: 1, fontWeight: 400,
      cor: '#ffffff', opacity: 1, letterSpacing: 0, lineHeight: 1.4,
      textAlign: 'left', italic: false, uppercase: false,
    } : {
      id: uid(), tipo: 'botao', texto: 'Botão',
      x: 10, y: 85, fontSize: 0.78, fontWeight: 600,
      cor: '#1a1006', opacity: 1, letterSpacing: 0.14, lineHeight: 1,
      textAlign: 'center', italic: false, uppercase: true,
      corFundo: '#bc6906', opacidadeFundo: 1,
      corContorno: '', opacidadeContorno: 0,
      paddingX: 2.4, paddingY: 0.9, borderRadius: 2, href: '#imoveis',
    }
    setLayers(prev => [...prev, base])
    setSelectedId(base.id)
    setTab('camadas')
  }

  const removeLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const moveLayer = (id: string, dir: -1 | 1) => {
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === id)
      if (idx + dir < 0 || idx + dir >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[idx + dir]] = [next[idx + dir], next[idx]]
      return next
    })
  }

  const copyDesktopToMobile = () => {
    if (layersDesktop.length === 0 && overlayDesktop.tipo === 'nenhum') return
    if (layersMobile.length > 0 && !confirm('Substituir o layout mobile atual pelo do desktop?')) return
    setLayersMobile(cloneLayers(layersDesktop))
    setOverlayMobile(JSON.parse(JSON.stringify(overlayDesktop)) as HeroOverlayConfig)
    setSelectedId(null)
  }

  const onLayerPointerDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedId(id)
    setTab('camadas')
    const layer = layers.find(l => l.id === id)!
    dragRef.current = { layerId: id, sx: e.clientX, sy: e.clientY, lx: layer.x, ly: layer.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const { layerId, sx, sy, lx, ly } = dragRef.current
    const dx = ((e.clientX - sx) / rect.width)  * 100
    const dy = ((e.clientY - sy) / rect.height) * 100
    updateLayer(layerId, {
      x: Math.max(0, Math.min(95, lx + dx)),
      y: Math.max(0, Math.min(95, ly + dy)),
    })
  }

  const onCanvasPointerUp = () => { dragRef.current = null }

  const renderLayerOnCanvas = (layer: HeroLayer, idx: number) => {
    const isSelected = layer.id === selectedId

    const bg = layer.tipo === 'botao' && layer.corFundo
      ? (() => { const [r,g,b] = hexRgb(layer.corFundo!); return `rgba(${r},${g},${b},${layer.opacidadeFundo ?? 1})` })()
      : 'transparent'
    const brd = layer.tipo === 'botao' && layer.corContorno
      ? (() => { const [r,g,b] = hexRgb(layer.corContorno!); return `1px solid rgba(${r},${g},${b},${layer.opacidadeContorno ?? 1})` })()
      : 'none'

    const s: React.CSSProperties = {
      position:      'absolute',
      left:          `${layer.x}%`,
      top:           `${layer.y}%`,
      fontSize:      `${layer.fontSize}rem`,
      fontFamily:    layer.fontFamily ?? DEFAULT_FONT,
      fontWeight:    layer.fontWeight,
      color:         layer.cor,
      opacity:       layer.opacity,
      letterSpacing: `${layer.letterSpacing}em`,
      lineHeight:    layer.lineHeight,
      textAlign:     layer.textAlign,
      fontStyle:     layer.italic    ? 'italic'    : 'normal',
      textTransform: layer.uppercase ? 'uppercase' : 'none',
      whiteSpace:    'pre-wrap',
      cursor:        'grab',
      userSelect:    'none',
      zIndex:        idx + 1,
      outline:       isSelected ? '1.5px solid #bc6906' : 'none',
      outlineOffset: '4px',
      padding:       layer.tipo === 'botao'
        ? `${(layer.paddingY ?? 0.9) * (scale || 1) * 16}px ${(layer.paddingX ?? 2.4) * (scale || 1) * 16}px`
        : undefined,
      background:    layer.tipo === 'botao' ? bg : 'transparent',
      border:        layer.tipo === 'botao' ? brd : 'none',
      borderRadius:  layer.tipo === 'botao' ? `${(layer.borderRadius ?? 2) * scale}px` : undefined,
    }

    return (
      <div
        key={layer.id}
        style={s}
        onPointerDown={e => onLayerPointerDown(e, layer.id)}
        title={layer.texto}
      >
        {layer.texto}
      </div>
    )
  }

  const handleBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    if (viewport === 'desktop') {
      setBgFileDesktop(f); setBgPreviewDesktop(URL.createObjectURL(f))
    } else {
      setBgFileMobile(f); setBgPreviewMobile(URL.createObjectURL(f))
      setRemoveBgMobile(false)
    }
  }

  const clearBgMobile = () => {
    setBgFileMobile(null); setBgPreviewMobile(null); setRemoveBgMobile(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  // Desktop usa upsert no nome fixo legado; mobile usa nome próprio
  const uploadDesktopBg = async (f: File): Promise<string | null> => {
    const ext = f.name.split('.').pop() ?? 'jpg'
    await supabase.storage.from('banners').remove([`hero-principal.${ext}`])
    const { error: upErr } = await supabase.storage
      .from('banners').upload(`hero-principal.${ext}`, f, { cacheControl: '3600', upsert: true })
    if (upErr) { setError(upErr.message); return null }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(`hero-principal.${ext}`)
    return `${publicUrl}?t=${Date.now()}`
  }
  const uploadMobileBg = async (f: File): Promise<string | null> => {
    const ext = f.name.split('.').pop() ?? 'jpg'
    const name = `hero-principal-mobile.${ext}`
    await supabase.storage.from('banners').remove([name])
    const { error: upErr } = await supabase.storage
      .from('banners').upload(name, f, { cacheControl: '3600', upsert: true })
    if (upErr) { setError(upErr.message); return null }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(name)
    return `${publicUrl}?t=${Date.now()}`
  }

  const handleSave = async () => {
    setBusy(true); setError(''); setSaved(false)

    let urlDesktop = config?.url_imagem ?? null
    if (bgFileDesktop) {
      const url = await uploadDesktopBg(bgFileDesktop)
      if (!url) { setBusy(false); return }
      urlDesktop = url
    }

    let urlMobile: string | null = config?.url_imagem_mobile ?? null
    if (bgFileMobile) {
      const url = await uploadMobileBg(bgFileMobile)
      if (!url) { setBusy(false); return }
      urlMobile = url
    } else if (removeBgMobile) {
      urlMobile = null
    }

    const mobileEmpty =
      layersMobile.length === 0 &&
      overlayMobile.tipo === 'nenhum' &&
      !urlMobile

    const payload = {
      url_imagem:            urlDesktop,
      url_imagem_mobile:     urlMobile,
      camadas:               layersDesktop,
      overlay_config:        overlayDesktop,
      camadas_mobile:        mobileEmpty ? null : layersMobile,
      overlay_config_mobile: mobileEmpty ? null : overlayMobile,
      updated_at:            new Date().toISOString(),
    }

    let result: HeroConfig | null = null
    if (config) {
      const { data, error: err } = await supabase
        .from('hero_config').update(payload).eq('id', config.id).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      result = data as HeroConfig
    } else {
      const { data, error: err } = await supabase
        .from('hero_config').insert({ ...payload, intervalo: 5 }).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      result = data as HeroConfig
    }

    setBgFileDesktop(null)
    setBgFileMobile(null)
    setRemoveBgMobile(false)
    onSaved(result!)
    setSaved(true)
    setBusy(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const mobileEmptyHint =
    viewport === 'mobile' &&
    layersMobile.length === 0 &&
    !bgPreviewMobile &&
    overlayMobile.tipo === 'nenhum'

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Editor Visual — Slide 0</h2>
          <p className={styles.sub}>Arraste elementos no canvas · clique para selecionar</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.viewportTabs}>
            <button
              className={`${styles.viewportTab} ${viewport === 'desktop' ? styles.viewportTabActive : ''}`}
              onClick={() => setViewport('desktop')}
            >🖥 Desktop</button>
            <button
              className={`${styles.viewportTab} ${viewport === 'mobile' ? styles.viewportTabActive : ''}`}
              onClick={() => setViewport('mobile')}
            >📱 Mobile</button>
          </div>
          {viewport === 'mobile' && (
            <button
              className={styles.btnCopyDesktop}
              onClick={copyDesktopToMobile}
              disabled={layersDesktop.length === 0 && overlayDesktop.tipo === 'nenhum'}
              title="Substitui o layout mobile pelo do desktop"
            >
              ⤓ Copiar do desktop
            </button>
          )}
          <button className={styles.btnAddText}   onClick={() => addLayer('texto')}>+ Texto</button>
          <button className={styles.btnAddButton} onClick={() => addLayer('botao')}>+ Botão</button>
          <button className={styles.btnSave} onClick={handleSave} disabled={busy}>
            {busy ? 'Salvando…' : saved ? '✓ Salvo' : 'Salvar'}
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.layout}>
        <div className={styles.canvasWrap}>
          <div
            ref={canvasRef}
            className={`${styles.canvas} ${viewport === 'mobile' ? styles.canvasMobile : ''}`}
            style={{ fontSize: `${scale * 16}px` }}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onClick={e => { if (e.currentTarget === e.target) setSelectedId(null) }}
          >
            {bgPreview ? (
              <Image src={bgPreview} alt="" fill className={styles.canvasBg} sizes="800px" unoptimized />
            ) : (
              <div className={styles.canvasBgEmpty}>
                {mobileEmptyHint
                  ? 'Sem versão mobile — o site usará a versão desktop'
                  : 'Sem imagem de fundo'}
              </div>
            )}
            <div
              className={styles.canvasOverlay}
              style={{ background: overlayCssStr(overlay) }}
            />
            <div className={styles.navGuide} title="Altura aproximada da navegação" />
            {layers.map((layer, idx) => renderLayerOnCanvas(layer, idx))}
          </div>
          <p className={styles.canvasHint}>
            {viewport === 'desktop'
              ? 'Preview proporcional a 1440 px · 16:9 (ex 1920×1080)'
              : 'Preview mobile · 4:5 (ex 1080×1350)'}
          </p>
          {viewport === 'mobile' && bgPreviewMobile && (
            <button type="button" className={styles.btnCopyDesktop} style={{ alignSelf: 'center' }} onClick={clearBgMobile}>
              Remover imagem mobile
            </button>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'camadas' ? styles.tabActive : ''}`}
              onClick={() => setTab('camadas')}
            >
              Camadas {layers.length > 0 && <span className={styles.tabCount}>{layers.length}</span>}
            </button>
            <button
              className={`${styles.tab} ${tab === 'fundo' ? styles.tabActive : ''}`}
              onClick={() => setTab('fundo')}
            >
              Fundo &amp; Película
            </button>
          </div>

          <div className={styles.panelBody}>
            {tab === 'camadas' && (
              <LayersTab
                layers={layers}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMove={moveLayer}
                onRemove={removeLayer}
                onUpdate={updateLayer}
              />
            )}
            {tab === 'fundo' && (
              <BackgroundTab
                bgPreview={bgPreview}
                fileRef={fileRef}
                overlay={overlay}
                onFileChange={handleBgFile}
                onOverlayChange={setOverlay}
              />
            )}
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className={styles.fileInput} onChange={handleBgFile} />
    </div>
  )
}
