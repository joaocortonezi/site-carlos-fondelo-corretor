'use client'

import { motion } from 'framer-motion'
import styles     from './CaptacaoSection.module.css'

interface Props { telefone?: string | null }

export default function CaptacaoSection({ telefone }: Props) {
  const phone = (telefone ?? '').replace(/\D/g, '') || '5500000000000'
  const waLink = `https://wa.me/${phone}?text=${encodeURIComponent('Olá Carlos, tenho um imóvel e gostaria de conversar sobre a venda ou locação.')}`

  return (
    <section className={styles.section} id="anunciar">
      <div className="container">
        <div className={styles.inner}>
          <motion.div
            className={styles.content}
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className={styles.eyebrow}>Para proprietários</p>
            <h2 className={styles.title}>
              Quer anunciar ou<br />alugar seu imóvel?
            </h2>
            <p className={styles.text}>
              Faço a administração e gestão completa da venda ou locação do seu imóvel
              com muita responsabilidade e respeito, zelando e trabalhando para
              negociá-lo da melhor forma e pelo melhor preço possível.
            </p>
            <p className={styles.text}>
              Do primeiro contato à assinatura do contrato, cuido de cada detalhe para
              que você tenha tranquilidade e segurança em todo o processo.
            </p>
            <motion.a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btn}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Falar com Carlos pelo WhatsApp
            </motion.a>
          </motion.div>

          <motion.div
            className={styles.visual}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          >
            <div className={styles.card}>
              <div className={styles.cardIcon}>🏡</div>
              <h3 className={styles.cardTitle}>Como funciona</h3>
              <ul className={styles.steps}>
                <li><span className={styles.num}>01</span><span>Avaliação gratuita do seu imóvel</span></li>
                <li><span className={styles.num}>02</span><span>Criação do anúncio com fotos profissionais</span></li>
                <li><span className={styles.num}>03</span><span>Divulgação ativa para compradores e locatários</span></li>
                <li><span className={styles.num}>04</span><span>Negociação e acompanhamento até a assinatura</span></li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
