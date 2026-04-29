'use client'

import Link                           from 'next/link'
import { usePathname, useRouter }      from 'next/navigation'
import { createBrowserClient }         from '@supabase/ssr'
import styles                          from './admin.module.css'

interface Props { email?: string }

export default function AdminNav({ email }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const links = [
    { href: '/admin/imoveis',    label: 'Imóveis',    icon: <HomeIcon /> },
    { href: '/admin/leads',      label: 'Leads',      icon: <LeadsIcon /> },
    { href: '/admin/newsletter', label: 'Newsletter', icon: <MailIcon /> },
    { href: '/admin/banners',    label: 'Banners',    icon: <BannerIcon /> },
    { href: '/admin/avaliacoes', label: 'Avaliações', icon: <StarIcon /> },
    { href: '/admin/sobre',      label: 'Sobre mim',  icon: <PersonIcon /> },
  ]

  return (
    <>
      <nav className={styles.nav}>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`${styles.navLink} ${pathname.startsWith(l.href) ? styles.navLinkActive : ''}`}
          >
            {l.icon}
            {l.label}
          </Link>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        {email && <p className={styles.userEmail}>{email}</p>}
        <button className={styles.logoutBtn} onClick={logout}>Sair</button>
      </div>
    </>
  )
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function LeadsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )
}

function BannerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}
