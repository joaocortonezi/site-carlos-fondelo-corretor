'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView }            from 'framer-motion'
import Image                            from 'next/image'
import LeadForm                         from '@/components/LeadForm/LeadForm'
import { PerfilCorretor }               from '@/lib/types'
import styles                           from './About.module.css'

interface StatProps { target: number; suffix: string; label: string }

function AnimatedStat({ target, suffix, label }: StatProps) {
  const ref      = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const duration = 1400
    const start    = performance.now()
    const frame    = (now: number) => {
      const elapsed  = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [isInView, target])

  return (
    <div className={styles.statItem} ref={ref}>
      <p className={styles.statNum}>
        {count.toLocaleString('pt-BR')}<span className={styles.statSuffix}>{suffix}</span>
      </p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  )
}

const fadeLeft  = { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } }
const fadeRight = { hidden: { opacity: 0, x:  40 }, visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } }

interface Props { perfil?: PerfilCorretor | null }

export default function About({ perfil }: Props) {
  const fotoSrc = perfil?.foto_url || '/images/carlos-fondelo.jpg'
  const nome    = perfil?.nome     || 'Carlos Fondelo'
  const creci   = perfil?.creci    || '000000'
  const bio1    = perfil?.bio_1    || 'Parágrafo de apresentação: trajetória profissional, especialidades, regiões de atuação e diferenciais do atendimento personalizado.'
  const bio2    = perfil?.bio_2    || 'Comprometido com transparência e resultados, acompanha cada cliente do primeiro contato ao registro em cartório, garantindo segurança em todas as etapas.'
  const anos            = perfil?.anos_experiencia ?? 10
  const vendidos        = perfil?.imoveis_vendidos ?? 200
  const avaliacaoGoogle = perfil?.avaliacao_google ?? 5

  return (
    <section className={styles.section} id="sobre">
      <div className="container">
        <motion.h2
          className={styles.sectionTitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          Sobre mim
        </motion.h2>

        <div className={styles.inner}>
          {/* Photo */}
          <motion.div
            className={styles.photoWrap}
            variants={fadeLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            <div className={styles.photoFrame}>
              <Image
                src={fotoSrc}
                alt={`${nome} — Corretor de Imóveis`}
                fill
                sizes="220px"
                className={styles.photo}
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            className={styles.content}
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            <h2 className={styles.name}>{nome}</h2>
            <p className={styles.creci}>Corretor de Imóveis · CRECI {creci}</p>

            <p className={styles.text}>{bio1}</p>
            <p className={styles.text}>{bio2}</p>

            <div className={styles.stats}>
              <AnimatedStat target={anos}            suffix=""  label="Anos de experiência" />
              <AnimatedStat target={vendidos}        suffix=""  label="Imóveis vendidos"     />
              <AnimatedStat target={avaliacaoGoogle} suffix="★" label="Avaliação Google"     />
            </div>

            <div className={styles.formBlock} id="contato">
              <p className={styles.formLabel}>Entre em contato</p>
              <LeadForm origem="sobre" compact />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
