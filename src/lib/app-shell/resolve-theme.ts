/**
 * Server-side theme resolution: the member's active theme (or the default) with
 * one url per slot, fallbacks already applied so the client never has to think
 * about missing images.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { ALL_SLOTS, slotFallback, type ThemeSlot } from './theme-slots'
import type { ResolvedTheme, ThemeImageRecord, ThemeRecord } from './theme-types'

export const DEFAULT_THEME_SLUG = 'sunset'

export async function resolveThemeForUser(
  supabase: SupabaseClient,
  userId: string | null,
): Promise<ResolvedTheme | null> {
  let themeId: string | null = null
  let overlayId: string | null = null
  if (userId) {
    const { data: account } = await supabase
      .from('user_accounts')
      .select('theme_id, theme_overlay')
      .eq('id', userId)
      .maybeSingle()
    themeId = (account as { theme_id?: string | null } | null)?.theme_id ?? null
    overlayId = (account as { theme_overlay?: string | null } | null)?.theme_overlay ?? null
  }

  const themeQuery = themeId
    ? supabase.from('themes').select('*').eq('id', themeId).maybeSingle()
    : supabase.from('themes').select('*').eq('slug', DEFAULT_THEME_SLUG).maybeSingle()

  let { data: theme } = await themeQuery
  if (!theme && themeId) {
    // The chosen theme is gone or unpublished: fall back to the default.
    const { data: fallback } = await supabase.from('themes').select('*').eq('slug', DEFAULT_THEME_SLUG).maybeSingle()
    theme = fallback
  }
  if (!theme) return null

  const { data: rows } = await supabase
    .from('theme_images')
    .select('id, theme_id, slot, image_url, width, height, sort_order')
    .eq('theme_id', (theme as ThemeRecord).id)
    .order('sort_order')

  return {
    theme: theme as ThemeRecord,
    images: applyFallbacks((rows ?? []) as ThemeImageRecord[]),
    overlayId,
  }
}

/** First image per slot, then walk each empty slot down its fallback chain. */
export function applyFallbacks(rows: ThemeImageRecord[]): Partial<Record<ThemeSlot, string>> {
  const direct: Partial<Record<ThemeSlot, string>> = {}
  for (const row of rows) {
    const slot = row.slot as ThemeSlot
    if (!direct[slot]) direct[slot] = row.image_url
  }
  const resolved: Partial<Record<ThemeSlot, string>> = { ...direct }
  for (const slot of ALL_SLOTS) {
    if (resolved[slot]) continue
    let next = slotFallback(slot)
    while (next && !direct[next]) next = slotFallback(next)
    if (next && direct[next]) resolved[slot] = direct[next]
  }
  return resolved
}
