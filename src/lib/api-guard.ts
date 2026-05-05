// ─── Guards para rotas /api ──────────────────────────────────────────────────
// Helpers de segurança usados nos route handlers para barrar requisições
// abusivas: chamadas cross-origin (curl/atacante) e endpoints admin sem sessão.

import { NextResponse } from 'next/server'
import type { User }    from '@supabase/supabase-js'
import { createSupabaseServer } from './supabase-server'

const ALLOWED_HOSTS = new Set([
  'carlosfondelo.com.br',
  'www.carlosfondelo.com.br',
  'localhost',
  '127.0.0.1',
])

/** Aceita Origin/Referer apenas dos domínios próprios (produção, preview Vercel ou localhost). */
export function assertSameOrigin(req: Request): NextResponse | null {
  const candidate = req.headers.get('origin') || req.headers.get('referer')
  if (!candidate) {
    return NextResponse.json({ ok: false, error: 'Origin requerido.' }, { status: 403 })
  }
  try {
    const { hostname } = new URL(candidate)
    if (ALLOWED_HOSTS.has(hostname) || hostname.endsWith('.vercel.app')) return null
  } catch {}
  return NextResponse.json({ ok: false, error: 'Origin não autorizada.' }, { status: 403 })
}

/** Verifica que o requisitante é um admin cadastrado em public.admin_users. */
export async function requireAdmin(): Promise<{ user: User } | NextResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 })

  // RLS em admin_users só permite SELECT se o caller for admin (private.is_admin()).
  // Linha vazia = não é admin.
  const { data } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) return NextResponse.json({ ok: false, error: 'Acesso restrito.' }, { status: 403 })
  return { user }
}
