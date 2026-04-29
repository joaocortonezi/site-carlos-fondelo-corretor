'use client'

import { motion }  from 'framer-motion'
import Link        from 'next/link'
import ImovelCard  from '@/components/ImovelCard/ImovelCard'
import { Imovel }  from '@/lib/types'
import styles      from './ExclusiveProperties.module.css'

const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

interface Props { imoveis: Imovel[] }

export default function ExclusiveProperties({ imoveis }: Props) {
  if (!imoveis.length) return null

  const [featured, ...rest] = imoveis

  return (
    <section className={styles.section} id="imoveis">
      <div className="container">
        <motion.div
          className={styles.header}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <div>
            <h2 className={styles.title}>Imóveis Exclusivos</h2>
            <p className={styles.sub}>Captações próprias do corretor</p>
          </div>
          <motion.div whileHover={{ x: 4 }}>
            <Link href="/imoveis?exclusivo=true" className={styles.verTodos}>Ver todos os imóveis exclusivos →</Link>
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
            <ImovelCard imovel={featured} size="featured" />
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
                  transition={{ delay: 0.12 * i } as never}
                >
                  <ImovelCard imovel={imovel} size="small" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
