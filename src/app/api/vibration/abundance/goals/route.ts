import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PeriodType } from '@/lib/abundance/period-utils'
import { loadGoalSummaryPayload } from '@/lib/abundance/goal-summary-data'

const PERIOD_TYPES = ['week', 'month', 'quarter', 'year', 'custom'] as const

/** Avoid cached responses — summary depends on auth + live DB */
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    /** Goal vs actual summary — same payload as /goals/summary (some setups 404 on nested segment). */
    if (searchParams.get('summary') === '1') {
      const periodTypeRaw = searchParams.get('period_type')
      const periodKey = searchParams.get('period_key')
      if (!periodTypeRaw || !periodKey) {
        return NextResponse.json(
          { error: 'period_type and period_key are required.' },
          { status: 400 }
        )
      }
      if (!PERIOD_TYPES.includes(periodTypeRaw as (typeof PERIOD_TYPES)[number])) {
        return NextResponse.json(
          { error: `Invalid period_type: ${periodTypeRaw}` },
          { status: 400 }
        )
      }
      const periodType = periodTypeRaw as PeriodType
      const result = await loadGoalSummaryPayload(supabase, user.id, periodType, periodKey)
      if (!result.ok) {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }
      return NextResponse.json(result.data)
    }

    const periodType = searchParams.get('period_type') as PeriodType | null
    const periodKey = searchParams.get('period_key')

    let query = supabase
      .from('abundance_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('period_key', { ascending: false })

    if (periodType && PERIOD_TYPES.includes(periodType)) {
      query = query.eq('period_type', periodType)
    }
    if (periodKey) {
      query = query.eq('period_key', periodKey)
    }

    const { data: goals, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (periodKey && periodType && goals && goals.length === 1) {
      return NextResponse.json(goals[0])
    }
    return NextResponse.json(goals || [])
  } catch (error) {
    console.error('Error fetching abundance goals:', error)
    return NextResponse.json({ error: 'Failed to fetch goals.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { period_type, period_key, amount } = body ?? {}

    if (!period_type || !period_key || typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { error: 'period_type, period_key, and amount (non-negative number) are required.' },
        { status: 400 }
      )
    }

    if (!PERIOD_TYPES.includes(period_type)) {
      return NextResponse.json({ error: 'period_type must be week, month, quarter, year, or custom.' }, { status: 400 })
    }

    if (period_type === 'custom') {
      if (!/^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/.test(period_key)) {
        return NextResponse.json({ error: 'period_key for custom must be start_end (YYYY-MM-DD_YYYY-MM-DD).' }, { status: 400 })
      }
    }

    const { data: goal, error } = await supabase
      .from('abundance_goals')
      .upsert(
        {
          user_id: user.id,
          period_type,
          period_key,
          amount: Number(amount),
        },
        { onConflict: 'user_id,period_type,period_key' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error upserting abundance goal:', error)
    return NextResponse.json({ error: 'Failed to save goal.' }, { status: 500 })
  }
}
