import Nav        from '@/components/Nav/Nav'
import SiteFooter from '@/components/Footer/SiteFooter'
import styles     from './legal.module.css'

export const metadata = {
  title:       'Política de Privacidade — Carlos Fondelo Corretor',
  description: 'Política de privacidade e proteção de dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).',
}

export default function PoliticaDePrivacidade() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.content}>
            <h1 className={styles.title}>Política de Privacidade</h1>
            <p className={styles.updated}>Última atualização: abril de 2025</p>

            <p className={styles.intro}>
              Esta Política de Privacidade descreve como <strong>Carlos Fondelo Corretor de Imóveis</strong> coleta,
              usa, armazena e protege os seus dados pessoais, em conformidade com a{' '}
              <strong>Lei Geral de Proteção de Dados — LGPD (Lei nº 13.709/2018)</strong>.
            </p>

            <Section title="1. Quem somos">
              <p>
                O responsável pelo tratamento dos dados é <strong>Carlos Fondelo</strong>, corretor de imóveis
                devidamente registrado no CRECI, com atuação no estado de Mato Grosso. Este site
                (<strong>carlosfondelo.com.br</strong>) é o canal digital de apresentação de imóveis e captação
                de contatos.
              </p>
            </Section>

            <Section title="2. Quais dados coletamos">
              <p>Coletamos apenas os dados estritamente necessários para prestar nosso serviço:</p>
              <ul>
                <li><strong>Nome completo</strong> — para identificação e atendimento personalizado.</li>
                <li><strong>Número de telefone</strong> — para contato via WhatsApp ou ligação.</li>
                <li><strong>E-mail</strong> (opcional) — para envio de informações sobre imóveis de interesse.</li>
                <li><strong>Mensagem / interesse</strong> — para entender melhor sua necessidade.</li>
                <li><strong>Dados de navegação</strong> — como páginas visitadas e tempo de sessão, coletados de
                  forma anônima para melhoria do site.</li>
              </ul>
            </Section>

            <Section title="3. Como usamos seus dados">
              <p>Seus dados são utilizados exclusivamente para:</p>
              <ul>
                <li>Responder ao seu contato e apresentar imóveis compatíveis com seu perfil.</li>
                <li>Agendar visitas e negociações.</li>
                <li>Enviar informações sobre novos imóveis, caso você tenha autorizado.</li>
                <li>Melhorar a experiência de navegação no site.</li>
              </ul>
              <p>Seus dados <strong>não são vendidos, alugados ou compartilhados</strong> com terceiros para fins
                comerciais.</p>
            </Section>

            <Section title="4. Base legal para o tratamento">
              <p>O tratamento dos seus dados pessoais é fundamentado nas seguintes bases legais previstas na LGPD:</p>
              <ul>
                <li><strong>Consentimento (art. 7º, I)</strong> — ao preencher o formulário de contato, você
                  consente com o uso dos seus dados.</li>
                <li><strong>Legítimo interesse (art. 7º, IX)</strong> — para melhorias do site e comunicações
                  relacionadas ao seu interesse declarado.</li>
                <li><strong>Execução de contrato (art. 7º, V)</strong> — quando avançamos para uma negociação
                  formal de compra, venda ou locação.</li>
              </ul>
            </Section>

            <Section title="5. Por quanto tempo guardamos seus dados">
              <p>
                Mantemos seus dados pelo prazo necessário ao atendimento da finalidade para a qual foram coletados,
                ou enquanto houver interesse mútuo. Após esse período, os dados são eliminados ou anonimizados,
                salvo obrigação legal de retenção.
              </p>
            </Section>

            <Section title="6. Seus direitos como titular">
              <p>Nos termos da LGPD, você tem direito a:</p>
              <ul>
                <li>Confirmar a existência de tratamento dos seus dados.</li>
                <li>Acessar os dados que temos sobre você.</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
                <li>Solicitar a anonimização, bloqueio ou eliminação dos seus dados.</li>
                <li>Revogar o consentimento a qualquer momento.</li>
                <li>Solicitar a portabilidade dos dados a outro fornecedor de serviço.</li>
              </ul>
              <p>
                Para exercer qualquer desses direitos, entre em contato pelo e-mail indicado no rodapé ou via
                WhatsApp.
              </p>
            </Section>

            <Section title="7. Segurança dos dados">
              <p>
                Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não
                autorizado, perda, destruição ou divulgação indevida. Os dados são armazenados em servidores
                seguros com criptografia em trânsito (HTTPS) e em repouso.
              </p>
            </Section>

            <Section title="8. Cookies e rastreamento">
              <p>
                Este site pode utilizar cookies técnicos essenciais para o funcionamento das páginas. Não utilizamos
                cookies de rastreamento publicitário de terceiros sem o seu consentimento explícito.
              </p>
            </Section>

            <Section title="9. Links externos">
              <p>
                Nosso site pode conter links para páginas externas (ex.: Instagram, WhatsApp). Não nos
                responsabilizamos pelas políticas de privacidade dessas plataformas.
              </p>
            </Section>

            <Section title="10. Alterações nesta política">
              <p>
                Esta Política pode ser atualizada periodicamente. A versão mais recente estará sempre disponível
                nesta página com a data da última atualização.
              </p>
            </Section>

            <Section title="11. Contato">
              <p>
                Dúvidas, solicitações ou reclamações relacionadas à privacidade podem ser enviadas para o e-mail
                indicado no rodapé do site ou via WhatsApp. Responderemos em até 15 dias úteis, conforme previsto
                na LGPD.
              </p>
            </Section>
          </div>
        </div>
      </main>
      <SiteFooter />
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
