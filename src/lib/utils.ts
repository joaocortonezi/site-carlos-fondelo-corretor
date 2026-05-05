// ─── Utilitários gerais do projeto ──────────────────────────────────────────

/** Formata um número para moeda BRL sem centavos. Retorna 'Consulte' se nulo. */
export function formatPrice(value: number | null): string {
  if (!value) return 'Consulte'
  return new Intl.NumberFormat('pt-BR', {
    style:                 'currency',
    currency:              'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/** Formata área em m². Retorna '—' se nulo. */
export function formatArea(value: number | null): string {
  if (!value) return '—'
  return `${value} m²`
}

/**
 * Gera slug URL-safe a partir do título e cidade do imóvel.
 * Remove acentos, caracteres especiais e substitui espaços por hífens.
 */
export function generateSlug(titulo: string, cidade: string): string {
  return `${titulo} ${cidade}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')       // remove diacríticos (acentos)
    .replace(/[^a-z0-9\s-]/g, '') // remove caracteres não alfanuméricos
    .trim()
    .replace(/\s+/g, '-')
}

/** Gera URL do WhatsApp Web com mensagem pré-preenchida. */
export function whatsappUrl(phone: string, msg: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}

/** Escapa caracteres HTML perigosos para uso seguro dentro de templates de e-mail. */
export function escapeHtml(value: unknown): string {
  if (value == null) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
