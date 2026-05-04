// ─── Cliente Supabase para Server Components ─────────────────────────────────
// Usa @supabase/ssr para ler e escrever cookies do Next.js App Router.
// Deve ser chamado SOMENTE em Server Components, Route Handlers e Actions.
// Para Client Components, use createBrowserClient diretamente.

import { createServerClient } from '@supabase/ssr'
import { cookies }            from 'next/headers'

export async function createSupabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Necessário para que o Supabase leia a sessão do usuário nos cookies
        getAll() { return cookieStore.getAll() },
        // O try/catch silencia o erro quando setAll é chamado em Server Components read-only
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
