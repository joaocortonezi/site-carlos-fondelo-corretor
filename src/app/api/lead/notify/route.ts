import { Resend }       from 'resend'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { nome, telefone, email, mensagem, imovel_titulo, origem } = await req.json()

    await resend.emails.send({
      from:    process.env.RESEND_FROM!,
      to:      process.env.RESEND_NOTIFY_TO!,
      subject: `Novo lead: ${nome}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f5f4f0;font-family:Arial,sans-serif">
          <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e3dc">
            <div style="background:#b86906;padding:24px 28px">
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:0.08em;text-transform:uppercase">Carlos Fondelo Corretor</p>
              <h1 style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:700">Novo lead recebido</h1>
            </div>
            <div style="padding:28px">
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0efe9;color:#7a7265;width:110px">Nome</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0efe9;color:#1c1b18;font-weight:600">${nome}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0efe9;color:#7a7265">WhatsApp</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0efe9;color:#1c1b18;font-weight:600">${telefone}</td>
                </tr>
                ${email ? `<tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0efe9;color:#7a7265">E-mail</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0efe9;color:#1c1b18">${email}</td>
                </tr>` : ''}
                ${imovel_titulo ? `<tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0efe9;color:#7a7265">Imóvel</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0efe9;color:#1c1b18">${imovel_titulo}</td>
                </tr>` : ''}
                ${mensagem ? `<tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0efe9;color:#7a7265;vertical-align:top">Mensagem</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0efe9;color:#1c1b18">${mensagem}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:10px 0;color:#7a7265">Origem</td>
                  <td style="padding:10px 0;color:#1c1b18">${origem}</td>
                </tr>
              </table>
              <div style="margin-top:24px">
                <a href="https://wa.me/55${telefone.replace(/\D/g, '')}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600">
                  Responder no WhatsApp
                </a>
              </div>
            </div>
            <div style="padding:16px 28px;border-top:1px solid #f0efe9;font-size:12px;color:#b0a89c;text-align:center">
              carlosfondelo.com.br
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
