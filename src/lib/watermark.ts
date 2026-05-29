// ─── Watermark helper ────────────────────────────────────────────────────────
// Lê a URL da marca d'água configurada (tabela `configuracoes`, chave
// `watermark_url`). Quando NULL, o site não aplica overlay nas fotos de imóvel.
//
// Server-side only: usa createSupabaseServer. Em Server Components, chame
// antes do return e passe a URL como prop pros Client Components que
// renderizam <WatermarkedImage>.

import { createSupabaseServer } from './supabase-server'

export async function getWatermarkUrl(): Promise<string | null> {
  const supabase = await createSupabaseServer()
  const { data } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'watermark_url')
    .maybeSingle()
  return data?.valor ?? null
}
