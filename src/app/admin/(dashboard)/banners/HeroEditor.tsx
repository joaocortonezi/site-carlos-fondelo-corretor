'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image                                          from 'next/image'
import { createBrowserClient }                        from '@supabase/ssr'
import {
  HeroConfig, HeroLayer, HeroOverlayConfig, HeroGradientStop,
} from '@/lib/types'
import { HERO_FONTS, DEFAULT_FONT } from '@/lib/hero-fonts'
import styles from './HeroEditor.module.css'

// ─── Links disponíveis ───────────────────────────────────────────────────────

const LINK_OPTIONS = [
  { group: 'Seções da página inicial' },
  { label: 'Busca de Imóveis',   value: '#imoveis'    },
  { label: 'Destaques',          value: '#destaques'  },
  { label: 'Vídeos',             value: '#videos'     },
  { label: 'Avaliações',         value: '#avaliacoes' },
  { label: 'Sobre o Carlos',     value: '#sobre'      },
  { label: 'Anunciar Imóvel',    value: '#anunciar'   },
  { label: 'Newsletter',         value: '#newsletter' },
  { label: 'Contato / Rodapé',   value: '#contato'    },
  { group: 'Páginas' },
  { label: 'Página de Imóveis',  value: '/imoveis'    },
  { label: 'Página de Obrigado', value: '/obrigado'   },
] as const

// ─── Utils ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10) }

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}

function overlayCssStr(oc: HeroOverlayConfig): string {
  if (oc.tipo === 'nenhum') return 'transparent'
  if (oc.tipo === 'solido' && oc.cor) {
    const [r,g,b] = hexRgb(oc.cor)
    return `rgba(${r},${g},${b},${oc.opacidade ?? 0.55})`
  }
  if ((oc.tipo === 'gradiente_linear' || oc.tipo === 'gradiente_radial') && oc.paradas?.length) {
    const stops = oc.paradas
      .map(p => { const [r,g,b] = hexRgb(p.cor); return `rgba(${r},${g},${b},${p.opacidade}) ${p.posicao}%` })
      .join(', ')
    if (oc.tipo === 'gradiente_linear') return `linear-gradient(${oc.angulo ?? 135}deg, ${stops})`
    return `radial-gradient(circle at ${oc.centroX ?? 50}% ${oc.centroY ?? 50}%, ${stops})`
  }
  return 'transparent'
}

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

function makeDefaultOverlay(c: HeroConfig | null): HeroOverlayConfig {
  if (!c) return { tipo: 'solido', cor: '#000000', opacidade: 0.55 }
  return { tipo: 'solido', cor: c.cor_fundo || '#000000', opacidade: c.cor_fundo_opacidade ?? 0.55 }
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  config:   HeroConfig | null
  supabase: ReturnType<typeof createBrowserClient>
  onSaved:  (c: HeroConfig) => void
}

export default function HeroEditor({ config, supabase, onSaved }: Props) {
  const canvasRef  = useRef<HTMLDivElement>(null)
  const fileRef    = useRef<HTMLInputElement>(null)
  const dragRef    = useRef<{ layerId: string; sx: number; sy: number; lx: number; ly: number } | null>(null)

  const [layers,    setLayers]    = useState<HeroLayer[]>(() =>
    config?.camadas && config.camadas.length > 0
      ? config.camadas
      : makeDefaultLayers(config)
  )
  const [overlay,   setOverlay]   = useState<HeroOverlayConfig>(() =>
    config?.overlay_config ?? makeDefaultOverlay(config)
  )
  const [bgPreview, setBgPreview] = useState<string | null>(config?.url_imagem ?? null)
  const [bgFile,    setBgFile]    = useState<File | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab,       setTab]       = useState<'camadas' | 'fundo'>('camadas')
  const [canvasW,   setCanvasW]   = useState(900)
  const [busy,      setBusy]      = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState('')

  /* Sincroniza estado quando config carrega do banco (monta com null, depois recebe dados) */
  useEffect(() => {
    if (!config) return
    setLayers(
      config.camadas && config.camadas.length > 0
        ? config.camadas
        : makeDefaultLayers(config)
    )
    setOverlay(config.overlay_config ?? makeDefaultOverlay(config))
    setBgPreview(config.url_imagem ?? null)
    setBgFile(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.id])  // só re-executa quando um config diferente é carregado

  /* Mede a largura do canvas para escalonamento correto de fontes rem */
  useEffect(() => {
    const obs = new ResizeObserver(es => setCanvasW(es[0].contentRect.width))
    if (canvasRef.current) obs.observe(canvasRef.current)
    return () => obs.disconnect()
  }, [])

  const scale = canvasW / 1440  // referência: hero em 1440px

  const selected = layers.find(l => l.id === selectedId) ?? null

  // ── Layer helpers ──

  const updateLayer = useCallback((id: string, patch: Partial<HeroLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  }, [])

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

  // ── Drag ──

  const onLayerPointerDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedId(id)
    setTab('camadas')
    const layer = layers.find(l => l.id === id)!
    const rect  = canvasRef.current!.getBoundingClientRect()
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

  // ── Render layer on canvas ──

  const renderLayerOnCanvas = (layer: HeroLayer, idx: number) => {
    const isSelected = layer.id === selectedId

    const bg = layer.tipo === 'botao' && layer.corFundo
      ? (() => { const [r,g,b] = hexRgb(layer.corFundo!); return `rgba(${r},${g},${b},${layer.opacidadeFundo ?? 1})` })()
      : 'transparent'
    const brd = layer.tipo === 'botao' && layer.corContorno
      ? (() => { const [r,g,b] = hexRgb(layer.corContorno!); return `1px solid rgba(${r},${g},${b},${layer.opacidadeContorno ?? 1})` })()
      : layer.tipo === 'botao' ? 'none' : 'none'

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

  // ── File ──

  const handleBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setBgFile(f)
    setBgPreview(URL.createObjectURL(f))
  }

  // ── Save ──

  const handleSave = async () => {
    setBusy(true); setError(''); setSaved(false)
    let url = config?.url_imagem ?? null

    if (bgFile) {
      const ext = bgFile.name.split('.').pop() ?? 'jpg'
      await supabase.storage.from('banners').remove([`hero-principal.${ext}`])
      const { error: upErr } = await supabase.storage
        .from('banners').upload(`hero-principal.${ext}`, bgFile, { cacheControl: '3600', upsert: true })
      if (upErr) { setError(upErr.message); setBusy(false); return }
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(`hero-principal.${ext}`)
      url = `${publicUrl}?t=${Date.now()}`
    }

    const payload = {
      url_imagem:     url,
      camadas:        layers,
      overlay_config: overlay,
      updated_at:     new Date().toISOString(),
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

    setBgFile(null)
    onSaved(result!)
    setSaved(true)
    setBusy(false)
    setTimeout(() => setSaved(false), 3000)
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Editor Visual — Slide 0</h2>
          <p className={styles.sub}>Arraste elementos no canvas · clique para selecionar</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnAddText}   onClick={() => addLayer('texto')}>+ Texto</button>
          <button className={styles.btnAddButton} onClick={() => addLayer('botao')}>+ Botão</button>
          <button className={styles.btnSave} onClick={handleSave} disabled={busy}>
            {busy ? 'Salvando…' : saved ? '✓ Salvo' : 'Salvar'}
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.layout}>
        {/* ── Canvas ── */}
        <div className={styles.canvasWrap}>
          <div
            ref={canvasRef}
            className={styles.canvas}
            style={{ fontSize: `${scale * 16}px` }}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onClick={e => { if (e.currentTarget === e.target) setSelectedId(null) }}
          >
            {/* Imagem de fundo */}
            {bgPreview ? (
              <Image src={bgPreview} alt="" fill className={styles.canvasBg} sizes="800px" unoptimized />
            ) : (
              <div className={styles.canvasBgEmpty}>Sem imagem de fundo</div>
            )}

            {/* Overlay / Película */}
            <div
              className={styles.canvasOverlay}
              style={{ background: overlayCssStr(overlay) }}
            />

            {/* Indicador de nav */}
            <div className={styles.navGuide} title="Altura aproximada da navegação" />

            {/* Camadas */}
            {layers.map((layer, idx) => renderLayerOnCanvas(layer, idx))}
          </div>

          <p className={styles.canvasHint}>Preview proporcional a 1440 px de largura</p>
        </div>

        {/* ── Painel lateral ── */}
        <div className={styles.panel}>
          {/* Tabs */}
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

// ─── LayersTab ────────────────────────────────────────────────────────────────

function LayersTab({ layers, selectedId, onSelect, onMove, onRemove, onUpdate }: {
  layers:     HeroLayer[]
  selectedId: string | null
  onSelect:   (id: string) => void
  onMove:     (id: string, dir: -1 | 1) => void
  onRemove:   (id: string) => void
  onUpdate:   (id: string, patch: Partial<HeroLayer>) => void
}) {
  const selected = layers.find(l => l.id === selectedId) ?? null

  return (
    <div className={styles.layersTab}>
      {/* Lista de camadas */}
      <div className={styles.layerList}>
        <p className={styles.panelLabel}>Camadas (topo → fundo)</p>
        {layers.length === 0 && (
          <p className={styles.emptyHint}>Nenhuma camada. Use "+ Texto" ou "+ Botão" acima.</p>
        )}
        {[...layers].reverse().map((layer, ri) => {
          const idx = layers.length - 1 - ri
          return (
            <div
              key={layer.id}
              className={`${styles.layerItem} ${layer.id === selectedId ? styles.layerItemActive : ''}`}
              onClick={() => onSelect(layer.id)}
            >
              <span className={styles.layerIcon}>{layer.tipo === 'botao' ? '⬛' : '𝐓'}</span>
              <span className={styles.layerText}>{layer.texto.slice(0, 28)}{layer.texto.length > 28 ? '…' : ''}</span>
              <div className={styles.layerActions}>
                <button title="Subir" onClick={e => { e.stopPropagation(); onMove(layer.id, -1) }} disabled={idx === layers.length - 1}>↑</button>
                <button title="Descer" onClick={e => { e.stopPropagation(); onMove(layer.id, 1) }} disabled={idx === 0}>↓</button>
                <button title="Excluir" className={styles.layerDel} onClick={e => { e.stopPropagation(); onRemove(layer.id) }}>×</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Propriedades da camada selecionada */}
      {selected && (
        <LayerProps layer={selected} onUpdate={onUpdate} />
      )}
      {!selected && layers.length > 0 && (
        <p className={styles.emptyHint} style={{ marginTop: '1rem' }}>
          Clique em uma camada para editar suas propriedades.
        </p>
      )}
    </div>
  )
}

// ─── LayerProps ───────────────────────────────────────────────────────────────

function LayerProps({ layer, onUpdate }: {
  layer:    HeroLayer
  onUpdate: (id: string, patch: Partial<HeroLayer>) => void
}) {
  const set    = (patch: Partial<HeroLayer>) => onUpdate(layer.id, patch)
  const setNum = (key: keyof HeroLayer, v: string) => onUpdate(layer.id, { [key]: Number(v) } as Partial<HeroLayer>)

  return (
    <div className={styles.layerProps}>
      <p className={styles.panelLabel} style={{ marginTop: '1rem' }}>Propriedades</p>

      {/* Texto */}
      <label className={styles.field}>
        <span>Texto</span>
        <textarea
          className={styles.textarea}
          value={layer.texto}
          rows={2}
          onChange={e => set({ texto: e.target.value })}
        />
      </label>

      {/* Fonte */}
      <label className={styles.field}>
        <span>Família de fonte</span>
        <div className={styles.fontGrid}>
          {HERO_FONTS.map(f => (
            <button
              key={f.value}
              className={`${styles.fontBtn} ${(layer.fontFamily ?? DEFAULT_FONT) === f.value ? styles.fontBtnActive : ''}`}
              style={{ fontFamily: f.value }}
              onClick={() => set({ fontFamily: f.value })}
              title={f.label}
            >
              {f.label}
            </button>
          ))}
        </div>
      </label>

      {/* Tamanho + Peso */}
      <div className={styles.row2}>
        <label className={styles.field}>
          <span>Tamanho (rem)</span>
          <input type="number" className={styles.input} step="0.1" min="0.3" max="14"
            value={layer.fontSize} onChange={e => setNum('fontSize', e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Peso</span>
          <select className={styles.select} value={layer.fontWeight} onChange={e => setNum('fontWeight', e.target.value)}>
            {[100,200,300,400,500,600,700,800,900].map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Cor + Opacidade */}
      <div className={styles.row2}>
        <label className={styles.field}>
          <span>Cor do texto</span>
          <div className={styles.colorRow}>
            <input type="color" className={styles.colorPicker} value={layer.cor} onChange={e => set({ cor: e.target.value })} />
            <span className={styles.colorHex}>{layer.cor}</span>
          </div>
        </label>
        <label className={styles.field}>
          <span>Opacidade {Math.round(layer.opacity * 100)}%</span>
          <input type="range" min={0} max={1} step={0.01} value={layer.opacity}
            onChange={e => set({ opacity: Number(e.target.value) })} className={styles.range} />
        </label>
      </div>

      {/* Letter-spacing + Line-height */}
      <div className={styles.row2}>
        <label className={styles.field}>
          <span>Espaç. letras (em)</span>
          <input type="number" className={styles.input} step="0.01" min="-0.1" max="1"
            value={layer.letterSpacing} onChange={e => setNum('letterSpacing', e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Altura linha</span>
          <input type="number" className={styles.input} step="0.05" min="0.8" max="3"
            value={layer.lineHeight} onChange={e => setNum('lineHeight', e.target.value)} />
        </label>
      </div>

      {/* Posição X / Y */}
      <div className={styles.row2}>
        <label className={styles.field}>
          <span>Posição X (%)</span>
          <input type="number" className={styles.input} step="0.5" min="0" max="95"
            value={parseFloat(layer.x.toFixed(1))} onChange={e => setNum('x', e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Posição Y (%)</span>
          <input type="number" className={styles.input} step="0.5" min="0" max="95"
            value={parseFloat(layer.y.toFixed(1))} onChange={e => setNum('y', e.target.value)} />
        </label>
      </div>

      {/* Alinhamento */}
      <label className={styles.field}>
        <span>Alinhamento de texto</span>
        <div className={styles.alignRow}>
          {(['left','center','right'] as const).map(a => (
            <button key={a} className={`${styles.alignBtn} ${layer.textAlign === a ? styles.alignBtnActive : ''}`}
              onClick={() => set({ textAlign: a })}>
              {a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡'}
            </button>
          ))}
        </div>
      </label>

      {/* Itálico + Maiúsculas */}
      <div className={styles.toggleRow}>
        <button className={`${styles.toggleBtn} ${layer.italic ? styles.toggleBtnActive : ''}`}
          onClick={() => set({ italic: !layer.italic })}>
          <em>I</em> Itálico
        </button>
        <button className={`${styles.toggleBtn} ${layer.uppercase ? styles.toggleBtnActive : ''}`}
          onClick={() => set({ uppercase: !layer.uppercase })}>
          AA Maiúsculas
        </button>
      </div>

      {/* Botão: campos extras */}
      {layer.tipo === 'botao' && (
        <div className={styles.btnSection}>
          <p className={styles.panelLabel} style={{ marginTop: '0.75rem' }}>Botão</p>

          {/* Link destino */}
          <div className={styles.field}>
            <span>Destino do botão</span>
            <div className={styles.linkGrid}>
              {LINK_OPTIONS.map((opt, i) => {
                if ('group' in opt) {
                  return <p key={i} className={styles.linkGroup}>{opt.group}</p>
                }
                const isActive = (layer.href ?? '') === opt.value
                return (
                  <button
                    key={opt.value}
                    className={`${styles.linkBtn} ${isActive ? styles.linkBtnActive : ''}`}
                    onClick={() => set({ href: opt.value })}
                  >
                    {opt.label}
                    <span className={styles.linkBtnValue}>{opt.value}</span>
                  </button>
                )
              })}
            </div>
            <div className={styles.linkCustomRow}>
              <span className={styles.linkCustomLabel}>URL personalizada</span>
              <input
                type="text"
                className={styles.input}
                placeholder="https://... ou /pagina"
                value={
                  LINK_OPTIONS.some(o => 'value' in o && o.value === layer.href)
                    ? ''
                    : (layer.href ?? '')
                }
                onChange={e => set({ href: e.target.value })}
              />
            </div>
          </div>

          {/* Fundo do botão */}
          <label className={styles.field}>
            <span>Cor de fundo</span>
            <div className={styles.colorRow}>
              <input type="color" className={styles.colorPicker}
                value={layer.corFundo || '#bc6906'}
                onChange={e => set({ corFundo: e.target.value })} />
              {layer.corFundo && (
                <button className={styles.clearBtn} onClick={() => set({ corFundo: '' })}>×</button>
              )}
              {!layer.corFundo && <span className={styles.dimText}>sem fundo</span>}
            </div>
          </label>
          {layer.corFundo && (
            <label className={styles.field}>
              <span>Opacidade fundo {Math.round((layer.opacidadeFundo ?? 1) * 100)}%</span>
              <input type="range" min={0} max={1} step={0.01} value={layer.opacidadeFundo ?? 1}
                onChange={e => set({ opacidadeFundo: Number(e.target.value) })} className={styles.range} />
            </label>
          )}

          {/* Contorno do botão */}
          <label className={styles.field}>
            <span>Cor do contorno</span>
            <div className={styles.colorRow}>
              <input type="color" className={styles.colorPicker}
                value={layer.corContorno || '#bc6906'}
                onChange={e => set({ corContorno: e.target.value })} />
              {layer.corContorno && (
                <button className={styles.clearBtn} onClick={() => set({ corContorno: '' })}>×</button>
              )}
              {!layer.corContorno && <span className={styles.dimText}>sem contorno</span>}
            </div>
          </label>
          {layer.corContorno && (
            <label className={styles.field}>
              <span>Opacidade contorno {Math.round((layer.opacidadeContorno ?? 1) * 100)}%</span>
              <input type="range" min={0} max={1} step={0.01} value={layer.opacidadeContorno ?? 1}
                onChange={e => set({ opacidadeContorno: Number(e.target.value) })} className={styles.range} />
            </label>
          )}

          {/* Padding + Border radius */}
          <div className={styles.row2}>
            <label className={styles.field}>
              <span>Pad. H (rem)</span>
              <input type="number" className={styles.input} step="0.1" min="0" max="6"
                value={layer.paddingX ?? 2.4} onChange={e => set({ paddingX: Number(e.target.value) })} />
            </label>
            <label className={styles.field}>
              <span>Pad. V (rem)</span>
              <input type="number" className={styles.input} step="0.1" min="0" max="4"
                value={layer.paddingY ?? 0.9} onChange={e => set({ paddingY: Number(e.target.value) })} />
            </label>
          </div>
          <label className={styles.field}>
            <span>Border radius (px)</span>
            <input type="number" className={styles.input} step="1" min="0" max="50"
              value={layer.borderRadius ?? 2} onChange={e => set({ borderRadius: Number(e.target.value) })} />
          </label>
        </div>
      )}
    </div>
  )
}

// ─── BackgroundTab ────────────────────────────────────────────────────────────

function BackgroundTab({ bgPreview, fileRef, overlay, onFileChange, onOverlayChange }: {
  bgPreview:       string | null
  fileRef:         React.RefObject<HTMLInputElement | null>
  overlay:         HeroOverlayConfig
  onFileChange:    (e: React.ChangeEvent<HTMLInputElement>) => void
  onOverlayChange: (oc: HeroOverlayConfig) => void
}) {
  const set = (patch: Partial<HeroOverlayConfig>) => onOverlayChange({ ...overlay, ...patch })

  const addStop = () => {
    const paradas = [...(overlay.paradas ?? []), { id: uid(), cor: '#000000', opacidade: 0.5, posicao: 50 }]
    set({ paradas })
  }
  const removeStop = (id: string) => set({ paradas: (overlay.paradas ?? []).filter(p => p.id !== id) })
  const updateStop = (id: string, patch: Partial<HeroGradientStop>) => {
    set({ paradas: (overlay.paradas ?? []).map(p => p.id === id ? { ...p, ...patch } : p) })
  }

  return (
    <div className={styles.bgTab}>
      {/* Imagem */}
      <p className={styles.panelLabel}>Imagem de fundo</p>
      <div className={styles.bgUpload} onClick={() => fileRef.current?.click()}>
        {bgPreview ? (
          <div className={styles.bgPreviewWrap}>
            <Image src={bgPreview} alt="Hero" fill sizes="320px" className={styles.bgPreviewImg} unoptimized />
            <div className={styles.bgPreviewHover}>Trocar imagem</div>
          </div>
        ) : (
          <div className={styles.bgUploadEmpty}>
            <span>+</span>
            <p>Clique para selecionar</p>
            <small>PNG, JPG, WebP</small>
          </div>
        )}
      </div>

      {/* Película */}
      <p className={styles.panelLabel} style={{ marginTop: '1.25rem' }}>Película (overlay)</p>

      <div className={styles.overlayTypes}>
        {(['nenhum','solido','gradiente_linear','gradiente_radial'] as const).map(t => (
          <button
            key={t}
            className={`${styles.overlayTypeBtn} ${overlay.tipo === t ? styles.overlayTypeBtnActive : ''}`}
            onClick={() => {
              const defaults: Partial<HeroOverlayConfig> =
                t === 'solido'            ? { cor: overlay.cor ?? '#000000', opacidade: overlay.opacidade ?? 0.55 } :
                t === 'gradiente_linear'  ? { angulo: 135, paradas: overlay.paradas?.length ? overlay.paradas : [
                    { id: uid(), cor: '#000000', opacidade: 0.85, posicao: 0 },
                    { id: uid(), cor: '#000000', opacidade: 0,    posicao: 100 },
                  ]} :
                t === 'gradiente_radial'  ? { centroX: 50, centroY: 50, paradas: overlay.paradas?.length ? overlay.paradas : [
                    { id: uid(), cor: '#000000', opacidade: 0.85, posicao: 0 },
                    { id: uid(), cor: '#000000', opacidade: 0,    posicao: 100 },
                  ]} : {}
              onOverlayChange({ ...overlay, ...defaults, tipo: t })
            }}
          >
            {t === 'nenhum'           ? 'Nenhuma' :
             t === 'solido'           ? 'Cor sólida' :
             t === 'gradiente_linear' ? 'Gradiente linear' :
                                        'Gradiente radial'}
          </button>
        ))}
      </div>

      {/* Cor sólida */}
      {overlay.tipo === 'solido' && (
        <div className={styles.solidSection}>
          <label className={styles.field}>
            <span>Cor</span>
            <div className={styles.colorRow}>
              <input type="color" className={styles.colorPicker} value={overlay.cor ?? '#000000'} onChange={e => set({ cor: e.target.value })} />
              <span className={styles.colorHex}>{overlay.cor ?? '#000000'}</span>
            </div>
          </label>
          <label className={styles.field}>
            <span>Opacidade {Math.round((overlay.opacidade ?? 0.55) * 100)}%</span>
            <input type="range" min={0} max={1} step={0.01} value={overlay.opacidade ?? 0.55}
              onChange={e => set({ opacidade: Number(e.target.value) })} className={styles.range} />
          </label>
          {/* Preview strip */}
          <div className={styles.overlayPreviewStrip} style={{ background: overlayCssStr(overlay) }} />
        </div>
      )}

      {/* Gradiente */}
      {(overlay.tipo === 'gradiente_linear' || overlay.tipo === 'gradiente_radial') && (
        <div className={styles.gradSection}>
          {overlay.tipo === 'gradiente_linear' && (
            <label className={styles.field}>
              <span>Ângulo {overlay.angulo ?? 135}°</span>
              <input type="range" min={0} max={360} step={1} value={overlay.angulo ?? 135}
                onChange={e => set({ angulo: Number(e.target.value) })} className={styles.range} />
            </label>
          )}
          {overlay.tipo === 'gradiente_radial' && (
            <div className={styles.row2}>
              <label className={styles.field}>
                <span>Centro X {overlay.centroX ?? 50}%</span>
                <input type="range" min={0} max={100} step={1} value={overlay.centroX ?? 50}
                  onChange={e => set({ centroX: Number(e.target.value) })} className={styles.range} />
              </label>
              <label className={styles.field}>
                <span>Centro Y {overlay.centroY ?? 50}%</span>
                <input type="range" min={0} max={100} step={1} value={overlay.centroY ?? 50}
                  onChange={e => set({ centroY: Number(e.target.value) })} className={styles.range} />
              </label>
            </div>
          )}

          {/* Preview strip */}
          <div className={styles.overlayPreviewStrip} style={{ background: overlayCssStr(overlay) }} />

          {/* Paradas de cor */}
          <p className={styles.panelLabel} style={{ marginTop: '0.75rem' }}>Paradas de cor</p>
          {(overlay.paradas ?? []).map((stop, i) => (
            <div key={stop.id} className={styles.stopRow}>
              <span className={styles.stopNum}>{i + 1}</span>
              <input type="color" className={styles.colorPicker} value={stop.cor} onChange={e => updateStop(stop.id, { cor: e.target.value })} />
              <input type="range" className={styles.range} min={0} max={1} step={0.01} value={stop.opacidade}
                title={`Opacidade ${Math.round(stop.opacidade * 100)}%`}
                onChange={e => updateStop(stop.id, { opacidade: Number(e.target.value) })} />
              <span className={styles.stopPct}>{Math.round(stop.opacidade * 100)}%</span>
              <input type="number" className={styles.stopPos} min={0} max={100} value={stop.posicao}
                onChange={e => updateStop(stop.id, { posicao: Number(e.target.value) })} />
              <span className={styles.dimText}>%</span>
              <button className={styles.clearBtn} onClick={() => removeStop(stop.id)} title="Remover parada">×</button>
            </div>
          ))}
          <button className={styles.btnAddStop} onClick={addStop}>+ Parada de cor</button>
        </div>
      )}
    </div>
  )
}
