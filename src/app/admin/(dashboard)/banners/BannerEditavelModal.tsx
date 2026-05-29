// ─── Modal do editor visual de Banners Editáveis ─────────────────────────────
// Editor com 2 viewports: desktop (canvas 16:9) e mobile (canvas 4:5).
// Cada um tem suas próprias camadas, overlay e imagem. Mobile é opcional;
// quando vazio, o site cai no desktop.

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image                                          from 'next/image'
import { createBrowserClient }                        from '@supabase/ssr'
import { Banner, HeroLayer, HeroOverlayConfig }        from '@/lib/types'
import { DEFAULT_FONT }                               from '@/lib/hero-fonts'
import {
  uid, hexRgb, overlayCssStr,
  LayersTab, BackgroundTab,
} from './LayerEditorShared'
import edStyles from './HeroEditor.module.css'
import styles   from './banners.module.css'

function makeEmptyLayers(): HeroLayer[] { return [] }
function makeEmptyOverlay(): HeroOverlayConfig { return { tipo: 'nenhum' } }
function cloneLayers(src: HeroLayer[]): HeroLayer[] {
  return src.map(l => ({ ...l, id: uid() }))
}

type Viewport = 'desktop' | 'mobile'

interface Props {
  banner:   Banner | null
  supabase: ReturnType<typeof createBrowserClient>
  onClose:  () => void
  onSaved:  (b: Banner) => void
}

export default function BannerEditavelModal({ banner, supabase, onClose, onSaved }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)
  const dragRef   = useRef<{ layerId: string; sx: number; sy: number; lx: number; ly: number } | null>(null)

  // ── Variante desktop ──
  const [layersDesktop,    setLayersDesktop]    = useState<HeroLayer[]>(() =>
    banner?.camadas && banner.camadas.length > 0 ? banner.camadas : makeEmptyLayers()
  )
  const [overlayDesktop,   setOverlayDesktop]   = useState<HeroOverlayConfig>(() =>
    banner?.overlay_config ?? makeEmptyOverlay()
  )
  const [bgPreviewDesktop, setBgPreviewDesktop] = useState<string | null>(banner?.url_imagem ?? null)
  const [bgFileDesktop,    setBgFileDesktop]    = useState<File | null>(null)

  // ── Variante mobile ──
  const [layersMobile,    setLayersMobile]    = useState<HeroLayer[]>(() =>
    banner?.camadas_mobile && banner.camadas_mobile.length > 0 ? banner.camadas_mobile : makeEmptyLayers()
  )
  const [overlayMobile,   setOverlayMobile]   = useState<HeroOverlayConfig>(() =>
    banner?.overlay_config_mobile ?? makeEmptyOverlay()
  )
  const [bgPreviewMobile, setBgPreviewMobile] = useState<string | null>(banner?.url_imagem_mobile ?? null)
  const [bgFileMobile,    setBgFileMobile]    = useState<File | null>(null)
  const [removeBgMobile,  setRemoveBgMobile]  = useState(false)

  const [viewport,   setViewport]   = useState<Viewport>('desktop')
  const [titulo,     setTitulo]     = useState(banner?.titulo    ?? '')
  const [ordem,      setOrdem]      = useState(banner?.ordem     ?? 0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab,        setTab]        = useState<'camadas' | 'fundo'>('camadas')
  const [canvasW,    setCanvasW]    = useState(700)
  const [busy,       setBusy]       = useState(false)
  const [error,      setError]      = useState('')

  // Proxies por viewport
  const layers     = viewport === 'desktop' ? layersDesktop    : layersMobile
  const overlay    = viewport === 'desktop' ? overlayDesktop   : overlayMobile
  const bgPreview  = viewport === 'desktop' ? bgPreviewDesktop : bgPreviewMobile
  const setLayers  = viewport === 'desktop' ? setLayersDesktop : setLayersMobile
  const setOverlay = viewport === 'desktop' ? setOverlayDesktop : setOverlayMobile

  // Canvas base: 1440 desktop / 480 mobile. As coordenadas das camadas são
  // em %, então funciona em qualquer escala — o base controla o tamanho da
  // fonte renderizada no preview pra ficar legível.
  const canvasBase = viewport === 'desktop' ? 1440 : 480
  const scale      = canvasW / canvasBase

  useEffect(() => { setSelectedId(null) }, [viewport])

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
      <div key={layer.id} style={s} onPointerDown={e => onLayerPointerDown(e, layer.id)} title={layer.texto}>
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

  const uploadBg = async (f: File, prefix: string): Promise<string | null> => {
    const ext = f.name.split('.').pop() ?? 'jpg'
    const name = `${prefix}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('banners').upload(name, f, { cacheControl: '3600', upsert: false })
    if (upErr) { setError(upErr.message); return null }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(name)
    return publicUrl
  }

  const handleSave = async () => {
    setBusy(true); setError('')

    let urlDesktop = banner?.url_imagem ?? null
    if (bgFileDesktop) {
      const url = await uploadBg(bgFileDesktop, 'banner-editavel-desktop')
      if (!url) { setBusy(false); return }
      urlDesktop = url
    }

    let urlMobile: string | null = banner?.url_imagem_mobile ?? null
    if (bgFileMobile) {
      const url = await uploadBg(bgFileMobile, 'banner-editavel-mobile')
      if (!url) { setBusy(false); return }
      urlMobile = url
    } else if (removeBgMobile) {
      urlMobile = null
    }

    // Mobile vazio (sem camadas + sem overlay + sem imagem) → grava NULL e cai no fallback
    const mobileEmpty =
      layersMobile.length === 0 &&
      overlayMobile.tipo === 'nenhum' &&
      !urlMobile

    const payload = {
      titulo:                titulo || null,
      subtitulo:             null,
      url_imagem:            urlDesktop,
      url_imagem_mobile:     urlMobile,
      ordem,
      tipo:                  'editavel' as const,
      camadas:               layersDesktop,
      overlay_config:        overlayDesktop,
      camadas_mobile:        mobileEmpty ? null : layersMobile,
      overlay_config_mobile: mobileEmpty ? null : overlayMobile,
      updated_at:            new Date().toISOString(),
    }

    let result: Banner
    if (banner) {
      const { data, error: err } = await supabase
        .from('banners').update(payload).eq('id', banner.id).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      result = data as Banner
    } else {
      const { data, error: err } = await supabase
        .from('banners').insert({ ...payload, ativo: true }).select().single()
      if (err) { setError(err.message); setBusy(false); return }
      result = data as Banner
    }

    setBgFileDesktop(null)
    setBgFileMobile(null)
    onSaved(result)
  }

  const mobileEmptyHint =
    viewport === 'mobile' &&
    layersMobile.length === 0 &&
    !bgPreviewMobile &&
    overlayMobile.tipo === 'nenhum'

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalEditavel} onClick={e => e.stopPropagation()}>

        <div className={styles.modalEditavelHeader}>
          <div>
            <h2 className={styles.modalTitle}>{banner ? 'Editar Banner Editável' : 'Novo Banner Editável'}</h2>
            <p className={edStyles.sub}>Arraste elementos no canvas · clique para selecionar</p>
          </div>
          <div className={edStyles.headerActions}>
            <div className={edStyles.viewportTabs}>
              <button
                className={`${edStyles.viewportTab} ${viewport === 'desktop' ? edStyles.viewportTabActive : ''}`}
                onClick={() => setViewport('desktop')}
              >🖥 Desktop</button>
              <button
                className={`${edStyles.viewportTab} ${viewport === 'mobile' ? edStyles.viewportTabActive : ''}`}
                onClick={() => setViewport('mobile')}
              >📱 Mobile</button>
            </div>
            {viewport === 'mobile' && (
              <button
                className={edStyles.btnCopyDesktop}
                onClick={copyDesktopToMobile}
                disabled={layersDesktop.length === 0 && overlayDesktop.tipo === 'nenhum'}
                title="Substitui o layout mobile pelo do desktop"
              >
                ⤓ Copiar do desktop
              </button>
            )}
            <button className={edStyles.btnAddText}   onClick={() => addLayer('texto')}>+ Texto</button>
            <button className={edStyles.btnAddButton} onClick={() => addLayer('botao')}>+ Botão</button>
            <button className={edStyles.btnSave} onClick={handleSave} disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar'}
            </button>
            <button className={styles.modalClose} onClick={onClose}>×</button>
          </div>
        </div>

        {error && <p className={edStyles.error} style={{ margin: '0 1.5rem 0.5rem' }}>{error}</p>}

        <div className={styles.modalEditavelMeta}>
          <label className={styles.label}>
            Título interno (opcional)
            <input className={styles.input} placeholder="Ex: Banner verão 2026"
              value={titulo} onChange={e => setTitulo(e.target.value)} />
          </label>
          <label className={styles.label}>
            Ordem
            <input className={styles.input} type="number" min={0}
              value={ordem} onChange={e => setOrdem(Number(e.target.value))} />
          </label>
        </div>

        <div className={styles.modalEditavelBody}>
          <div className={edStyles.layout} style={{ height: '100%' }}>
            <div className={edStyles.canvasWrap}>
              <div
                ref={canvasRef}
                className={`${edStyles.canvas} ${viewport === 'mobile' ? edStyles.canvasMobile : ''}`}
                style={{ fontSize: `${scale * 16}px` }}
                onPointerMove={onCanvasPointerMove}
                onPointerUp={onCanvasPointerUp}
                onClick={e => { if (e.currentTarget === e.target) setSelectedId(null) }}
              >
                {bgPreview ? (
                  <Image src={bgPreview} alt="" fill className={edStyles.canvasBg} sizes="800px" unoptimized />
                ) : (
                  <div className={edStyles.canvasBgEmpty}>
                    {mobileEmptyHint
                      ? 'Sem versão mobile — o site usará a versão desktop'
                      : 'Sem imagem de fundo'}
                  </div>
                )}
                <div className={edStyles.canvasOverlay} style={{ background: overlayCssStr(overlay) }} />
                <div className={edStyles.navGuide} title="Altura aproximada da navegação" />
                {layers.map((layer, idx) => renderLayerOnCanvas(layer, idx))}
              </div>
              <p className={edStyles.canvasHint}>
                {viewport === 'desktop'
                  ? 'Preview proporcional a 1440 px · 16:9 (ex 1920×1080)'
                  : 'Preview mobile · 4:5 (ex 1080×1350)'}
              </p>
              {viewport === 'mobile' && bgPreviewMobile && (
                <button type="button" className={styles.variantRemoveBtn} style={{ alignSelf: 'center' }} onClick={clearBgMobile}>
                  Remover imagem mobile
                </button>
              )}
            </div>

            <div className={edStyles.panel}>
              <div className={edStyles.tabs}>
                <button
                  className={`${edStyles.tab} ${tab === 'camadas' ? edStyles.tabActive : ''}`}
                  onClick={() => setTab('camadas')}
                >
                  Camadas {layers.length > 0 && <span className={edStyles.tabCount}>{layers.length}</span>}
                </button>
                <button
                  className={`${edStyles.tab} ${tab === 'fundo' ? edStyles.tabActive : ''}`}
                  onClick={() => setTab('fundo')}
                >
                  Fundo &amp; Película
                </button>
              </div>
              <div className={edStyles.panelBody}>
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
        </div>

        <input ref={fileRef} type="file" accept="image/*" className={edStyles.fileInput} onChange={handleBgFile} />
      </div>
    </div>
  )
}
