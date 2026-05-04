// ─── Hero Slideshow ───────────────────────────────────────────────────────────
// Gerencia o slideshow completo da home. Estrutura de slides:
//   Slide 0 → hero_config (imagem + camadas do editor visual ou layout legado)
//   Slides 1+ → banners ativos (tipo 'png' sem overlay | tipo 'editavel' com camadas)
//
// Animações: parallax vertical no scroll + fade entre slides + framer-motion nas camadas.
// Drag entre slides é intencional — só setas e dots para evitar conflito com scroll mobile.

'use client'

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect, useCallback }          from 'react'
import Image                                                   from 'next/image'
import { Banner, HeroConfig, HeroLayer, HeroOverlayConfig }   from '@/lib/types'
import { DEFAULT_FONT }                                        from '@/lib/hero-fonts'
import styles                                                  from './Hero.module.css'

interface Props {
  banners?:    Pick<Banner, 'url_imagem' | 'tipo' | 'camadas' | 'overlay_config'>[]
  heroConfig?: HeroConfig | null
}

// Converte cor hex para tupla RGB (necessário para montar rgba() inline)
function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

/**
 * Converte HeroOverlayConfig para um objeto CSSProperties aplicável ao div de overlay.
 * Retorna undefined quando tipo='nenhum', o que remove o elemento de overlay do DOM.
 */
function overlayCss(oc: HeroOverlayConfig | null | undefined): React.CSSProperties | undefined {
  if (!oc || oc.tipo === 'nenhum') return undefined
  if (oc.tipo === 'solido' && oc.cor) {
    const [r, g, b] = hexRgb(oc.cor)
    return { background: `rgba(${r},${g},${b},${oc.opacidade ?? 0.55})` }
  }
  if ((oc.tipo === 'gradiente_linear' || oc.tipo === 'gradiente_radial') && oc.paradas?.length) {
    const stops = oc.paradas
      .map(p => { const [r, g, b] = hexRgb(p.cor); return `rgba(${r},${g},${b},${p.opacidade}) ${p.posicao}%` })
      .join(', ')
    if (oc.tipo === 'gradiente_linear') {
      return { background: `linear-gradient(${oc.angulo ?? 135}deg, ${stops})` }
    }
    return { background: `radial-gradient(circle at ${oc.centroX ?? 50}% ${oc.centroY ?? 50}%, ${stops})` }
  }
  return undefined
}

/** Gera o estilo inline de uma camada de texto para renderização no site. */
function layerStyle(layer: HeroLayer): React.CSSProperties {
  return {
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
    maxWidth:      '90%',
    zIndex:        1,
  }
}

/** Gera o estilo inline de uma camada de botão (extende layerStyle com fundo/borda). */
function buttonLayerStyle(layer: HeroLayer): React.CSSProperties {
  const base = layerStyle(layer)
  const bg = layer.corFundo
    ? (() => { const [r, g, b] = hexRgb(layer.corFundo!); return `rgba(${r},${g},${b},${layer.opacidadeFundo ?? 1})` })()
    : 'transparent'
  const border = layer.corContorno
    ? (() => { const [r, g, b] = hexRgb(layer.corContorno!); return `1px solid rgba(${r},${g},${b},${layer.opacidadeContorno ?? 1})` })()
    : 'none'
  return {
    ...base,
    display:       'inline-block',
    background:    bg,
    border,
    padding:       `${layer.paddingY ?? 0.9}rem ${layer.paddingX ?? 2.4}rem`,
    borderRadius:  `${layer.borderRadius ?? 2}px`,
    cursor:        'pointer',
    transition:    'opacity 0.2s',
    textDecoration: 'none',
  }
}

export default function Hero({ banners = [], heroConfig }: Props) {
  const ref = useRef<HTMLElement>(null)

  // scrollYProgress vai de 0 (hero no topo) a 1 (hero saiu da viewport)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // Parallax: fundo sobe mais devagar que o scroll (desloca 25% enquanto scroll vai 100%)
  const bgY     = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  // Conteúdo some antes do fundo — cria separação visual limpa
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  // true quando hero_config tem camadas do editor visual (modo novo)
  const hasCamadas = !!(heroConfig?.camadas && heroConfig.camadas.length > 0)

  // ── Overlay do slide 0 ────────────────────────────────────────────────────
  // Modo visual: usa overlay_config. Modo legado: usa cor_fundo + opacidade.
  const overlayStyle = hasCamadas
    ? overlayCss(heroConfig?.overlay_config)
    : (() => {
        const hex = heroConfig?.cor_fundo
        if (!hex) return undefined
        const [r, g, b] = hexRgb(hex)
        const a = heroConfig?.cor_fundo_opacidade ?? 0.55
        return { background: `rgba(${r},${g},${b},${a})` }
      })()

  // ── Layout legado (slide 0 sem camadas) ──────────────────────────────────
  const eyebrow  = heroConfig?.eyebrow ?? 'Corretor de Imóveis · CRECI 000000'
  const rawWords = [
    heroConfig?.titulo_1 ?? 'O imóvel certo',
    heroConfig?.titulo_2 ?? 'para cada história',
    heroConfig?.titulo_3 ?? '',
  ]
  const rawTitleColors  = [heroConfig?.cor_titulo_1 || null, heroConfig?.cor_titulo_2 || null, heroConfig?.cor_titulo_3 || null]
  const rawTitleWeights = [heroConfig?.peso_titulo_1 || null, heroConfig?.peso_titulo_2 || null, heroConfig?.peso_titulo_3 || null]
  // Filtra linhas de título vazias para não renderizar spans extras
  const wordTriples = rawWords
    .map((w, i) => ({ word: w, color: rawTitleColors[i], weight: rawTitleWeights[i] }))
    .filter(({ word }) => word.trim() !== '')
  const subtitulo = heroConfig?.subtitulo ?? 'Atendimento personalizado · Compra, venda e locação'
  const slide0Img = heroConfig?.url_imagem || '/images/banner.jpg'

  // Helper local para converter hex+alpha em rgba (usado pelos botões legados)
  function hexRgbaOld(hex: string, alpha: number) {
    const [r, g, b] = hexRgb(hex); return `rgba(${r},${g},${b},${alpha})`
  }
  // Estilos dos botões do layout legado
  const btn1Style: React.CSSProperties = {}
  if (heroConfig?.btn1_cor_texto)    btn1Style.color      = heroConfig.btn1_cor_texto
  if (heroConfig?.btn1_cor_fundo)    btn1Style.background = hexRgbaOld(heroConfig.btn1_cor_fundo, heroConfig.btn1_opacidade_fundo ?? 1)
  if (heroConfig?.btn1_cor_contorno) btn1Style.border     = `1px solid ${hexRgbaOld(heroConfig.btn1_cor_contorno, heroConfig.btn1_opacidade_contorno ?? 1)}`
  if (heroConfig?.btn1_peso)         btn1Style.fontWeight = heroConfig.btn1_peso
  const btn2Style: React.CSSProperties = {}
  if (heroConfig?.btn2_cor_texto)    btn2Style.color      = heroConfig.btn2_cor_texto
  if (heroConfig?.btn2_cor_fundo)    btn2Style.background = hexRgbaOld(heroConfig.btn2_cor_fundo, heroConfig.btn2_opacidade_fundo ?? 0)
  if (heroConfig?.btn2_cor_contorno) btn2Style.border     = `1px solid ${hexRgbaOld(heroConfig.btn2_cor_contorno, heroConfig.btn2_opacidade_contorno ?? 0)}`
  if (heroConfig?.btn2_peso)         btn2Style.fontWeight = heroConfig.btn2_peso

  // ── Montagem do array de slides ───────────────────────────────────────────
  type Slide = {
    url:           string
    branded:       boolean   // true = slide 0 com conteúdo editável
    tipo:          'hero' | 'png' | 'editavel'
    camadas?:      HeroLayer[] | null
    overlay_config?: HeroOverlayConfig | null
  }

  const allSlides: Slide[] = [
    // Slide 0: sempre o slide principal da hero_config
    { url: slide0Img, branded: true, tipo: 'hero' },
    // Slides 1+: banners ativos do banco (tipo png ou editavel)
    ...banners
      .filter(b => b.tipo === 'png' ? !!b.url_imagem : true) // PNG sem imagem é ignorado
      .map(b => ({
        url:           b.url_imagem || '',
        branded:       false,
        tipo:          b.tipo as 'png' | 'editavel',
        camadas:       b.camadas,
        overlay_config: b.overlay_config,
      })),
  ]

  // ── Controle do slideshow ──────────────────────────────────────────────────
  const [current, setCurrent] = useState(0)
  const [resetKey, setResetKey] = useState(0) // bump para reiniciar o timer ao navegar manualmente
  const intervaloMs = (heroConfig?.intervalo ?? 5) * 1000
  const advance = useCallback(() => setCurrent(c => (c + 1) % allSlides.length), [allSlides.length])
  const prev = useCallback(() => { setCurrent(c => (c - 1 + allSlides.length) % allSlides.length); setResetKey(k => k + 1) }, [allSlides.length])
  const next = useCallback(() => { setCurrent(c => (c + 1) % allSlides.length); setResetKey(k => k + 1) }, [allSlides.length])

  // Auto-avança o slideshow a cada `intervaloMs` ms; para quando há 1 slide só
  useEffect(() => {
    if (allSlides.length <= 1) return
    const id = setInterval(advance, intervaloMs)
    return () => clearInterval(id)
  }, [allSlides.length, advance, intervaloMs, resetKey])

  // ── Variantes de animação do layout legado ────────────────────────────────
  const containerVariants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.18, delayChildren: 0.3 } },
  }
  const lineVariants = {
    hidden:  { opacity: 0, y: 40, skewY: 3 },
    visible: { opacity: 1, y: 0, skewY: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
  }

  const slide = allSlides[current]

  return (
    <section className={styles.hero} ref={ref}>

      {/* ── Fundos: um div por slide, todos montados, opacity animada ── */}
      {allSlides.map((s, i) => (
        <motion.div
          key={`slide-${i}`}
          className={styles.bgWrap}
          style={{ y: bgY }}                                  // parallax
          animate={{ opacity: i === current ? 1 : 0 }}       // crossfade
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        >
          {s.url && (
            <Image src={s.url} alt="" fill priority={i === 0} className={styles.bgImage} sizes="100vw" />
          )}
          {/* Overlay de cor/gradiente — cada tipo de slide tem regra diferente */}
          <div
            className={styles.bgOverlay}
            style={
              s.tipo === 'hero'
                ? (overlayStyle ?? { background: 'none' })     // configurável no admin
                : s.tipo === 'editavel'
                  ? (overlayCss(s.overlay_config) ?? { background: 'none' }) // configurável por banner
                  : { background: 'none' }                     // PNG: sem overlay fixo
            }
          />
        </motion.div>
      ))}

      {/* ── Camadas do editor visual — slide 0 (hero) ── */}
      <AnimatePresence>
        {slide.tipo === 'hero' && hasCamadas && (
          <motion.div
            key="hero-layers"
            className={styles.layersContainer}
            style={{ opacity }}           // some junto com o parallax no scroll
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {heroConfig!.camadas!.map((layer, idx) => (
              layer.tipo === 'botao' ? (
                <a key={layer.id} href={layer.href || '#'} style={{ ...buttonLayerStyle(layer), zIndex: idx + 1 }}>
                  {layer.texto}
                </a>
              ) : (
                <div key={layer.id} style={{ ...layerStyle(layer), zIndex: idx + 1 }}>
                  {layer.texto}
                </div>
              )
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Camadas do editor visual — banners editáveis ── */}
      <AnimatePresence>
        {slide.tipo === 'editavel' && slide.camadas && slide.camadas.length > 0 && (
          <motion.div
            key={`editavel-layers-${current}`}  // key muda ao trocar slide — força re-mount e fade in
            className={styles.layersContainer}
            style={{ opacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {slide.camadas.map((layer, idx) => (
              layer.tipo === 'botao' ? (
                <a key={layer.id} href={layer.href || '#'} style={{ ...buttonLayerStyle(layer), zIndex: idx + 1 }}>
                  {layer.texto}
                </a>
              ) : (
                <div key={layer.id} style={{ ...layerStyle(layer), zIndex: idx + 1 }}>
                  {layer.texto}
                </div>
              )
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layout legado — slide 0 sem camadas (hero_config clássico) ── */}
      <AnimatePresence>
        {slide.tipo === 'hero' && !hasCamadas && (
          <motion.div
            key="branded-content"
            className={styles.content}
            style={{ opacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.p
              className={styles.eyebrow}
              style={{
                ...(heroConfig?.cor_eyebrow  ? { color: heroConfig.cor_eyebrow }        : {}),
                ...(heroConfig?.peso_eyebrow ? { fontWeight: heroConfig.peso_eyebrow }  : {}),
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              {eyebrow}
            </motion.p>

            {/* Cada linha do título anima com stagger */}
            <motion.h1 className={styles.title} variants={containerVariants} initial="hidden" animate="visible">
              {wordTriples.map(({ word, color, weight }, i) => {
                const isLast = i === wordTriples.length - 1
                const lineStyle: React.CSSProperties = {}
                if (color  && !isLast) lineStyle.color      = color
                if (weight && !isLast) lineStyle.fontWeight = weight
                const emStyle: React.CSSProperties = {}
                if (color)  emStyle.color      = color
                if (weight) emStyle.fontWeight = weight
                return (
                  // Última linha recebe <em> para o CSS aplicar a fonte serifada
                  <motion.span key={i} className={styles.titleLine} variants={lineVariants} style={Object.keys(lineStyle).length ? lineStyle : undefined}>
                    {isLast ? <em style={Object.keys(emStyle).length ? emStyle : undefined}>{word}</em> : word}
                  </motion.span>
                )
              })}
            </motion.h1>

            <motion.p
              className={styles.sub}
              style={{
                ...(heroConfig?.cor_subtitulo  ? { color: heroConfig.cor_subtitulo }        : {}),
                ...(heroConfig?.peso_subtitulo ? { fontWeight: heroConfig.peso_subtitulo }  : {}),
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
            >
              {subtitulo}
            </motion.p>

            <motion.div className={styles.actions} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.2 }}>
              <motion.a href="#imoveis" className={styles.btnPrimary} style={Object.keys(btn1Style).length ? btn1Style : undefined} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                {heroConfig?.btn1_texto || 'Ver Imóveis'}
              </motion.a>
              <motion.a href="#sobre" className={styles.btnGhost} style={Object.keys(btn2Style).length ? btn2Style : undefined} whileHover={{ x: 4 }}>
                {heroConfig?.btn2_texto || 'Conheça Carlos →'}
              </motion.a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Setas de navegação (visíveis apenas com múltiplos slides) ── */}
      {allSlides.length > 1 && (
        <div className={styles.arrows}>
          <button className={styles.arrow} onClick={prev} aria-label="Slide anterior">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className={styles.arrow} onClick={next} aria-label="Próximo slide">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Dots de paginação ── */}
      {allSlides.length > 1 && (
        <div className={styles.dots}>
          {allSlides.map((_, i) => (
            <button key={i} className={`${styles.dot} ${i === current ? styles.dotActive : ''}`} onClick={() => { setCurrent(i); setResetKey(k => k + 1) }} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      )}

      {/* ── Indicador de scroll (apenas quando há 1 slide) ── */}
      {allSlides.length === 1 && (
        <motion.div className={styles.scrollIndicator} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 0.8 }}>
          <motion.div className={styles.scrollLine} animate={{ scaleY: [0, 1, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.div>
      )}
    </section>
  )
}
