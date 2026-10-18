import type { SupabaseClient } from '@supabase/supabase-js'
import { LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'
import { PROFILE_STATE_COLUMNS, profileStateField } from '@/lib/profile/profile-category-map'
import { upsertCategoryText, type DraftSessionPayload } from '@/lib/life-vision/draft-session'

/**
 * Seeds each area's "What's going on now" beat from the member's Life Profile
 * current-state text. Only areas with no category-text row are filled, so a
 * beat the member wrote, cleared, or marked "I don't know yet" is never
 * overwritten. Members who skipped the profile fields get nothing.
 *
 * Returns true when at least one area was filled.
 */
export async function prefillNowFromProfile(
  supabase: SupabaseClient,
  userId: string,
  session: DraftSessionPayload,
): Promise<boolean> {
  const touched = new Set(session.categoryText.map((row) => row.category))
  const open = LIFE_CATEGORY_KEYS.filter((key) => !touched.has(key))
  if (open.length === 0) return false

  const { data: profile } = await supabase
    .from('user_profiles')
    .select(PROFILE_STATE_COLUMNS.join(', '))
    .eq('user_id', userId)
    .eq('is_draft', false)
    .order('is_active', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!profile) return false

  const row = profile as unknown as Record<string, unknown>
  const nowIso = new Date().toISOString()
  let filled = false
  for (const key of open) {
    const value = row[profileStateField(key)]
    const text = typeof value === 'string' ? value.trim() : ''
    if (!text) continue
    await upsertCategoryText(supabase, session.id, key, { now_text: text, now_at: nowIso })
    filled = true
  }
  return filled
}
