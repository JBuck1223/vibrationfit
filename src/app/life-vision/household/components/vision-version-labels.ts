/**
 * Per-owner version numbers matching the Life Vision area bar dropdown:
 * each member's personal visions number from 1, newest gets the highest.
 * Expects visions ordered newest-first (API order).
 */
export function computePersonalVersionNumbers(visions: Array<{ id: string; user_id: string }>) {
  const counts: Record<string, number> = {}
  for (const v of visions) counts[v.user_id] = (counts[v.user_id] || 0) + 1
  const seen: Record<string, number> = {}
  const map: Record<string, number> = {}
  for (const v of visions) {
    seen[v.user_id] = (seen[v.user_id] || 0) + 1
    map[v.id] = (counts[v.user_id] || 0) - seen[v.user_id] + 1
  }
  return map
}

export function formatVisionDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
