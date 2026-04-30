'use client'

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect, useCallback }          from 'react'
import Image                                                   from 'next/image'
import { HeroConfig }                                          from '@/lib/types'
import styles                                                  from './Hero.module.css'

interface Props {
  banners?:    Array<{ url_imagem: string }>
  heroConfig?: HeroConfig | null
}

function hexRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function Hero({ banners = [], heroConfig }: Props) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY     = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  /* Textos dinâmicos do Slide 0 */
  const eyebrow  = heroConfig?.eyebrow ?? 'Corretor de Imóveis · CRECI 000000'
  const rawWords = [
    heroConfig?.titulo_1 ?? 'O imóvel certo',
    heroConfig?.titulo_2 ?? 'para cada história',
    heroConfig?.titulo_3 ?? '',
  ]
  const rawTitleColors = [
    heroConfig?.cor_titulo_1 || null,
    heroConfig?.cor_titulo_2 || null,
    heroConfig?.cor_titulo_3 || null,
  ]
  const rawTitleWeights = [
    heroConfig?.peso_titulo_1 || null,
    heroConfig?.peso_titulo_2 || null,
    heroConfig?.peso_titulo_3 || null,
  ]
  const wordTriples = rawWords
    .map((w, i) => ({ word: w, color: rawTitleColors[i], weight: rawTitleWeights[i] }))
    .filter(({ word }) => word.trim() !== '')

  const subtitulo = heroConfig?.subtitulo ?? 'Atendimento personalizado · Compra, venda e locação'
  const slide0Img = heroConfig?.url_imagem || '/images/banner.jpg'

  /* Cor do overlay de fundo */
  const overlayStyle = (() => {
    const hex = heroConfig?.cor_fundo
    if (!hex) return undefined
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const a = heroConfig?.cor_fundo_opacidade ?? 0.55
    return { background: `rgba(${r}, ${g}, ${b}, ${a})` }
  })()

  /* Estilos inline dos botões */
  const btn1Style: React.CSSProperties = {}
  if (heroConfig?.btn1_cor_texto)    btn1Style.color      = heroConfig.btn1_cor_texto
  if (heroConfig?.btn1_cor_fundo)    btn1Style.background = hexRgba(heroConfig.btn1_cor_fundo, heroConfig.btn1_opacidade_fundo ?? 1)
  if (heroConfig?.btn1_cor_contorno) btn1Style.border     = `1px solid ${hexRgba(heroConfig.btn1_cor_contorno, heroConfig.btn1_opacidade_contorno ?? 1)}`
  if (heroConfig?.btn1_peso)         btn1Style.fontWeight = heroConfig.btn1_peso

  const btn2Style: React.CSSProperties = {}
  if (heroConfig?.btn2_cor_texto)    btn2Style.color      = heroConfig.btn2_cor_texto
  if (heroConfig?.btn2_cor_fundo)    btn2Style.background = hexRgba(heroConfig.btn2_cor_fundo, heroConfig.btn2_opacidade_fundo ?? 0)
  if (heroConfig?.btn2_cor_contorno) btn2Style.border     = `1px solid ${hexRgba(heroConfig.btn2_cor_contorno, heroConfig.btn2_opacidade_contorno ?? 0)}`
  if (heroConfig?.btn2_peso)         btn2Style.fontWeight = heroConfig.btn2_peso

  /* Slide 0 = hero com texto; slides 1+ = banners do admin */
  const allSlides = [
    { url: slide0Img, branded: true },
    ...banners.filter(b => !!b.url_imagem).map(b => ({ url: b.url_imagem, branded: false })),
  ]

  const [current, setCurrent] = useState(0)

  const advance = useCallback(() => {
    setCurrent(c => (c + 1) % allSlides.length)
  }, [allSlides.length])

  const intervaloMs = (heroConfig?.intervalo ?? 5) * 1000

  useEffect(() => {
    if (allSlides.length <= 1) return
    const id = setInterval(advance, intervaloMs)
    return () => clearInterval(id)
  }, [allSlides.length, advance, intervaloMs])

  const containerVariants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.18, delayChildren: 0.3 } },
  }
  const lineVariants = {
    hidden:  { opacity: 0, y: 40, skewY: 3 },
    visible: { opacity: 1, y: 0, skewY: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <section className={styles.hero} ref={ref}>

      {/* ── Fundos — um por slide, crossfade via opacity ── */}
      {allSlides.map((slide, i) => (
        <motion.div
          key={`slide-${i}`}
          className={styles.bgWrap}
          style={{ y: bgY }}
          animate={{ opacity: i === current ? 1 : 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        >
          <Image
            src={slide.url}
            alt=""
            fill
            priority={i === 0}
            className={styles.bgImage}
            sizes="100vw"
          />
          <div className={styles.bgOverlay} style={i === 0 ? overlayStyle : undefined} />
        </motion.div>
      ))}

      {/* ── Conteúdo da marca (só no slide 0) ── */}
      <AnimatePresence>
        {allSlides[current].branded && (
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
                ...(heroConfig?.cor_eyebrow  ? { color:      heroConfig.cor_eyebrow  } : {}),
                ...(heroConfig?.peso_eyebrow ? { fontWeight: heroConfig.peso_eyebrow } : {}),
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              {eyebrow}
            </motion.p>

            <motion.h1
              className={styles.title}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {wordTriples.map(({ word, color, weight }, i) => {
                const isLast    = i === wordTriples.length - 1
                const lineStyle: React.CSSProperties = {}
                if (color  && !isLast) lineStyle.color      = color
                if (weight && !isLast) lineStyle.fontWeight = weight
                const emStyle: React.CSSProperties = {}
                if (color)  emStyle.color      = color
                if (weight) emStyle.fontWeight = weight
                return (
                  <motion.span
                    key={i}
                    className={styles.titleLine}
                    variants={lineVariants}
                    style={Object.keys(lineStyle).length ? lineStyle : undefined}
                  >
                    {isLast
                      ? <em style={Object.keys(emStyle).length ? emStyle : undefined}>{word}</em>
                      : word}
                  </motion.span>
                )
              })}
            </motion.h1>

            <motion.p
              className={styles.sub}
              style={{
                ...(heroConfig?.cor_subtitulo  ? { color:      heroConfig.cor_subtitulo  } : {}),
                ...(heroConfig?.peso_subtitulo ? { fontWeight: heroConfig.peso_subtitulo } : {}),
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
            >
              {subtitulo}
            </motion.p>

            <motion.div
              className={styles.actions}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.2 }}
            >
              <motion.a
                href="#imoveis"
                className={styles.btnPrimary}
                style={Object.keys(btn1Style).length ? btn1Style : undefined}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                {heroConfig?.btn1_texto || 'Ver Imóveis'}
              </motion.a>
              <motion.a
                href="#sobre"
                className={styles.btnGhost}
                style={Object.keys(btn2Style).length ? btn2Style : undefined}
                whileHover={{ x: 4 }}
              >
                {heroConfig?.btn2_texto || 'Conheça Carlos →'}
              </motion.a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dots de navegação (somente quando há banners) ── */}
      {allSlides.length > 1 && (
        <div className={styles.dots}>
          {allSlides.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Scroll indicator (slide único / sem banners) ── */}
      {allSlides.length === 1 && (
        <motion.div
          className={styles.scrollIndicator}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          <motion.div
            className={styles.scrollLine}
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </section>
  )
}
