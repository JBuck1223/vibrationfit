import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PeriodType } from '@/lib/abundance/period-utils'
import { loadGoalSummaryPayload } from '@/lib/abundance/goal-summary-data'

const PERIOD_TYPES = ['week', 'month', 'quarter', 'year', 'custom'] as const

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
  } catch (error) {
    console.error('Error fetching goal summary:', error)
    return NextResponse.json({ error: 'Failed to fetch goal summary.' }, { status: 500 })
  }
}
