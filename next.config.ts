// ─── Configuração do Next.js ──────────────────────────────────────────────────

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Imagens de stock usadas em desenvolvimento
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Bucket do Supabase — banners, fotos de imóveis, perfil
      { protocol: 'https', hostname: 'tiebnutefoqgxmvkjasa.supabase.co' },
    ],
  },
}

export default nextConfig
