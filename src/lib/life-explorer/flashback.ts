/**
 * Expedition Flashback — the retention engine.
 *
 * Curiosity drives encoding; retrieval drives retention. Every lesson opens
 * with a 2-minute spaced-retrieval game pulling items from the Learned
 * column. Easy recalls stretch to longer intervals; stumbles come back
 * sooner. Results quietly feed skill progress.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { FlashbackItem, LeWonderItem } from './types'

/** Spaced schedule in days: 1 → 3 → 7 → 30, then monthly. */
const INTERVALS_DAYS = [1, 3, 7, 30]

function daysBetween(fromIso: string, to: Date): number {
  const from = new Date(fromIso)
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000)
}

function nextIntervalDays(reviewCount: number): number {
  return INTERVALS_DAYS[Math.min(reviewCount, INTERVALS_DAYS.length - 1)]
}

/**
 * Pick up to `limit` learned items due for retrieval today.
 * An item is due when next_review_at is unset (never reviewed, at least
 * 1 day old) or in the past.
 */
export function dueFlashbackItems(
  learned: LeWonderItem[],
  limit = 3,
  now = new Date()
): FlashbackItem[] {
  const today = now.toISOString().slice(0, 10)

  const due = learned.filter((item) => {
    if (item.next_review_at) return item.next_review_at.slice(0, 10) <= today
    return daysBetween(item.recorded_at || item.created_at, now) >= 1
  })

  // Oldest learning first — those memories need rescue soonest.
  due.sort((a, b) => (a.recorded_at || a.created_at).localeCompare(b.recorded_at || b.created_at))

  return due.slice(0, limit).map((item) => ({
    prompt: `Explorer memory check: ${item.statement}`,
    learned_statement: item.statement,
    wonder_item_id: item.id,
    age_days: daysBetween(item.recorded_at || item.created_at, now),
  }))
}

/** Quick game formats the lesson can wrap the items in. */
export const FLASHBACK_GAMES = [
  'Three quick questions — one point each, high five per point',
  'Draw it in 30 seconds and explain your drawing',
  'Teach it to your stuffed animal like you are the teacher',
  'True or silly? Parent says it wrong on purpose; child corrects it',
]

/**
 * Record recall results: recalled items stretch to the next interval,
 * stumbles come back tomorrow.
 */
export async function recordFlashbackResults(
  supabase: SupabaseClient,
  results: Array<{ wonder_item_id: string; recalled: boolean }>,
  now = new Date()
): Promise<void> {
  for (const result of results) {
    const { data: item } = await supabase
      .from('le_wonder_items')
      .select('id, review_count')
      .eq('id', result.wonder_item_id)
      .maybeSingle()
    if (!item) continue

    const reviewCount = result.recalled ? (item.review_count || 0) + 1 : 0
    const intervalDays = result.recalled ? nextIntervalDays(reviewCount) : 1
    const next = new Date(now.getTime() + intervalDays * 86_400_000)

    await supabase
      .from('le_wonder_items')
      .update({
        review_count: reviewCount,
        last_reviewed_at: now.toISOString().slice(0, 10),
        next_review_at: next.toISOString().slice(0, 10),
        updated_at: now.toISOString(),
      })
      .eq('id', item.id)
  }
}
