'use client'

import { useRef, useState } from 'react'
import { motion }           from 'framer-motion'
import Image                from 'next/image'
import VideoModal           from '@/components/VideoModal/VideoModal'
import { formatPrice }      from '@/lib/utils'
import styles               from './Videos.module.css'

interface Foto   { id: string; url: string; ordem: number }
interface Imovel {
  id:             string
  titulo:         string
  bairro:         string | null
  cidade:         string
  preco:          number | null
  video_vertical: string
  slug:           string
  fotos:          Foto[]
}

interface Props { imoveis: Imovel[] }

function getThumb(imovel: Imovel): string {
  const sorted = [...imovel.fotos].sort((a, b) => a.ordem - b.ordem)
  if (sorted.length > 0) return sorted[0].url
  // Gera thumbnail do vídeo via Cloudinary (frame no segundo 1)
  return imovel.video_vertical
    .replace('/video/upload/', '/video/upload/so_1/')
    .replace(/\.[^.]+$/, '.jpg')
}

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

export default function Videos({ imoveis }: Props) {
  const constraintsRef = useRef<HTMLDivElement>(null)
  const isDragging     = useRef(false)
  const [active, setActive] = useState<Imovel | null>(null)

  if (!imoveis.length) return null

  const handleCardClick = (imovel: Imovel) => {
    if (isDragging.current) return
    setActive(imovel)
  }

  return (
    <section className={styles.section} id="videos">
      <div className="container">
        <motion.div
          className={styles.header}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <div>
            <h2 className={styles.title}>Vídeos dos Imóveis</h2>
            <p className={styles.format}>Formato vertical · Reels / Shorts</p>
          </div>
        </motion.div>
      </div>

      {/* Drag strip */}
      <div className={styles.stripWrap} ref={constraintsRef}>
        <motion.div
          className={styles.strip}
          drag="x"
          dragConstraints={constraintsRef}
          dragElastic={0.08}
          whileDrag={{ cursor: 'grabbing' }}
          style={{ cursor: 'grab' }}
          onDragStart={() => { isDragging.current = true }}
          onDragEnd={()   => { setTimeout(() => { isDragging.current = false }, 80) }}
        >
          <div className={styles.stripPad} />
          {imoveis.map((imovel, i) => (
            <motion.div
              key={imovel.id}
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              whileHover={{ y: -4 }}
              onClick={() => handleCardClick(imovel)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.thumb}>
                <Image
                  src={getThumb(imovel)}
                  alt={imovel.titulo}
                  fill
                  sizes="200px"
                  className={styles.thumbImg}
                />
                <div className={styles.thumbOverlay} />
                <div className={styles.playBtn} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
              <div className={styles.info}>
                <p className={styles.cardTitle}>{imovel.titulo}</p>
                <p className={styles.cardMeta}>
                  {[imovel.bairro, imovel.cidade].filter(Boolean).join(' · ')}
                  {imovel.preco ? ` · ${formatPrice(imovel.preco)}` : ''}
                </p>
              </div>
            </motion.div>
          ))}
          <div className={styles.stripPad} />
        </motion.div>
      </div>

      <div className="container">
        <motion.p
          className={styles.hint}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          ← Arraste para ver mais →
        </motion.p>
      </div>

      <VideoModal
        open={active !== null}
        onClose={() => setActive(null)}
        videoUrl={active?.video_vertical ?? null}
        titulo={active?.titulo ?? ''}
        imovelId={active?.id}
        imovelTitulo={active?.titulo}
      />
    </section>
  )
}
