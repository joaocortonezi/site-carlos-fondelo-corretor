// ─── Seção Cinemascope ────────────────────────────────────────────────────────
// Seção visual de foto pessoal do corretor em proporção 2.35:1 (padrão Cinemascope).
// Renderiza apenas quando imageUrl está preenchido — se vazio, retorna null e
// a seção simplesmente não ocupa espaço na página.
// A imagem é gerenciada via /admin/sobre (card "Foto Cinemascope").

import Image  from 'next/image'
import styles from './CinemaSection.module.css'

interface Props {
  imageUrl?: string | null
}

export default function CinemaSection({ imageUrl }: Props) {
  // Oculta a seção inteira quando não há imagem configurada
  if (!imageUrl) return null

  return (
    <section className={styles.section}>
      {/* Frame com aspect-ratio 2.35:1 — a imagem preenche sem distorcer */}
      <div className={styles.frame}>
        <Image
          src={imageUrl}
          alt=""               // decorativo — sem texto alternativo semântico
          fill
          sizes="100vw"
          className={styles.image}
        />
      </div>
    </section>
  )
}
