import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type AreaStatsResponse = {
  todayCompleted: boolean
  currentStreak: number
  streakUnit: 'days' | 'weeks'
  countLast7: number
  countLast30: number
  countAllTime: number
  streakFreezeAvailable: boolean
  streakFreezeUsedThisWeek: boolean
}

const VALID_AREAS = [
  'vision-audio',
  'journal',
  'daily-paper',
  'alignment-gym',
  'abundance-tracker',
  'vibe-tribe',
  'vision-board',
] as const

type Area = (typeof VALID_AREAS)[number]

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Given an array of ISO date strings (YYYY-MM-DD), compute the current streak
 * ending today (or yesterday if today is not yet completed).
 */
function computeDayStreak(activeDates: string[], todayStr: string): number {
  const dateSet = new Set(activeDates)
  let streak = 0
  const d = new Date(todayStr + 'T00:00:00')

  if (!dateSet.has(todayStr)) {
    d.setDate(d.getDate() - 1)
    if (!dateSet.has(toDateStr(d))) return 0
  }

  while (dateSet.has(toDateStr(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

/**
 * Compute a week-streak for Alignment Gym.
 * Given an array of dates (session attendance), count consecutive weeks
 * (Mon-Sun) with at least one attendance, ending at the current week.
 */
function computeWeekStreak(activeDates: string[], todayStr: string): number {
  if (activeDates.length === 0) return 0

  function getWeekKey(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    return toDateStr(monday)
  }

  const weekSet = new Set(activeDates.map(getWeekKey))
  const currentWeek = getWeekKey(todayStr)

  let streak = 0
  const d = new Date(currentWeek + 'T00:00:00')

  if (!weekSet.has(currentWeek)) {
    d.setDate(d.getDate() - 7)
    if (!weekSet.has(toDateStr(d))) return 0
  }

  while (weekSet.has(toDateStr(d))) {
    streak++
    d.setDate(d.getDate() - 7)
  }
  return streak
}

async function getActiveDatesForArea(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  area: Area,
): Promise<string[]> {
  switch (area) {
    case 'journal': {
      const { data } = await supabase
        .from('journal_entries')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
      return (data ?? []).map((r) => r.date)
    }

    case 'daily-paper': {
      const { data } = await supabase
        .from('daily_papers')
        .select('entry_date')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
      return (data ?? []).map((r) => r.entry_date)
    }

    case 'abundance-tracker': {
      const { data } = await supabase
        .from('abundance_events')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
      const dateSet = new Set((data ?? []).map((r) => r.date))
      return Array.from(dateSet).sort().reverse()
    }

    case 'alignment-gym': {
      const { data } = await supabase
        .from('video_session_participants')
        .select('joined_at, video_sessions!inner(scheduled_at)')
        .eq('user_id', userId)
        .eq('attended', true)
        .order('joined_at', { ascending: false })
      const dateSet = new Set<string>()
      for (const row of data ?? []) {
        const ts = row.joined_at || (row.video_sessions as any)?.scheduled_at
        if (ts) dateSet.add(toDateStr(new Date(ts)))
      }
      return Array.from(dateSet).sort().reverse()
    }

    case 'vibe-tribe': {
      const dateSet = new Set<string>()

      const [posts, comments, hearts] = await Promise.all([
        supabase
          .from('vibe_posts')
          .select('created_at')
          .eq('user_id', userId)
          .eq('is_deleted', false),
        supabase
          .from('vibe_comments')
          .select('created_at')
          .eq('user_id', userId)
          .eq('is_deleted', false),
        supabase
          .from('vibe_hearts')
          .select('created_at')
          .eq('user_id', userId),
      ])

      for (const row of posts.data ?? []) {
        dateSet.add(toDateStr(new Date(row.created_at)))
      }
      for (const row of comments.data ?? []) {
        dateSet.add(toDateStr(new Date(row.created_at)))
      }
      for (const row of hearts.data ?? []) {
        dateSet.add(toDateStr(new Date(row.created_at)))
      }
      return Array.from(dateSet).sort().reverse()
    }

    case 'vision-audio':
    case 'vision-board': {
      const dbArea = area === 'vision-audio' ? 'vision_audio' : 'vision_board'
      const { data } = await supabase
        .from('area_activations')
        .select('activation_date')
        .eq('user_id', userId)
        .eq('area', dbArea)
        .order('activation_date', { ascending: false })
      const dateSet = new Set(
        (data ?? []).map((r) => r.activation_date),
      )
      return Array.from(dateSet).sort().reverse()
    }

    default:
      return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const area = request.nextUrl.searchParams.get('area') as Area | null
    if (!area || !VALID_AREAS.includes(area)) {
      return NextResponse.json(
        { error: `Invalid area. Must be one of: ${VALID_AREAS.join(', ')}` },
        { status: 400 },
      )
    }

    const activeDates = await getActiveDatesForArea(supabase, user.id, area)

    const today = startOfDay(new Date())
    const todayStr = toDateStr(today)
    const isWeekly = area === 'alignment-gym'

    const todayCompleted = activeDates.includes(todayStr)

    const currentStreak = isWeekly
      ? computeWeekStreak(activeDates, todayStr)
      : computeDayStreak(activeDates, todayStr)

    const d7 = new Date(today)
    d7.setDate(d7.getDate() - 6)
    const d30 = new Date(today)
    d30.setDate(d30.getDate() - 29)
    const d7Str = toDateStr(d7)
    const d30Str = toDateStr(d30)

    const countLast7 = activeDates.filter((d) => d >= d7Str && d <= todayStr).length
    const countLast30 = activeDates.filter((d) => d >= d30Str && d <= todayStr).length
    const countAllTime = activeDates.length

    const streakFreezeAvailable = currentStreak >= 2
    let streakFreezeUsedThisWeek = false
    if (currentStreak > 0 && !todayCompleted && !isWeekly) {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = toDateStr(yesterday)
      if (!activeDates.includes(yesterdayStr)) {
        streakFreezeUsedThisWeek = true
      }
    }

    const stats: AreaStatsResponse = {
      todayCompleted,
      currentStreak,
      streakUnit: isWeekly ? 'weeks' : 'days',
      countLast7,
      countLast30,
      countAllTime,
      streakFreezeAvailable,
      streakFreezeUsedThisWeek,
    }

    return NextResponse.json(stats)
  } catch (err) {
    console.error('Error in GET /api/area-stats:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
