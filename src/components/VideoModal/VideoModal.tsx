'use client'

import { useEffect }               from 'react'
import { motion, AnimatePresence }  from 'framer-motion'
import LeadForm                    from '@/components/LeadForm/LeadForm'
import styles                      from './VideoModal.module.css'

interface Props {
  open:           boolean
  onClose:        () => void
  videoUrl:       string | null
  titulo:         string
  imovelId?:      string
  imovelTitulo?:  string
}

export default function VideoModal({ open, onClose, videoUrl, titulo, imovelId, imovelTitulo }: Props) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1    }}
            exit={{    opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <button className={styles.close} onClick={onClose} aria-label="Fechar">×</button>

            <div className={styles.inner}>
              {videoUrl && (
                <div className={styles.videoWrap}>
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    playsInline
                    className={styles.video}
                    preload="metadata"
                  />
                </div>
              )}

              <div className={`${styles.formWrap} ${!videoUrl ? styles.formWrapFull : ''}`}>
                <p className={styles.eyebrow}>Tem interesse?</p>
                <h2 className={styles.title}>{titulo}</h2>
                <p className={styles.sub}>Deixe seu contato e Carlos fala com você hoje.</p>
                <LeadForm
                  imovelId={imovelId}
                  imovelTitulo={imovelTitulo ?? titulo}
                  origem="video"
                  compact
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
