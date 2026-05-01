'use client'

import { useState, useEffect, useCallback } from 'react'
import { buildCustomPeriodKey, type PeriodType } from '@/lib/abundance/period-utils'

export interface GoalSummary {
  period_type: PeriodType
  period_key: string
  period: { start: string; end: string }
  goalAmount: number
  moneyTotal: number
  valueTotal: number
  totalAmount: number
  leftToGo: number
}

export function useGoalPeriodSummary(
  periodType: PeriodType,
  periodKey: string,
  customStart: string,
  customEnd: string
) {
  const [summary, setSummary] = useState<GoalSummary | null>(null)
  /** Only metrics + chart wait on this — never block the whole page */
  const [summaryLoading, setSummaryLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    if (periodType === 'custom' && (!customStart || !customEnd)) {
      setSummary(null)
      setSummaryLoading(false)
      return
    }
    setSummaryLoading(true)
    const key = periodType === 'custom' ? buildCustomPeriodKey(customStart, customEnd) : periodKey
    const url = `/api/vibration/abundance/goals?summary=1&period_type=${encodeURIComponent(periodType)}&period_key=${encodeURIComponent(key)}`
    try {
      const res = await fetch(url, {
        credentials: 'same-origin',
        cache: 'no-store',
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg =
          typeof body?.error === 'string'
            ? body.error
            : `Goals summary failed (${res.status})`
        console.error('[useGoalPeriodSummary]', res.status, msg, url)
        throw new Error(msg)
      }
      setSummary(body as GoalSummary)
    } catch (e) {
      console.error(e)
      setSummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }, [periodType, periodKey, customStart, customEnd])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return { summary, summaryLoading, refetch: fetchSummary }
}
