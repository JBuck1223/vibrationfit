import type { ThemeSlot } from './theme-slots'

export interface ThemeRecord {
  id: string
  slug: string
  name: string
  kind: 'system' | 'custom'
  owner_user_id: string | null
  tint: string | null
  is_published: boolean
  sort_order: number
}

export interface ThemeImageRecord {
  id: string
  theme_id: string
  slot: ThemeSlot | string
  image_url: string
  width: number | null
  height: number | null
  sort_order: number
}

/** What the client needs: the theme plus a slot → url map with fallbacks already applied. */
export interface ResolvedTheme {
  theme: ThemeRecord
  images: Partial<Record<ThemeSlot, string>>
}
