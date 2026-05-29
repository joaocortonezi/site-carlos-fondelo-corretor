'use client'

import { motion } from 'framer-motion'
import Link       from 'next/link'
import ImovelCard from '@/components/ImovelCard/ImovelCard'
import { Imovel } from '@/lib/types'
import styles     from './HighEnd.module.css'

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

interface Props { imoveis: Imovel[]; watermarkUrl?: string | null }

export default function HighEnd({ imoveis, watermarkUrl }: Props) {
  if (!imoveis.length) return null

  const [featured, ...rest] = imoveis

  return (
    <section className={styles.section}>
      <div className="container">
        <motion.div
          className={styles.header}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <div>
            <h2 className={styles.title}>Imóveis de Alto Padrão</h2>
            <p className={styles.sub}>Selecionados · acima de R$ 900k</p>
          </div>
          <motion.div whileHover={{ x: 4 }}>
            <Link href="/imoveis?alto_padrao=true" className={styles.verMais}>Ver Mais →</Link>
          </motion.div>
        </motion.div>

        <div className={styles.grid}>
          <motion.div
            className={styles.featuredSlot}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
          >
            <ImovelCard imovel={featured} size="featured" watermarkUrl={watermarkUrl} />
          </motion.div>

          {rest.length > 0 && (
            <div className={styles.smallCol}>
              {rest.map((imovel, i) => (
                <motion.div
                  key={imovel.id}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: 0.1 + i * 0.1 } as never}
                >
                  <ImovelCard imovel={imovel} size="small" watermarkUrl={watermarkUrl} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
