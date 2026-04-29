'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import styles from './PropertyCard.module.css'
import type { Property } from '@/data/properties'

const tagLabels: Record<string, string> = {
  exclusivo:  'Exclusivo',
  destaque:   'Destaque',
  venda:      'Venda',
  lancamento: 'Lançamento',
}

interface Props {
  property: Property
  size?: 'featured' | 'small' | 'default'
}

export default function PropertyCard({ property, size = 'default' }: Props) {
  const { name, location, price, beds, baths, parking, tag, ref, image } = property

  return (
    <motion.article
      className={`${styles.card} ${styles[size]}`}
      whileHover="hover"
      initial="rest"
    >
      {/* Image */}
      <div className={styles.imgWrap}>
        <motion.div
          className={styles.imgInner}
          variants={{ rest: { scale: 1 }, hover: { scale: 1.06 } }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={image}
            alt={name}
            fill
            sizes={size === 'featured' ? '50vw' : '33vw'}
            className={styles.img}
          />
        </motion.div>

        {/* Overlay gradient */}
        <div className={styles.overlay} />

        {/* Tag */}
        <span className={`${styles.tag} ${styles['tag_' + tag]}`}>
          {tagLabels[tag]}
        </span>

        {/* Ref */}
        {ref && <span className={styles.ref}>Ref. {ref}</span>}
      </div>

      {/* Info */}
      <div className={styles.info}>
        <p className={styles.name}>{name}</p>
        <p className={styles.location}>{location}</p>
        <motion.p
          className={styles.price}
          variants={{ rest: { color: 'var(--gold)' }, hover: { color: 'var(--gold-light)' } }}
          transition={{ duration: 0.25 }}
        >
          {price}
        </motion.p>

        {(beds || baths || parking) && (
          <div className={styles.attrs}>
            {beds    && <Attr icon="bed"     label={`${beds} dorms`} />}
            {baths   && <Attr icon="bath"    label={`${baths} ban.`} />}
            {parking && <Attr icon="parking" label={`${parking} vaga`} />}
          </div>
        )}
      </div>
    </motion.article>
  )
}

function Attr({ icon, label }: { icon: string; label: string }) {
  return (
    <span className={styles.attr}>
      <AttrIcon name={icon} />
      {label}
    </span>
  )
}

function AttrIcon({ name }: { name: string }) {
  if (name === 'bed') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
  if (name === 'bath') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 12h16M4 6h16M4 18h7"/>
    </svg>
  )
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2"/>
    </svg>
  )
}
