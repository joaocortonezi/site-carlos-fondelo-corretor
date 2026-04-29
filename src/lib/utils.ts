export function formatPrice(value: number | null): string {
  if (!value) return 'Consulte'
  return new Intl.NumberFormat('pt-BR', {
    style:                 'currency',
    currency:              'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatArea(value: number | null): string {
  if (!value) return '—'
  return `${value} m²`
}

export function generateSlug(titulo: string, cidade: string): string {
  return `${titulo} ${cidade}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function whatsappUrl(phone: string, msg: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}
