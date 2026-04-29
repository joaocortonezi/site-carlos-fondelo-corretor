'use client'

import { useState } from 'react'
import Image        from 'next/image'
import { FotoImovel } from '@/lib/types'
import styles       from './FotoGaleria.module.css'

interface Props {
  fotos:           FotoImovel[]
  titulo:          string
  videoHorizontal?: string | null
  videoVertical?:   string | null
}

export default function FotoGaleria({ fotos, titulo, videoHorizontal, videoVertical }: Props) {
  const [current,   setCurrent]   = useState(0)
  const [videoOpen, setVideoOpen] = useState(false)

  const hasVideo = !!(videoHorizontal || videoVertical)
  const videoSrc = videoHorizontal ?? videoVertical

  const prev = () => setCurrent(i => (i - 1 + fotos.length) % fotos.length)
  const next = () => setCurrent(i => (i + 1) % fotos.length)

  return (
    <div className={styles.galeria}>

      {/* Abas Fotos / Vídeo */}
      {hasVideo && (
        <div className={styles.tabs}>
          <span className={`${styles.tab} ${styles.tabActive}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            Fotos
          </span>
          <button className={styles.tab} onClick={() => setVideoOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            Vídeo
          </button>
        </div>
      )}

      {/* Galeria de fotos */}
      {fotos.length === 0 ? (
        <div className={styles.empty}>Sem fotos disponíveis</div>
      ) : (
        <>
          <div className={styles.main}>
            <Image
              src={fotos[current].url}
              alt={`${titulo} — foto ${current + 1}`}
              fill
              className={styles.mainImg}
              sizes="(max-width:768px) 100vw, 60vw"
              priority={current === 0}
            />
            {fotos.length > 1 && (
              <>
                <button className={`${styles.arrow} ${styles.arrowPrev}`} onClick={prev} aria-label="Foto anterior">‹</button>
                <button className={`${styles.arrow} ${styles.arrowNext}`} onClick={next} aria-label="Próxima foto">›</button>
              </>
            )}
            <span className={styles.counter}>{current + 1} / {fotos.length}</span>
          </div>

          {fotos.length > 1 && (
            <div className={styles.thumbs}>
              {fotos.map((f, i) => (
                <button
                  key={f.id}
                  className={`${styles.thumb} ${i === current ? styles.thumbActive : ''}`}
                  onClick={() => setCurrent(i)}
                  aria-label={`Ver foto ${i + 1}`}
                >
                  <Image src={f.url} alt="" fill className={styles.thumbImg} sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de vídeo */}
      {videoOpen && (
        <div className={styles.modalOverlay} onClick={() => setVideoOpen(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setVideoOpen(false)} aria-label="Fechar">×</button>
            <video
              src={videoSrc!}
              controls
              autoPlay
              className={styles.modalVideo}
            />
          </div>
        </div>
      )}
    </div>
  )
}
