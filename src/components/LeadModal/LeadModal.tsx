'use client'

import { useEffect }             from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LeadForm                  from '@/components/LeadForm/LeadForm'
import styles                    from './LeadModal.module.css'

interface Props {
  open:           boolean
  onClose:        () => void
  imovelId?:      string
  imovelTitulo?:  string
  origem:         string
  titulo?:        string
}

export default function LeadModal({ open, onClose, imovelId, imovelTitulo, origem, titulo }: Props) {
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
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <button className={styles.close} onClick={onClose} aria-label="Fechar">×</button>
            <p className={styles.eyebrow}>Entre em contato</p>
            <h2 className={styles.title}>{titulo ?? 'Gostou? Fale com Carlos.'}</h2>
            {imovelTitulo && <p className={styles.sub}>Imóvel: {imovelTitulo}</p>}
            <LeadForm imovelId={imovelId} imovelTitulo={imovelTitulo} origem={origem} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
