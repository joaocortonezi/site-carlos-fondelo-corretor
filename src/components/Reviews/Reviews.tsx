'use client'

import { useState }                from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createBrowserClient }     from '@supabase/ssr'
import { Avaliacao }               from '@/lib/types'
import styles                      from './Reviews.module.css'

interface ReviewRow {
  id:       string
  nome:     string
  texto:    string
  via:      string | null
  estrelas: number
}

function initials(nome: string | null | undefined) {
  if (!nome) return '?'
  const parts = nome.trim().split(/\s+/)
  return (parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].substring(0, 2)
  ).toUpperCase()
}

const stagger     = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }
const cardVariant = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }

interface Props {
  avaliacoes?: ReviewRow[]
}

export default function Reviews({ avaliacoes }: Props) {
  const [formOpen, setFormOpen] = useState(false)

  const rows: ReviewRow[] = avaliacoes ?? []
  const hasReviews = rows.length > 0

  return (
    <section className={styles.section} id="avaliacoes">
      <div className="container">
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.title}>O que dizem os clientes</h2>
          {hasReviews && (
            <div className={styles.rating}>
              <span className={styles.stars} aria-label="5 estrelas">★★★★★</span>
              <span className={styles.score}>5,0</span>
              <span className={styles.count}>· {rows.length} avaliação{rows.length !== 1 ? 'ões' : ''}</span>
            </div>
          )}
        </motion.div>

        {hasReviews ? (
          <motion.div
            className={styles.grid}
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
          >
            {rows.map(r => (
              <motion.div key={r.id} className={styles.card} variants={cardVariant} whileHover={{ y: -4 }}>
                <span className={styles.quoteMark} aria-hidden="true">&quot;</span>
                <div className={styles.author}>
                  <div className={styles.avatar}>{initials(r.nome)}</div>
                  <div>
                    <p className={styles.name}>{r.nome}</p>
                    <p className={styles.authorStars} aria-label={`${r.estrelas} estrelas`}>
                      {'★'.repeat(r.estrelas)}{'☆'.repeat(5 - r.estrelas)}
                    </p>
                  </div>
                </div>
                <p className={styles.text}>&quot;{r.texto}&quot;</p>
                {r.via && <p className={styles.via}>{r.via}</p>}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.p
            className={styles.emptyState}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Seja o primeiro a compartilhar sua experiência.
          </motion.p>
        )}

        <motion.div
          className={styles.ctaWrap}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            className={`${styles.ctaBtn} ${styles.ctaBtnSecondary}`}
            onClick={() => setFormOpen(true)}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            Deixe sua avaliação
          </motion.button>
        </motion.div>
      </div>

      <AnimatePresence>
        {formOpen && <AvaliacaoModal onClose={() => setFormOpen(false)} />}
      </AnimatePresence>
    </section>
  )
}

// ─── Modal de envio de avaliação ──────────────────────────────────────────────

function AvaliacaoModal({ onClose }: { onClose: () => void }) {
  const [nome,     setNome]     = useState('')
  const [texto,    setTexto]    = useState('')
  const [estrelas, setEstrelas] = useState(5)
  const [busy,     setBusy]     = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !texto.trim()) { setError('Preencha nome e texto.'); return }
    setBusy(true)
    setError('')

    const month = new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace(' de ', '/')
    const { error: err } = await supabase.from('avaliacoes').insert({
      nome:     nome.trim(),
      texto:    texto.trim(),
      estrelas,
      via:      `via Site · ${month}`,
      aprovado: false,
      origem:   'cliente',
    })

    if (err) { setError('Erro ao enviar. Tente novamente.'); setBusy(false); return }
    setDone(true)
    setBusy(false)
  }

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modalPanel}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{    opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <button className={styles.modalClose} onClick={onClose} aria-label="Fechar">×</button>

        {done ? (
          <div className={styles.doneWrap}>
            <p className={styles.doneIcon}>★</p>
            <h3 className={styles.doneTitle}>Avaliação enviada!</h3>
            <p className={styles.doneSub}>Obrigado pelo seu comentário. Após revisão, ele aparecerá no site.</p>
            <button className={styles.doneBtn} onClick={onClose}>Fechar</button>
          </div>
        ) : (
          <>
            <p className={styles.modalEyebrow}>Avaliação</p>
            <h3 className={styles.modalTitle}>Conte sua experiência</h3>
            <p className={styles.modalSub}>Sua avaliação será publicada após revisão.</p>

            {error && <p className={styles.modalError}>{error}</p>}

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <input
                className={styles.modalInput}
                placeholder="Seu nome *"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
              />

              <div className={styles.starsRow}>
                {[1,2,3,4,5].map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.starBtn} ${s <= estrelas ? styles.starBtnOn : ''}`}
                    onClick={() => setEstrelas(s)}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                className={`${styles.modalInput} ${styles.modalTextarea}`}
                placeholder="Conte sua experiência *"
                value={texto}
                onChange={e => setTexto(e.target.value)}
                rows={4}
                required
              />

              <button type="submit" className={styles.modalSubmit} disabled={busy}>
                {busy ? 'Enviando…' : 'Enviar avaliação'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
