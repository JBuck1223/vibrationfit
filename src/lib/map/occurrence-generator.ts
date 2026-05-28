import { createAdminClient } from '@/lib/supabase/admin'
import { getOccurrenceDates, toDateString, parseDateString } from './cadence'
import type { Cadence } from './types'

const WINDOW_FORWARD_DAYS = 14
const WINDOW_BACKWARD_DAYS = 30
const EXPIRE_AFTER_DAYS = 7

/**
 * Materialize commitment_occurrences for all active recurring commitments
 * within a rolling window (30 days back, 14 days forward).
 * Idempotent via UNIQUE(commitment_id, occurred_on).
 */
export async function generateOccurrences(userId?: string, anchorDate?: string) {
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

  const anchor = anchorDate ? parseDateString(anchorDate) : new Date()
  const rangeStart = new Date(anchor)
  rangeStart.setDate(rangeStart.getDate() - WINDOW_BACKWARD_DAYS)
  const rangeEnd = new Date(anchor)
  rangeEnd.setDate(rangeEnd.getDate() + WINDOW_FORWARD_DAYS)

  let totalGenerated = 0

  for (const commitment of commitments) {
    totalGenerated += await materializeCommitmentOccurrences(
      supabase,
      commitment,
      rangeStart,
      rangeEnd,
    )
  }

  const totalExpired = await expireStaleOccurrences(supabase, userId)

  return { generated: totalGenerated, expired: totalExpired }
}

export async function ensureOccurrencesForDate(userId: string, date: string) {
  const supabase = createAdminClient()

  const { data: commitments } = await supabase
    .from('commitments')
    .select('id, user_id, type, cadence, start_date, end_date')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (!commitments) return { generated: 0 }

  const target = parseDateString(date)
  let generated = 0

  for (const commitment of commitments) {
    generated += await materializeCommitmentOccurrences(
      supabase,
      commitment,
      target,
      target,
    )
  }

  return { generated }
}

async function materializeCommitmentOccurrences(
  supabase: ReturnType<typeof createAdminClient>,
  commitment: {
    id: string
    user_id: string
    type: string
    cadence: unknown
    start_date: string | null
    end_date: string | null
  },
  rangeStart: Date,
  rangeEnd: Date,
): Promise<number> {
  if (commitment.type !== 'recurring' || !commitment.cadence) return 0

  const cadence = commitment.cadence as Cadence
  const commitmentStart = commitment.start_date
    ? parseDateString(commitment.start_date)
    : rangeStart

  const effectiveStart = new Date(
    Math.max(commitmentStart.getTime(), rangeStart.getTime()),
  )
  const effectiveEnd = commitment.end_date
    ? new Date(
        Math.min(parseDateString(commitment.end_date).getTime(), rangeEnd.getTime()),
      )
    : rangeEnd

  if (effectiveStart > effectiveEnd) return 0

  const dates = getOccurrenceDates(cadence, effectiveStart, effectiveEnd, commitmentStart)
  if (dates.length === 0) return 0

  const rows = dates.map(d => ({
    commitment_id: commitment.id,
    user_id: commitment.user_id,
    occurred_on: toDateString(d),
    status: 'pending' as const,
  }))

  const { data: inserted } = await supabase
    .from('commitment_occurrences')
    .upsert(rows, { onConflict: 'commitment_id,occurred_on', ignoreDuplicates: true })
    .select('id')

  return inserted?.length ?? 0
}

async function expireStaleOccurrences(
  supabase: ReturnType<typeof createAdminClient>,
  userId?: string,
): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - EXPIRE_AFTER_DAYS)
  const cutoff = toDateString(cutoffDate)

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
