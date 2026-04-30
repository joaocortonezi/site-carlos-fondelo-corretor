import type { Metadata }  from 'next'
import {
  DM_Sans,
  Playfair_Display,
  Cormorant_Garamond,
  Lora,
  Montserrat,
  Raleway,
  Josefin_Sans,
  EB_Garamond,
  Cinzel,
  Inter,
} from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets:  ['latin'],
  weight:   ['300','400','500','600','700'],
  variable: '--font-body',
  display:  'swap',
})

const playfair = Playfair_Display({
  subsets:  ['latin'],
  weight:   ['400','500','600','700','800','900'],
  style:    ['normal','italic'],
  variable: '--font-playfair',
  display:  'swap',
})

const cormorant = Cormorant_Garamond({
  subsets:  ['latin'],
  weight:   ['300','400','500','600','700'],
  style:    ['normal','italic'],
  variable: '--font-cormorant',
  display:  'swap',
})

const lora = Lora({
  subsets:  ['latin'],
  weight:   ['400','500','600','700'],
  style:    ['normal','italic'],
  variable: '--font-lora',
  display:  'swap',
})

const montserrat = Montserrat({
  subsets:  ['latin'],
  weight:   ['300','400','500','600','700','800','900'],
  style:    ['normal','italic'],
  variable: '--font-montserrat',
  display:  'swap',
})

const raleway = Raleway({
  subsets:  ['latin'],
  weight:   ['300','400','500','600','700','800'],
  style:    ['normal','italic'],
  variable: '--font-raleway',
  display:  'swap',
})

const josefin = Josefin_Sans({
  subsets:  ['latin'],
  weight:   ['100','200','300','400','500','600','700'],
  style:    ['normal','italic'],
  variable: '--font-josefin',
  display:  'swap',
})

const ebGaramond = EB_Garamond({
  subsets:  ['latin'],
  weight:   ['400','500','600','700','800'],
  style:    ['normal','italic'],
  variable: '--font-eb-garamond',
  display:  'swap',
})

const cinzel = Cinzel({
  subsets:  ['latin'],
  weight:   ['400','500','600','700','800','900'],
  variable: '--font-cinzel',
  display:  'swap',
})

const inter = Inter({
  subsets:  ['latin'],
  weight:   ['300','400','500','600','700','800'],
  variable: '--font-inter',
  display:  'swap',
})

export const metadata: Metadata = {
  title:       'Carlos Fondelo — Corretor de Imóveis',
  description: 'Corretor de imóveis especializado em imóveis residenciais e comerciais. Atendimento personalizado, compra, venda e locação.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={[
        dmSans.variable,
        playfair.variable,
        cormorant.variable,
        lora.variable,
        montserrat.variable,
        raleway.variable,
        josefin.variable,
        ebGaramond.variable,
        cinzel.variable,
        inter.variable,
      ].join(' ')}
    >
      <body>{children}</body>
    </html>
  )
}
