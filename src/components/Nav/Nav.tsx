'use client'

import { useEffect, useState }     from 'react'
import { createPortal }             from 'react-dom'
import { motion, AnimatePresence }  from 'framer-motion'
import Link                         from 'next/link'
import Image                        from 'next/image'
import LeadModal                    from '@/components/LeadModal/LeadModal'
import styles                       from './Nav.module.css'

const links = [
  { label: 'Início',   href: '/'        },
  { label: 'Imóveis',  href: '/imoveis' },
  { label: 'Sobre',    href: '/#sobre'  },
  { label: 'Contato',  href: '/#contato' },
]

export default function Nav() {
  const [scrolled,   setScrolled]   = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [mounted,    setMounted]    = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
    <motion.nav
      className={`${styles.nav} ${scrolled ? '' : styles.navTransparent}`}
      animate={{ backgroundColor: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(0,0,0,0)' }}
      transition={{ duration: 0.4 }}
      style={{
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.07)' : 'none',
      }}
    >
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <Image
            src="/logos/logo-text.png"
            alt="Carlos Fondelo Corretor de Imóveis"
            height={100}
            width={700}
            className={styles.logoImg}
            priority
          />
        </Link>

        {/* Desktop links */}
        <ul className={styles.links}>
          {links.map((l, i) => (
            <motion.li
              key={l.label}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
            >
              <Link href={l.href} className={styles.link}>{l.label}</Link>
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        <motion.button
          className={styles.cta}
          onClick={() => setModalOpen(true)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          Falar com Corretor
        </motion.button>

        {/* Mobile hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
        >
          <span className={menuOpen ? styles.barTop + ' ' + styles.barTopOpen : styles.barTop} />
          <span className={menuOpen ? styles.barMid + ' ' + styles.barMidHidden : styles.barMid} />
          <span className={menuOpen ? styles.barBot + ' ' + styles.barBotOpen : styles.barBot} />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {links.map(l => (
              <Link
                key={l.label}
                href={l.href}
                className={styles.mobileLink}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <button
              className={styles.mobileCta}
              onClick={() => { setMenuOpen(false); setModalOpen(true) }}
            >
              Falar com Corretor
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.nav>

    {mounted && createPortal(
      <LeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        origem="nav"
        titulo="Fale com Carlos Fondelo"
      />,
      document.body
    )}
  </>
  )
}
