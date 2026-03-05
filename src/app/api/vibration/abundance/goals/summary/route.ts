import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PeriodType } from '@/lib/abundance/period-utils'
import { getPeriodStartEnd } from '@/lib/abundance/period-utils'

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
    const periodType = searchParams.get('period_type') as PeriodType | null
    const periodKey = searchParams.get('period_key')

    if (!periodType || !periodKey) {
      return NextResponse.json(
        { error: 'period_type and period_key are required.' },
        { status: 400 }
      )
    }

    const range = getPeriodStartEnd(periodType, periodKey)
    if (!range) {
      return NextResponse.json({ error: 'Invalid period_type or period_key.' }, { status: 400 })
    }

    const [{ data: goalRow }, { data: events }] = await Promise.all([
      supabase
        .from('abundance_goals')
        .select('amount')
        .eq('user_id', user.id)
        .eq('period_type', periodType)
        .eq('period_key', periodKey)
        .maybeSingle(),
      supabase
        .from('abundance_events')
        .select('value_type, amount')
        .eq('user_id', user.id)
        .gte('date', range.start)
        .lte('date', range.end),
    ])

    const goalAmount = goalRow?.amount != null ? Number(goalRow.amount) : 0
    let moneyTotal = 0
    let valueTotal = 0

    for (const ev of events || []) {
      const amt = Number(ev.amount) || 0
      if (ev.value_type === 'money') moneyTotal += amt
      else valueTotal += amt
    }

    const total = moneyTotal + valueTotal
    const leftToGo = Math.max(0, goalAmount - total)

    return NextResponse.json({
      period_type: periodType,
      period_key: periodKey,
      period: { start: range.start, end: range.end },
      goalAmount,
      moneyTotal,
      valueTotal,
      totalAmount: total,
      leftToGo,
    })
  } catch (error) {
    console.error('Error fetching goal summary:', error)
    return NextResponse.json({ error: 'Failed to fetch goal summary.' }, { status: 500 })
  }
}
