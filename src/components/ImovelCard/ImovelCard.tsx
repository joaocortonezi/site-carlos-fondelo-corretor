import Link       from 'next/link'
import { Imovel } from '@/lib/types'
import WatermarkedImage from '@/components/WatermarkedImage/WatermarkedImage'
import { formatPrice, formatArea } from '@/lib/utils'
import styles     from './ImovelCard.module.css'

interface Props {
  imovel:        Imovel
  size?:         'default' | 'featured' | 'small'
  watermarkUrl?: string | null
}

export default function ImovelCard({ imovel, size = 'default', watermarkUrl }: Props) {
  const fotoCapa = imovel.fotos?.sort((a, b) => a.ordem - b.ordem)[0]
  const foto = fotoCapa?.url
  // `||` em vez de `??`: slug pode ser string vazia em imóveis legados
  const href = `/imoveis/${imovel.slug || imovel.id}`

  return (
    <Link href={href} className={`${styles.card} ${styles[size]}`}>
      <div className={styles.imgWrap}>
        {foto ? (
          <WatermarkedImage
            src={foto}
            alt={imovel.titulo}
            fill
            className={styles.img}
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
            watermarkUrl={watermarkUrl}
            bakedWatermark={!!fotoCapa?.watermark_url_aplicada}
          />
        ) : (
          <div className={styles.placeholder} />
        )}
        <div className={styles.overlay} />
        {imovel.destaque && (
          <span className={`${styles.tag} ${styles.tagDestaque}`}>Destaque</span>
        )}
        <span className={`${styles.tag} ${styles.tagFinalidade} ${imovel.finalidade === 'venda' ? styles.tagVenda : styles.tagAluguel}`}>
          {imovel.finalidade === 'venda' ? 'Venda' : 'Aluguel'}
        </span>
      </div>

      <div className={styles.info}>
        <p className={styles.location}>
          {[imovel.bairro, imovel.cidade].filter(Boolean).join(' · ')}
        </p>
        <h3 className={styles.titulo}>{imovel.titulo}</h3>
        <p className={styles.price}>{formatPrice(imovel.preco)}</p>
        <div className={styles.attrs}>
          {imovel.quartos  > 0 && <span className={styles.attr}><BedIcon />{imovel.quartos} quarto{imovel.quartos > 1 ? 's' : ''}</span>}
          {imovel.banheiros > 0 && <span className={styles.attr}><BathIcon />{imovel.banheiros} banheiro{imovel.banheiros > 1 ? 's' : ''}</span>}
          {/* Card mostra apenas UMA área pra não poluir. Cliente pediu prioridade
              pra área do TERRENO. Fallback: construída → legado (compat imóveis antigos). */}
          {(imovel.area_terreno || imovel.area_construida || imovel.area) && (
            <span className={styles.attr}>
              <AreaIcon />
              {formatArea(imovel.area_terreno ?? imovel.area_construida ?? imovel.area!)}
            </span>
          )}
          {imovel.vagas    > 0 && <span className={styles.attr}><CarIcon />{imovel.vagas} vaga{imovel.vagas > 1 ? 's' : ''}</span>}
        </div>
      </div>
    </Link>
  )
}

function BedIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9V6a2 2 0 012-2h16a2 2 0 012 2v3"/><path d="M2 18v-5a2 2 0 012-2h16a2 2 0 012 2v5"/><path d="M2 18h20"/></svg> }
function BathIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6 6.5 3.5a1.5 1.5 0 00-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 002 2h12a2 2 0 002-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/></svg> }
function AreaIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> }
function CarIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h11l5 5v5a2 2 0 01-2 2h-2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg> }
