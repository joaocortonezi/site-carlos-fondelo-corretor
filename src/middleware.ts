// ─── Middleware de autenticação ───────────────────────────────────────────────
// Intercepta todas as requisições /admin/* antes de chegar ao servidor.
// - Redireciona para /admin/login se o usuário não estiver autenticado.
// - Redireciona para /admin/imoveis se o usuário já logado tentar acessar /admin/login.
// O Supabase SSR propaga a sessão via cookies em cada requisição.

import { createServerClient } from '@supabase/ssr'
import { NextResponse }        from 'next/server'
import type { NextRequest }    from 'next/server'

export async function middleware(request: NextRequest) {
  // Inicia com uma resposta pass-through que será substituída se necessário
  let response = NextResponse.next({ request })

  // Cria o cliente Supabase SSR que lê/escreve cookies no request/response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          // Escreve cookies tanto no request (para o servidor) quanto na response (para o browser)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verifica a sessão — getUser() valida o JWT, não confia apenas no cookie
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Protege todas as rotas admin (exceto o próprio login)
  if (path.startsWith('/admin') && !path.startsWith('/admin/login') && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Evita que usuários logados vejam a tela de login desnecessariamente
  if (path === '/admin/login' && user) {
    return NextResponse.redirect(new URL('/admin/imoveis', request.url))
  }

  return response
}

// O middleware só é executado nas rotas /admin — não afeta o site público
export const config = { matcher: ['/admin/:path*'] }
