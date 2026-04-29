'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { PerfilCorretor } from '@/lib/types'
import styles from './Footer.module.css'

const navLinks = [
  { label: 'Início',     href: '/'            },
  { label: 'Imóveis',   href: '/imoveis'     },
  { label: 'Vídeos',    href: '/#videos'     },
  { label: 'Avaliações',href: '/#avaliacoes' },
  { label: 'Sobre mim', href: '/#sobre'      },
]

const socials = [
  { label: 'Instagram', href: 'https://www.instagram.com/carlosfondelo/' },
  { label: 'WhatsApp',  href: 'https://wa.me/5566996185205?text=Olá%20Carlos!%20Vim%20pelo%20site.' },
]

const legalLinks = [
  { label: 'Política de privacidade', href: '/politica-de-privacidade' },
  { label: 'Termos de uso',           href: '/termos-de-uso'           },
]

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

interface Props { perfil?: PerfilCorretor | null }

export default function Footer({ perfil }: Props) {
  const creci        = perfil?.creci         || '000000'
  const email        = perfil?.email         || 'contato@corretor.com.br'
  const telefone     = perfil?.telefone      || '(11) 99999-9000'
  const cidadeEstado = perfil?.cidade_estado || 'Cidade · Estado'

  const emailHref    = `mailto:${email}`
  const telHref      = `tel:+55${telefone.replace(/\D/g, '')}`

  return (
    <footer className={styles.footer} id="contato">
      <div className="container">
        <motion.div
          className={styles.grid}
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {/* Brand */}
          <motion.div variants={item}>
            <Image
              src="/logos/logo-full.png"
              alt="Carlos Fondelo Corretor de Imóveis"
              height={400}
              width={600}
              className={styles.footerLogo}
            />
            <p className={styles.brandCreci}>CRECI · {creci}</p>
            <p className={styles.contactItem}>
              <a href={emailHref}>{email}</a>
            </p>
            <p className={styles.contactItem}>
              <a href={telHref}>{telefone}</a>
            </p>
            <p className={styles.contactItem}>{cidadeEstado}</p>
          </motion.div>

          {/* Nav */}
          <motion.div variants={item}>
            <p className={styles.colTitle}>Navegação</p>
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className={styles.footerLink}>{l.label}</Link>
            ))}
          </motion.div>

          {/* Socials */}
          <motion.div variants={item}>
            <p className={styles.colTitle}>Redes Sociais</p>
            {socials.map(l => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>{l.label}</a>
            ))}
          </motion.div>

          {/* Legal */}
          <motion.div variants={item}>
            <p className={styles.colTitle}>Legal</p>
            {legalLinks.map(l => (
              <Link key={l.href} href={l.href} className={styles.footerLink}>{l.label}</Link>
            ))}
          </motion.div>
        </motion.div>

        <div className={styles.bottom}>
          <p className={styles.copy}>© 2025 Carlos Fondelo · Todos os direitos reservados</p>
          <p className={styles.dev}>Desenvolvido por <a href="https://www.molda.io/" target="_blank" rel="noopener noreferrer">Molda.io</a></p>
        </div>
      </div>
    </footer>
  )
}
