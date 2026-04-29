import Nav    from '@/components/Nav/Nav'
import Footer from '@/components/Footer/Footer'
import styles  from '../politica-de-privacidade/legal.module.css'

export const metadata = {
  title:       'Termos de Uso — Carlos Fondelo Corretor',
  description: 'Termos e condições de uso do site Carlos Fondelo Corretor de Imóveis.',
}

export default function TermosDeUso() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.content}>
            <h1 className={styles.title}>Termos de Uso</h1>
            <p className={styles.updated}>Última atualização: abril de 2025</p>

            <p className={styles.intro}>
              Ao acessar e utilizar o site <strong>carlosfondelo.com.br</strong>, você concorda com os presentes
              Termos de Uso. Caso não concorde, por favor não utilize o site.
            </p>

            <Section title="1. Sobre o site">
              <p>
                Este site é um canal de divulgação de imóveis e serviços de corretagem de{' '}
                <strong>Carlos Fondelo</strong>, corretor registrado no CRECI. O conteúdo é meramente informativo
                e não constitui oferta vinculante de compra, venda ou locação de imóveis.
              </p>
            </Section>

            <Section title="2. Uso permitido">
              <p>Você pode utilizar este site para:</p>
              <ul>
                <li>Consultar imóveis disponíveis para compra ou locação.</li>
                <li>Entrar em contato com o corretor para obter informações.</li>
                <li>Assistir a vídeos e visualizar fotos dos imóveis anunciados.</li>
              </ul>
            </Section>

            <Section title="3. Uso proibido">
              <p>É expressamente proibido:</p>
              <ul>
                <li>Reproduzir, distribuir ou comercializar o conteúdo deste site sem autorização prévia e por
                  escrito.</li>
                <li>Utilizar sistemas automatizados (bots, scrapers) para extração de dados.</li>
                <li>Enviar informações falsas nos formulários de contato.</li>
                <li>Praticar qualquer ato que prejudique o funcionamento do site ou viole direitos de terceiros.</li>
              </ul>
            </Section>

            <Section title="4. Precisão das informações">
              <p>
                As informações sobre imóveis (preços, metragens, disponibilidade) são fornecidas de boa-fé e
                podem ser alteradas sem aviso prévio. Recomendamos sempre confirmar os dados diretamente com o
                corretor antes de tomar qualquer decisão.
              </p>
            </Section>

            <Section title="5. Propriedade intelectual">
              <p>
                Todo o conteúdo do site — textos, imagens, vídeos, logotipo e design — é protegido por direitos
                autorais. A reprodução sem autorização é vedada e sujeita às penalidades previstas na Lei nº
                9.610/1998 (Lei de Direitos Autorais).
              </p>
            </Section>

            <Section title="6. Limitação de responsabilidade">
              <p>
                Carlos Fondelo Corretor de Imóveis não se responsabiliza por:
              </p>
              <ul>
                <li>Indisponibilidade temporária do site por manutenção ou falha técnica.</li>
                <li>Decisões tomadas com base exclusivamente nas informações do site, sem consulta ao corretor.</li>
                <li>Conteúdo de sites externos acessados por links presentes neste site.</li>
              </ul>
            </Section>

            <Section title="7. Formulário de contato e leads">
              <p>
                Ao preencher um formulário de contato neste site, você autoriza o contato pelo corretor por
                telefone, WhatsApp ou e-mail para tratar do assunto indicado. Para mais informações sobre o
                tratamento dos seus dados, consulte nossa{' '}
                <a href="/politica-de-privacidade">Política de Privacidade</a>.
              </p>
            </Section>

            <Section title="8. Legislação aplicável">
              <p>
                Estes Termos são regidos pelas leis brasileiras, em especial o Código de Defesa do Consumidor
                (Lei nº 8.078/1990), o Código Civil (Lei nº 10.406/2002) e a LGPD (Lei nº 13.709/2018). Fica
                eleito o foro da comarca de domicílio do corretor para dirimir eventuais controvérsias.
              </p>
            </Section>

            <Section title="9. Alterações nos termos">
              <p>
                Estes Termos podem ser atualizados a qualquer momento. A versão vigente estará sempre disponível
                nesta página. O uso continuado do site após alterações implica aceitação dos novos termos.
              </p>
            </Section>

            <Section title="10. Contato">
              <p>
                Dúvidas sobre estes Termos podem ser enviadas pelo e-mail ou WhatsApp indicados no rodapé do site.
              </p>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}
