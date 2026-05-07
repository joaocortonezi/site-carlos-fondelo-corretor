'use client'

import { useState }  from 'react'
import { motion }    from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { CaptacaoConfig } from '@/lib/types'
import styles        from './CaptacaoSection.module.css'

interface Props {
  config?: CaptacaoConfig | null
}

export default function CaptacaoSection({ config }: Props) {
  const eyebrow      = config?.eyebrow        ?? 'Para proprietários'
  const tituloLinha1 = config?.titulo_linha_1 ?? 'Quer anunciar ou'
  const tituloLinha2 = config?.titulo_linha_2 ?? 'alugar seu imóvel?'
  const texto1       = config?.texto_1        ?? 'Faço a administração e gestão completa da venda ou locação do seu imóvel com muita responsabilidade e respeito, zelando e trabalhando para negociá-lo da melhor forma e pelo melhor preço possível.'
  const texto2       = config?.texto_2        ?? 'Do primeiro contato à assinatura do contrato, cuido de cada detalhe para que você tenha tranquilidade e segurança em todo o processo.'

  const [form,   setForm]   = useState({ nome: '', email: '', telefone: '', intencao: '' as 'vender' | 'alugar' | '' })
  const [busy,   setBusy]   = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)

    const mensagem = `Intenção: ${form.intencao === 'vender' ? 'Vender imóvel' : 'Alugar imóvel'}`

    const { error } = await supabase.from('leads').insert({
      nome:      form.nome,
      telefone:  form.telefone,
      email:     form.email || null,
      mensagem,
      origem:    'captacao_imovel',
    })

    if (!error) {
      fetch('/api/lead/notify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          nome:     form.nome,
          telefone: form.telefone,
          email:    form.email,
          mensagem,
          origem:   'Captação de Imóvel',
        }),
      }).catch(() => {})
    }

    setBusy(false)
    setStatus(error ? 'error' : 'ok')
  }

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
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h2 className={styles.title}>
              {tituloLinha1}<br />{tituloLinha2}
            </h2>
            <p className={styles.text}>{texto1}</p>
            <p className={styles.text}>{texto2}</p>
          </motion.div>

          <motion.div
            className={styles.visual}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          >
            {status === 'ok' ? (
              <div className={styles.card}>
                <div className={styles.cardIcon}>✓</div>
                <h3 className={styles.cardTitle}>Mensagem enviada!</h3>
                <p className={styles.cardText}>Carlos entrará em contato em breve.</p>
              </div>
            ) : (
              <form className={styles.card} onSubmit={handleSubmit}>
                <h3 className={styles.cardTitle}>Fale com Carlos</h3>

                <div className={styles.intencaoRow}>
                  <label className={`${styles.intencaoBtn} ${form.intencao === 'vender' ? styles.intencaoBtnActive : ''}`}>
                    <input type="radio" name="intencao" value="vender" checked={form.intencao === 'vender'} onChange={() => set('intencao', 'vender')} required />
                    Quero vender
                  </label>
                  <label className={`${styles.intencaoBtn} ${form.intencao === 'alugar' ? styles.intencaoBtnActive : ''}`}>
                    <input type="radio" name="intencao" value="alugar" checked={form.intencao === 'alugar'} onChange={() => set('intencao', 'alugar')} />
                    Quero alugar
                  </label>
                </div>

                <input
                  className={styles.input}
                  placeholder="Seu nome *"
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  required
                />
                <input
                  className={styles.input}
                  placeholder="WhatsApp / Telefone *"
                  value={form.telefone}
                  onChange={e => set('telefone', e.target.value)}
                  required
                />
                <input
                  className={styles.input}
                  type="email"
                  placeholder="E-mail (opcional)"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />

                {status === 'error' && (
                  <p className={styles.formError}>Erro ao enviar. Tente novamente.</p>
                )}

                <button type="submit" className={styles.submitBtn} disabled={busy}>
                  {busy ? 'Enviando…' : 'Quero anunciar meu imóvel'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
