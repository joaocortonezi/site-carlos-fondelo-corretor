// Server wrapper que busca o perfil do corretor e injeta no Footer.
// Use este componente em todas as páginas internas para garantir que o
// rodapé exiba CRECI/telefone/e-mail reais em vez dos placeholders.

import Footer                   from './Footer'
import { createSupabaseServer } from '@/lib/supabase-server'
import { PerfilCorretor }       from '@/lib/types'

export default async function SiteFooter() {
  const supabase = await createSupabaseServer()
  const { data } = await supabase
    .from('perfil_corretor')
    .select('*')
    .limit(1)
    .maybeSingle()

  return <Footer perfil={data as PerfilCorretor | null} />
}
