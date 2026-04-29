'use client'

import { useState }         from 'react'
import { useRouter }        from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import styles               from './LeadForm.module.css'

interface Props {
  imovelId?:     string
  imovelTitulo?: string
  origem:        string
  onSuccess?:    () => void
  compact?:      boolean
}

export default function LeadForm({ imovelId, imovelTitulo, origem, onSuccess, compact }: Props) {
  const router = useRouter()
  const [form,  setForm]  = useState({ nome: '', telefone: '', email: '', mensagem: '' })
  const [optIn, setOptIn] = useState(false)
  const [busy,  setBusy]  = useState(false)
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')

    const { error: err } = await supabase.from('leads').insert({
      nome:          form.nome,
      telefone:      form.telefone,
      email:         form.email    || null,
      mensagem:      form.mensagem || null,
      imovel_id:     imovelId     || null,
      imovel_titulo: imovelTitulo || null,
      origem,
    })

    if (err) { setError('Erro ao enviar. Tente novamente.'); setBusy(false); return }

    if (optIn && form.email) {
      await supabase.from('newsletter_subscribers').upsert(
        { email: form.email, nome: form.nome || null, confirmado: true, confirmado_at: new Date().toISOString(), opt_in_origem: origem },
        { onConflict: 'email', ignoreDuplicates: true }
      )
    }

    if (onSuccess) onSuccess()
    else router.push('/obrigado')
  }

  return (
    <form onSubmit={handleSubmit} className={`${styles.form} ${compact ? styles.compact : ''}`}>
      {error && <p className={styles.error}>{error}</p>}

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
        placeholder="E-mail (opcional)"
        type="email"
        value={form.email}
        onChange={e => set('email', e.target.value)}
      />
      {!compact && (
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          placeholder="Mensagem (opcional)"
          value={form.mensagem}
          onChange={e => set('mensagem', e.target.value)}
          rows={3}
        />
      )}

      <label className={styles.optIn}>
        <input
          type="checkbox"
          checked={optIn}
          onChange={e => setOptIn(e.target.checked)}
          className={styles.optInCheck}
        />
        <span>Quero receber novidades e ofertas imobiliárias de Carlos Fondelo</span>
      </label>

      <button type="submit" className={styles.btn} disabled={busy}>
        {busy ? 'Enviando…' : 'Quero ser contatado'}
      </button>
    </form>
  )
}
