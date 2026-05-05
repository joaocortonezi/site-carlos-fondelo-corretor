// ─── API: e-mail de boas-vindas para inscritos na newsletter ─────────────────
// Chamado pelo NewsletterSection após inserir o inscrito no banco.
// Envia e-mail de boas-vindas personalizado com o primeiro nome do inscrito.
// Inclui CTA para a página de imóveis e instrução de como se descadastrar.

import { Resend }          from 'resend'
import { NextResponse }    from 'next/server'
import { escapeHtml }      from '@/lib/utils'
import { assertSameOrigin } from '@/lib/api-guard'

export async function POST(req: Request) {
  const blocked = assertSameOrigin(req)
  if (blocked) return blocked

  if (!process.env.RESEND_API_KEY) return NextResponse.json({ skipped: true })
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { email, nome } = await req.json()
    if (!email || typeof email !== 'string') return NextResponse.json({ ok: false }, { status: 400 })
    // Valida formato do e-mail e bloqueia tentativas de header injection (\n, \r)
    if (!/^[^\s@<>"',;:]+@[^\s@<>"',;:]+\.[^\s@<>"',;:]+$/.test(email)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const firstName = nome ? String(nome).trim().split(' ')[0] : null
    const greeting  = firstName ? `Olá, ${escapeHtml(firstName)}!` : 'Olá!'

    await resend.emails.send({
      from:    process.env.RESEND_FROM!,
      to:      email,
      subject: 'Bem-vindo(a) à newsletter de Carlos Fondelo',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f5f4f0;font-family:Arial,sans-serif">
          <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e3dc">
            <div style="background:#b86906;padding:28px">
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:0.1em;text-transform:uppercase">Carlos Fondelo Corretor</p>
              <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;line-height:1.3">
                Você está na lista!
              </h1>
            </div>
            <div style="padding:28px;color:#1c1b18;font-size:15px;line-height:1.7">
              <p style="margin:0 0 16px">${greeting}</p>
              <p style="margin:0 0 16px">
                A partir de agora você vai receber em primeira mão as melhores oportunidades imobiliárias de <strong>Sinop e região</strong>, além de dicas e novidades do mercado.
              </p>
              <p style="margin:0 0 24px;color:#7a7265;font-size:14px">
                Se preferir não receber mais e-mails, basta responder esta mensagem pedindo a remoção.
              </p>
              <a href="https://carlosfondelo.com.br/imoveis" style="display:inline-block;background:#b86906;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:700;letter-spacing:0.04em">
                Ver imóveis disponíveis
              </a>
            </div>
            <div style="padding:16px 28px;border-top:1px solid #f0efe9;font-size:12px;color:#b0a89c;text-align:center">
              Carlos Fondelo · CRECI-MT 12345 · carlosfondelo.com.br
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
