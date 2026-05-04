// ─── Banco de fontes disponíveis no editor visual do hero ────────────────────
// Cada fonte aqui deve ter o CSS var correspondente carregado em src/app/layout.tsx.
// O `value` é salvo no banco de dados e aplicado via CSS no componente Hero.tsx.

export interface HeroFont {
  label:    string                      // nome exibido no seletor de fontes do admin
  value:    string                      // CSS var que mapeia para a fonte carregada
  category: 'sans' | 'serif' | 'display'
}

export const HERO_FONTS: HeroFont[] = [
  { label: 'DM Sans',            value: 'var(--font-body)',        category: 'sans'    },
  { label: 'Inter',              value: 'var(--font-inter)',       category: 'sans'    },
  { label: 'Montserrat',         value: 'var(--font-montserrat)',  category: 'sans'    },
  { label: 'Raleway',            value: 'var(--font-raleway)',     category: 'sans'    },
  { label: 'Josefin Sans',       value: 'var(--font-josefin)',     category: 'sans'    },
  { label: 'Lora',               value: 'var(--font-lora)',        category: 'serif'   },
  { label: 'Playfair Display',   value: 'var(--font-playfair)',    category: 'serif'   },
  { label: 'Cormorant Garamond', value: 'var(--font-cormorant)',   category: 'serif'   },
  { label: 'EB Garamond',        value: 'var(--font-eb-garamond)', category: 'serif'   },
  { label: 'Cinzel',             value: 'var(--font-cinzel)',      category: 'display' },
]

/** Fonte padrão quando uma camada não tem fontFamily definido. */
export const DEFAULT_FONT = 'var(--font-body)'
