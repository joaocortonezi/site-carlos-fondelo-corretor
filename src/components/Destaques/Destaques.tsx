'use client'

import { motion } from 'framer-motion'
import Link       from 'next/link'
import ImovelCard from '@/components/ImovelCard/ImovelCard'
import { Imovel } from '@/lib/types'
import styles     from './Destaques.module.css'

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

interface Props { imoveis: Imovel[] }

export default function Destaques({ imoveis }: Props) {
  if (!imoveis.length) return null

  return (
    <section className={styles.section} id="destaques">
      <div className="container">
        <motion.div
          className={styles.header}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <div>
            <h2 className={styles.title}>Imóveis em Destaque</h2>
            <p className={styles.sub}>Selecionados especialmente para você</p>
          </div>
          <motion.div whileHover={{ x: 4 }}>
            <Link href="/imoveis" className={styles.verTodos}>Ver todos os imóveis →</Link>
          </motion.div>
        </motion.div>

        <div className={styles.grid}>
          {imoveis.map((imovel, i) => (
            <motion.div
              key={imovel.id}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08 } as never}
            >
              <ImovelCard imovel={imovel} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
