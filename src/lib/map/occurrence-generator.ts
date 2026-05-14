import { createAdminClient } from '@/lib/supabase/admin'
import { getOccurrenceDates, toDateString, parseDateString } from './cadence'
import type { Cadence } from './types'

const WINDOW_DAYS = 14
const GRACE_HOURS = 48

/**
 * Materialize commitment_occurrences for all active recurring commitments
 * within a 14-day rolling window. Idempotent via UNIQUE(commitment_id, occurred_on).
 *
 * Also expires stale pending occurrences older than the grace window.
 */
export async function generateOccurrences(userId?: string) {
  const supabase = createAdminClient()

  let query = supabase
    .from('commitments')
    .select('id, user_id, type, cadence, start_date, end_date')
    .eq('status', 'active')

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data: commitments, error } = await query

  if (error || !commitments) {
    console.error('Error loading commitments for occurrence generation:', error)
    return { generated: 0, expired: 0 }
  }

  const today = new Date()
  const rangeEnd = new Date(today)
  rangeEnd.setDate(rangeEnd.getDate() + WINDOW_DAYS)

  let totalGenerated = 0

  for (const commitment of commitments) {
    if (commitment.type !== 'recurring' || !commitment.cadence) continue

    const cadence = commitment.cadence as Cadence
    const rangeStart = commitment.start_date
      ? new Date(Math.max(parseDateString(commitment.start_date).getTime(), today.getTime()))
      : today

    const effectiveEnd = commitment.end_date
      ? new Date(Math.min(parseDateString(commitment.end_date).getTime(), rangeEnd.getTime()))
      : rangeEnd

    if (rangeStart > effectiveEnd) continue

    const dates = getOccurrenceDates(cadence, rangeStart, effectiveEnd)

    if (dates.length === 0) continue

    const rows = dates.map(d => ({
      commitment_id: commitment.id,
      user_id: commitment.user_id,
      occurred_on: toDateString(d),
      status: 'pending',
    }))

    const { data: inserted } = await supabase
      .from('commitment_occurrences')
      .upsert(rows, { onConflict: 'commitment_id,occurred_on', ignoreDuplicates: true })
      .select('id')

    totalGenerated += inserted?.length ?? 0
  }

  const totalExpired = await expireStaleOccurrences(supabase, userId)

  return { generated: totalGenerated, expired: totalExpired }
}

async function expireStaleOccurrences(
  supabase: ReturnType<typeof createAdminClient>,
  userId?: string,
): Promise<number> {
  const graceDate = new Date()
  graceDate.setHours(graceDate.getHours() - GRACE_HOURS)
  const cutoff = toDateString(graceDate)

  let query = supabase
    .from('commitment_occurrences')
    .update({ status: 'no', verified_at: new Date().toISOString() })
    .eq('status', 'pending')
    .lt('occurred_on', cutoff)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data } = await query.select('id')
  return data?.length ?? 0
}
