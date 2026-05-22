// Layout compartilhado de todas as páginas públicas do site.
// O Footer é renderizado UMA VEZ aqui — todas as páginas dentro de (site)
// herdam o mesmo rodapé com os dados reais do corretor.

import SiteFooter from '@/components/Footer/SiteFooter'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
