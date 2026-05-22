import Nav    from '@/components/Nav/Nav'
import styles from './obrigado.module.css'

export const metadata = { title: 'Obrigado — Carlos Fondelo Corretor' }

const WHATSAPP = '5566996185205'

export default function ObrigadoPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>Mensagem recebida</p>
          <h1 className={styles.title}>
            Obrigado pelo<br />contato!
          </h1>
          <p className={styles.text}>
            Carlos Fondelo retornará em breve.<br />
            Enquanto isso, você pode falar diretamente pelo WhatsApp.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP}?text=Olá%20Carlos!%20Acabei%20de%20preencher%20o%20formulário%20no%20seu%20site.`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnWa}
          >
            <WhatsAppIcon />
            Falar pelo WhatsApp
          </a>
          <a href="/" className={styles.btnBack}>← Voltar ao site</a>
        </div>
      </main>
    </>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.557 4.116 1.535 5.845L.057 23.625a.75.75 0 00.918.918l5.78-1.478A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.654-.493-5.19-1.357l-.372-.218-3.862.987.987-3.862-.218-.372A10 10 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  )
}
