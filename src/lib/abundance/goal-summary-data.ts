import type { SupabaseClient } from '@supabase/supabase-js'
import type { PeriodType } from '@/lib/abundance/period-utils'
import { getPeriodStartEnd } from '@/lib/abundance/period-utils'

export type GoalSummaryPayload = {
  period_type: PeriodType
  period_key: string
  period: { start: string; end: string }
  goalAmount: number
  moneyTotal: number
  valueTotal: number
  totalAmount: number
  leftToGo: number
}

/** Shared server logic for goal vs actual summary (used by API routes). */
export async function loadGoalSummaryPayload(
  supabase: SupabaseClient,
  userId: string,
  periodType: PeriodType,
  periodKey: string
): Promise<{ ok: true; data: GoalSummaryPayload } | { ok: false; message: string }> {
  const range = getPeriodStartEnd(periodType, periodKey)
  if (!range) {
    return { ok: false, message: 'Invalid period_type or period_key.' }
  }

  const [{ data: goalRow, error: goalErr }, { data: events, error: eventsErr }] = await Promise.all([
    supabase
      .from('abundance_goals')
      .select('amount')
      .eq('user_id', userId)
      .eq('period_type', periodType)
      .eq('period_key', periodKey)
      .maybeSingle(),
    supabase
      .from('abundance_events')
      .select('value_type, amount')
      .eq('user_id', userId)
      .gte('date', range.start)
      .lte('date', range.end),
  ])

  if (goalErr) {
    console.error('[goal summary] abundance_goals:', goalErr.message)
    return { ok: false, message: goalErr.message || 'Could not load goal for this period.' }
  }
  if (eventsErr) {
    console.error('[goal summary] abundance_events:', eventsErr.message)
    return { ok: false, message: eventsErr.message || 'Could not load abundance events for this period.' }
  }

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

  return {
    ok: true,
    data: {
      period_type: periodType,
      period_key: periodKey,
      period: { start: range.start, end: range.end },
      goalAmount,
      moneyTotal,
      valueTotal,
      totalAmount: total,
      leftToGo,
    },
  }
}
