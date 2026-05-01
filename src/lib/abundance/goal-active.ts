/**
 * Whether a saved abundance goal's period is "current" (contains today).
 */

import type { PeriodType } from '@/lib/abundance/period-utils'
import { getPeriodKey, getPeriodStartEnd } from '@/lib/abundance/period-utils'

export interface GoalPeriodFields {
  period_type: PeriodType
  period_key: string
}

function todayIso(now: Date): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** True when this goal row matches today's calendar week/month/quarter/year, or custom range contains today. */
export function goalAppliesToNow(goal: GoalPeriodFields, now = new Date()): boolean {
  if (goal.period_type === 'custom') {
    const range = getPeriodStartEnd('custom', goal.period_key)
    if (!range) return false
    const t = todayIso(now)
    return t >= range.start && t <= range.end
  }
  return goal.period_key === getPeriodKey(now, goal.period_type)
}
