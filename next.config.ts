// ─── Configuração do Next.js ──────────────────────────────────────────────────

import type { NextConfig } from 'next'

// Headers de segurança aplicados a todas as rotas.
// Protegem contra clickjacking, MIME-sniffing, vazamento de referrer e
// forçam HTTPS (HSTS). Sem CSP estrita aqui para não quebrar o Next inline.
const securityHeaders = [
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Imagens de stock usadas em desenvolvimento
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Bucket do Supabase — banners, fotos de imóveis, perfil
      { protocol: 'https', hostname: 'tiebnutefoqgxmvkjasa.supabase.co' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
