import Image  from 'next/image'
import styles from './CinemaSection.module.css'

interface Props {
  imageUrl?: string | null
}

export default function CinemaSection({ imageUrl }: Props) {
  if (!imageUrl) return null

  return (
    <section className={styles.section}>
      <div className={styles.frame}>
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="100vw"
          className={styles.image}
        />
      </div>
    </section>
  )
}
