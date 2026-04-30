import { Resend }       from 'resend'
import { NextResponse } from 'next/server'

interface Recipient { email: string; nome: string | null }

function makeHtml(nome: string | null, body: string) {
  const greeting = nome ? `<p style="margin:0 0 16px">Olá, ${nome.trim().split(' ')[0]}!</p>` : ''
  const paragraphs = body
    .split('\n')
    .filter(l => l.trim())
    .map(l => `<p style="margin:0 0 12px">${l}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:Arial,sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e3dc">
    <div style="background:#b86906;padding:20px 28px">
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:0.1em;text-transform:uppercase">Carlos Fondelo Corretor</p>
    </div>
    <div style="padding:28px;color:#1c1b18;font-size:15px;line-height:1.7">
      ${greeting}${paragraphs}
    </div>
    <div style="padding:16px 28px;border-top:1px solid #f0efe9;font-size:12px;color:#b0a89c;text-align:center">
      Carlos Fondelo · carlosfondelo.com.br<br>
      <span style="font-size:11px">Para cancelar o recebimento, responda este e-mail.</span>
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { subject, body, recipients }: {
      subject:    string
      body:       string
      recipients: Recipient[] | string
    } = await req.json()

    if (!subject?.trim() || !body?.trim()) {
      return NextResponse.json({ ok: false, error: 'Assunto e mensagem são obrigatórios.' }, { status: 400 })
    }

    if (typeof recipients === 'string') {
      await resend.emails.send({
        from:    process.env.RESEND_FROM!,
        to:      recipients,
        subject,
        html:    makeHtml(null, body),
      })
      return NextResponse.json({ ok: true, sent: 1 })
    }

    const BATCH = 100
    let sent = 0
    for (let i = 0; i < recipients.length; i += BATCH) {
      const chunk = recipients.slice(i, i + BATCH)
      await resend.batch.send(
        chunk.map(r => ({
          from:    process.env.RESEND_FROM!,
          to:      r.email,
          subject,
          html:    makeHtml(r.nome, body),
        }))
      )
      sent += chunk.length
    }

    return NextResponse.json({ ok: true, sent })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false, error: 'Erro ao disparar.' }, { status: 500 })
  }
}
