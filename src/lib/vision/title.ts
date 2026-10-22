/**
 * A vision's title without the " (Draft)" / " (Household)" suffixes that
 * older code added on every copy. Draft and household are flags on the
 * version (is_draft, household_id), so the title never carries them.
 */
export function cleanVisionTitle(title: string | null | undefined): string | null {
  if (!title) return null
  const cleaned = title.replace(/\s*\((?:Draft|Household)\)/gi, '').trim()
  return cleaned || null
}
