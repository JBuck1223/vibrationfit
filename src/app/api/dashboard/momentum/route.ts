import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface MomentumDay {
  date: string
  count: number
}

export interface MomentumResponse {
  /** Oldest to newest, one entry per day for the requested window. */
  days: MomentumDay[]
  totals: {
    activeDays: number
    events: number
    bestStreak: number
    currentStreak: number
  }
  weeks: number
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

/**
 * GET /api/dashboard/momentum?weeks=12
 *
 * Per-day practice counts across the member's activity tables (area activations,
 * journal, daily paper, abundance, Vibe Tribe posts, verified MAP commitments).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const weeksParam = Number(request.nextUrl.searchParams.get('weeks') ?? 12)
    const weeks = Number.isFinite(weeksParam) ? Math.min(Math.max(Math.round(weeksParam), 4), 26) : 12
    const totalDays = weeks * 7

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const start = new Date(today)
    start.setUTCDate(start.getUTCDate() - (totalDays - 1))
    const startStr = toDateStr(start)
    const startIso = start.toISOString()

    const [activations, journal, papers, abundance, posts, mapYes] = await Promise.all([
      supabase.from('area_activations').select('activation_date').eq('user_id', user.id).gte('activation_date', startStr),
      supabase.from('journal_entries').select('date').eq('user_id', user.id).gte('date', startStr),
      supabase.from('daily_papers').select('entry_date').eq('user_id', user.id).gte('entry_date', startStr),
      supabase.from('abundance_events').select('date').eq('user_id', user.id).gte('date', startStr),
      supabase.from('vibe_posts').select('created_at').eq('user_id', user.id).eq('is_deleted', false).gte('created_at', startIso),
      supabase.from('commitment_occurrences').select('occurred_on').eq('user_id', user.id).eq('status', 'yes').gte('occurred_on', startStr),
    ])

    const counts = new Map<string, number>()
    const bump = (dateStr: string | null | undefined) => {
      if (!dateStr) return
      const key = dateStr.slice(0, 10)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    for (const r of activations.data ?? []) bump(r.activation_date)
    for (const r of journal.data ?? []) bump(r.date)
    for (const r of papers.data ?? []) bump(r.entry_date)
    for (const r of abundance.data ?? []) bump(r.date)
    for (const r of posts.data ?? []) bump(r.created_at)
    for (const r of mapYes.data ?? []) bump(r.occurred_on)

    const days: MomentumDay[] = []
    let events = 0
    let activeDays = 0
    let bestStreak = 0
    let run = 0
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start)
      d.setUTCDate(start.getUTCDate() + i)
      const key = toDateStr(d)
      const count = counts.get(key) ?? 0
      days.push({ date: key, count })
      events += count
      if (count > 0) {
        activeDays++
        run++
        bestStreak = Math.max(bestStreak, run)
      } else {
        run = 0
      }
    }

    // Current streak: count back from today, allowing today to be empty.
    let currentStreak = 0
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) currentStreak++
      else if (i === days.length - 1) continue
      else break
    }

    const body: MomentumResponse = {
      days,
      totals: { activeDays, events, bestStreak, currentStreak },
      weeks,
    }
    return NextResponse.json(body)
  } catch (err) {
    console.error('Error in GET /api/dashboard/momentum:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
