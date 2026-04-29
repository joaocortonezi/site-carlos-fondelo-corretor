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

export default function Hero({ banners = [], heroConfig }: Props) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY     = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  /* Textos dinâmicos do Slide 0 */
  const eyebrow   = heroConfig?.eyebrow   ?? 'Corretor de Imóveis · CRECI 000000'
  const rawWords  = [
    heroConfig?.titulo_1 ?? 'O imóvel certo',
    heroConfig?.titulo_2 ?? 'para cada história',
    heroConfig?.titulo_3 ?? '',
  ]
  const words = rawWords.filter(w => w.trim() !== '')
  const subtitulo = heroConfig?.subtitulo ?? 'Atendimento personalizado · Compra, venda e locação'
  const slide0Img = heroConfig?.url_imagem || '/images/banner.jpg'

  /* Slide 0 = sempre o hero com texto; slides 1+ = banners do admin */
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
          <div className={styles.bgOverlay} />
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
              {words.map((word, i) => (
                <motion.span key={i} className={styles.titleLine} variants={lineVariants}>
                  {i === words.length - 1 ? <em>{word}</em> : word}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              className={styles.sub}
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
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Ver Imóveis
              </motion.a>
              <motion.a
                href="#sobre"
                className={styles.btnGhost}
                whileHover={{ x: 4 }}
              >
                Conheça Carlos →
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
