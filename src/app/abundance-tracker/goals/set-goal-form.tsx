'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { Button, Input } from '@/lib/design-system/components'
import { getPeriodKey, buildCustomPeriodKey, type PeriodType } from '@/lib/abundance/period-utils'
import { GoalPeriodPicker } from './goal-period-picker'
import { useGoalPeriodSummary } from './use-goal-period-summary'
import { shellCard, sectionLabel } from './ui-constants'
import { formatAmountWithCommas, parseAmountInput } from './amount-input'

export function SetGoalForm() {
  const router = useRouter()
  const now = new Date()
  const [periodType, setPeriodType] = useState<PeriodType>('month')
  const [periodKey, setPeriodKey] = useState(() => getPeriodKey(now, 'month'))
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [goalInput, setGoalInput] = useState('')
  const [saving, setSaving] = useState(false)

  const { summary, refetch } = useGoalPeriodSummary(periodType, periodKey, customStart, customEnd)

  useEffect(() => {
    if (summary && summary.goalAmount > 0) {
      setGoalInput(String(summary.goalAmount))
    } else if (summary && summary.goalAmount === 0) {
      setGoalInput('')
    }
  }, [summary])

  const handleSaveGoal = async () => {
    const amount = parseFloat(goalInput.replace(/,/g, ''))
    if (Number.isNaN(amount) || amount < 0) return
    if (periodType === 'custom' && (!customStart || !customEnd)) return
    const key = periodType === 'custom' ? buildCustomPeriodKey(customStart, customEnd) : periodKey
    setSaving(true)
    try {
      const res = await fetch('/api/vibration/abundance/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_type: periodType,
          period_key: key,
          amount,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      await refetch()
      router.push('/abundance-tracker/goals')
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const canSetGoal = periodType !== 'custom' || (customStart && customEnd)

  return (
    <div className={shellCard}>
      <GoalPeriodPicker
        now={now}
        periodType={periodType}
        onPeriodTypeChange={setPeriodType}
        periodKey={periodKey}
        onPeriodKeyChange={setPeriodKey}
        customStart={customStart}
        onCustomStartChange={setCustomStart}
        customEnd={customEnd}
        onCustomEndChange={setCustomEnd}
      />

      {canSetGoal ? (
        <>
          <div className="border-b border-[#252525] px-4 py-5 text-center md:px-6 md:py-6">
            <p className={`${sectionLabel} mb-3`}>Choose amount</p>
            <div className="mx-auto w-full sm:max-w-[200px]">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="$"
                value={formatAmountWithCommas(goalInput)}
                onChange={(e) => setGoalInput(parseAmountInput(e.target.value))}
                prefix="$"
                className="!bg-[#1A1A1A] !border-[#282828]"
              />
            </div>
          </div>
          <div className="flex flex-col items-center px-4 pb-6 pt-5 md:px-6 md:pb-8">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveGoal}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 sm:w-auto"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save goal'}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}
