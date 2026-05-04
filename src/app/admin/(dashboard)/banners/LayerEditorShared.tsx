'use client'

import Image from 'next/image'
import { HeroLayer, HeroOverlayConfig, HeroGradientStop } from '@/lib/types'
import { HERO_FONTS, DEFAULT_FONT } from '@/lib/hero-fonts'
import styles from './HeroEditor.module.css'

// ─── Utilities ────────────────────────────────────────────────────────────────

export function uid() { return Math.random().toString(36).slice(2, 10) }

export function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}

export function overlayCssStr(oc: HeroOverlayConfig): string {
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

export function paradasValidas(p?: HeroGradientStop[]): boolean {
  if (!p || p.length < 2) return false
  const posicoes = new Set(p.map(x => x.posicao))
  return posicoes.size >= 2
}

export const LINK_OPTIONS = [
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

// ─── LayersTab ────────────────────────────────────────────────────────────────

export function LayersTab({ layers, selectedId, onSelect, onMove, onRemove, onUpdate }: {
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
      <div className={styles.layerList}>
        <p className={styles.panelLabel}>Camadas (topo → fundo)</p>
        {layers.length === 0 && (
          <p className={styles.emptyHint}>Nenhuma camada. Use &quot;+ Texto&quot; ou &quot;+ Botão&quot; acima.</p>
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

      {selected && <LayerProps layer={selected} onUpdate={onUpdate} />}
      {!selected && layers.length > 0 && (
        <p className={styles.emptyHint} style={{ marginTop: '1rem' }}>
          Clique em uma camada para editar suas propriedades.
        </p>
      )}
    </div>
  )
}

// ─── LayerProps ───────────────────────────────────────────────────────────────

export function LayerProps({ layer, onUpdate }: {
  layer:    HeroLayer
  onUpdate: (id: string, patch: Partial<HeroLayer>) => void
}) {
  const set    = (patch: Partial<HeroLayer>) => onUpdate(layer.id, patch)
  const setNum = (key: keyof HeroLayer, v: string) => onUpdate(layer.id, { [key]: Number(v) } as Partial<HeroLayer>)

  return (
    <div className={styles.layerProps}>
      <p className={styles.panelLabel} style={{ marginTop: '1rem' }}>Propriedades</p>

      <label className={styles.field}>
        <span>Texto</span>
        <textarea
          className={styles.textarea}
          value={layer.texto}
          rows={2}
          onChange={e => set({ texto: e.target.value })}
        />
      </label>

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

      {layer.tipo === 'botao' && (
        <div className={styles.btnSection}>
          <p className={styles.panelLabel} style={{ marginTop: '0.75rem' }}>Botão</p>

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

export function BackgroundTab({ bgPreview, fileRef, overlay, onFileChange, onOverlayChange }: {
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

      <p className={styles.panelLabel} style={{ marginTop: '1.25rem' }}>Película (overlay)</p>

      <div className={styles.overlayTypes}>
        {(['nenhum','solido','gradiente_linear','gradiente_radial'] as const).map(t => (
          <button
            key={t}
            className={`${styles.overlayTypeBtn} ${overlay.tipo === t ? styles.overlayTypeBtnActive : ''}`}
            onClick={() => {
              const defaultParadas = [
                { id: uid(), cor: '#000000', opacidade: 0.75, posicao: 0   },
                { id: uid(), cor: '#000000', opacidade: 0,    posicao: 100 },
              ]
              const defaults: Partial<HeroOverlayConfig> =
                t === 'solido'           ? { cor: overlay.cor ?? '#000000', opacidade: overlay.opacidade ?? 0.55 } :
                t === 'gradiente_linear' ? { angulo: 135, paradas: paradasValidas(overlay.paradas) ? overlay.paradas : defaultParadas } :
                t === 'gradiente_radial' ? { centroX: 50, centroY: 50, paradas: paradasValidas(overlay.paradas) ? overlay.paradas : defaultParadas } :
                {}
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
          <div className={styles.overlayPreviewStrip} style={{ background: overlayCssStr(overlay) }} />
        </div>
      )}

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

          <div className={styles.overlayPreviewStrip} style={{ background: overlayCssStr(overlay) }} />

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
