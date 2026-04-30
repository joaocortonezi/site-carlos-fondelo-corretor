'use client'

import { useState }           from 'react'
import { motion }             from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import styles                 from './NewsletterSection.module.css'

export default function NewsletterSection() {
  const [email,   setEmail]   = useState('')
  const [nome,    setNome]    = useState('')
  const [status,  setStatus]  = useState<'idle' | 'busy' | 'ok' | 'error'>('idle')
  const [msg,     setMsg]     = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('busy')
    setMsg('')

    const { error } = await supabase.from('newsletter_subscribers').insert({
      email:         email.toLowerCase().trim(),
      nome:          nome.trim() || null,
      confirmado:    true,
      confirmado_at: new Date().toISOString(),
      opt_in_origem: 'newsletter_section',
    })

    if (error) {
      if (error.code === '23505') {
        setStatus('ok')
        setMsg('Você já está na nossa lista. Obrigado!')
      } else {
        setStatus('error')
        setMsg('Erro ao cadastrar. Tente novamente.')
      }
    } else {
      fetch('/api/newsletter/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), nome: nome.trim() || null }),
      }).catch(() => {})
      setStatus('ok')
      setMsg('Cadastro realizado! Em breve você receberá nossas novidades.')
      setEmail('')
      setNome('')
    }
  }

  return (
    <section className={styles.section} id="newsletter">
      <div className="container">
        <motion.div
          className={styles.inner}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.text}>
            <p className={styles.eyebrow}>Fique por dentro</p>
            <h2 className={styles.title}>Oportunidades em primeira mão</h2>
            <p className={styles.sub}>
              Novidades do mercado imobiliário de Sinop e região direto no seu e-mail.
            </p>
          </div>

          {status === 'ok' ? (
            <div className={styles.success}>
              <span className={styles.successIcon}>✓</span>
              <p>{msg}</p>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <input
                className={styles.input}
                type="text"
                placeholder="Seu nome *"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
              />
              <input
                className={styles.input}
                type="email"
                placeholder="Seu melhor e-mail *"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              {status === 'error' && <p className={styles.error}>{msg}</p>}
              <button type="submit" className={styles.btn} disabled={status === 'busy'}>
                {status === 'busy' ? 'Cadastrando…' : 'Receber novidades'}
              </button>
              <p className={styles.privacy}>
                Seus dados estão seguros. Você pode cancelar quando quiser.{' '}
                <a href="/politica-de-privacidade" className={styles.privacyLink}>Política de privacidade</a>
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}
