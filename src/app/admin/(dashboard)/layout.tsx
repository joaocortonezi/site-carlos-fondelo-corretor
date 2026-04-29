import Image                   from 'next/image'
import { createSupabaseServer } from '@/lib/supabase-server'
import AdminNav                 from './AdminNav'
import styles                   from './admin.module.css'

export const metadata = { title: 'Admin — Carlos Fondelo' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <Image
            src="/logos/logo-text.png"
            alt="Carlos Fondelo"
            height={100}
            width={700}
            className={styles.logoImg}
            priority
          />
        </div>

        <AdminNav email={user?.email} />
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  )
}
