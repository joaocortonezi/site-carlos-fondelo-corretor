// ─── WatermarkedImage ─────────────────────────────────────────────────────────
// Wrapper sobre next/image que renderiza a marca d'água como overlay CSS
// no canto inferior direito. Não modifica a imagem original — basta desligar
// a watermark globalmente e o overlay some.
//
// Por que overlay e não queimar nos pixels:
// - Imagem original preservada
// - Trocar / desligar a watermark é instantâneo (não reprocessa nada)
// - Mesmo storage da imagem (sem duplicação)
//
// Fotos antigas que já têm watermark "queimada" (do batch anterior, marcadas
// com `bakedWatermark={true}`) NÃO recebem overlay — pra evitar marca duplicada.

import Image, { ImageProps } from 'next/image'
import styles                from './WatermarkedImage.module.css'

type Props = Omit<ImageProps, 'src'> & {
  src: string
  /** URL da PNG da marca d'água. null = sem overlay. */
  watermarkUrl?: string | null
  /** true quando a foto já tem watermark queimada no pixel → não aplica overlay. */
  bakedWatermark?: boolean
  /** Wrapper className adicional (o Image dentro usa o className normal). */
  wrapperClassName?: string
}

export default function WatermarkedImage({
  src,
  watermarkUrl,
  bakedWatermark = false,
  wrapperClassName,
  ...imageProps
}: Props) {
  const showOverlay = !!watermarkUrl && !bakedWatermark

  return (
    <div className={`${styles.wrap} ${wrapperClassName ?? ''}`}>
      <Image src={src} {...imageProps} />
      {showOverlay && (
        // <img> simples (não Image) pra evitar otimização desnecessária — a logo é
        // sempre a mesma URL e geralmente PNG pequena. unoptimized via Image também
        // funcionaria, mas <img> é mais leve no DOM aqui.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={watermarkUrl!}
          alt=""
          aria-hidden="true"
          className={styles.watermark}
          loading="lazy"
        />
      )}
    </div>
  )
}
