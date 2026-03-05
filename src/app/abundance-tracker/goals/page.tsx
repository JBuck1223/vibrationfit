'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Target, Save, BarChart3 } from 'lucide-react'
import {
  Container,
  Card,
  Stack,
  PageHero,
  Button,
  Input,
  Text,
  Select,
} from '@/lib/design-system/components'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { colors } from '@/lib/design-system/tokens'
import {
  getPeriodKey,
  formatPeriodLabel,
  buildCustomPeriodKey,
  type PeriodType,
} from '@/lib/abundance/period-utils'
import { ORDERED_VISION_CATEGORIES, META_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'

interface GoalSummary {
  period_type: PeriodType
  period_key: string
  period: { start: string; end: string }
  goalAmount: number
  moneyTotal: number
  valueTotal: number
  totalAmount: number
  leftToGo: number
}

interface SavedGoal {
  id: string
  period_type: PeriodType
  period_key: string
  amount: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

const MONEY_COLOR = colors.secondary[500]
const VALUE_COLOR = colors.energy.pink[500]
const LEFT_TO_GO_COLOR = colors.neutral[500]

function formatAmountWithCommas(value: string): string {
  if (!value) return ''
  const stripped = value.replace(/,/g, '')
  const parts = stripped.split('.')
  const intPart = parts[0].replace(/\D/g, '') || '0'
  const decPart = parts[1]?.replace(/\D/g, '').slice(0, 2) ?? ''
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const formatted = decPart ? `${withCommas}.${decPart}` : withCommas
  return stripped.endsWith('.') ? `${formatted}.` : formatted
}

function parseAmountInput(value: string): string {
  if (!value) return ''
  const stripped = value.replace(/,/g, '')
  const parts = stripped.split('.')
  const intPart = parts[0].replace(/\D/g, '') || '0'
  const decPart = parts[1]?.replace(/\D/g, '').slice(0, 2) ?? ''
  const hasTrailingDot = stripped.endsWith('.')
  if (decPart) return `${intPart}.${decPart}`
  if (hasTrailingDot) return `${intPart}.`
  return intPart
}

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom' },
]

const TIME_FRAME_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
  { value: 'other', label: 'Other' },
]

const LIFE_CATEGORIES_FOR_FILTER = ORDERED_VISION_CATEGORIES.filter(
  (c) => !META_CATEGORY_KEYS.includes(c.key as 'forward' | 'conclusion')
)

export default function AbundanceGoalsPage() {
  const now = new Date()
  const [periodType, setPeriodType] = useState<PeriodType>('month')
  const [periodKey, setPeriodKey] = useState(() => getPeriodKey(now, 'month'))
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [summary, setSummary] = useState<GoalSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [goalInput, setGoalInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [goalsList, setGoalsList] = useState<SavedGoal[]>([])
  const [filterTimeFrame, setFilterTimeFrame] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const fetchSummary = useCallback(async () => {
    if (periodType === 'custom' && (!customStart || !customEnd)) {
      setSummary(null)
      setLoading(false)
      return
    }
    const key = periodType === 'custom' ? buildCustomPeriodKey(customStart, customEnd) : periodKey
    try {
      const res = await fetch(
        `/api/vibration/abundance/goals/summary?period_type=${periodType}&period_key=${encodeURIComponent(key)}`
      )
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setSummary(data)
      setGoalInput(data.goalAmount > 0 ? String(data.goalAmount) : '')
    } catch (e) {
      console.error(e)
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [periodType, periodKey, customStart, customEnd])

  const fetchGoalsList = useCallback(async () => {
    try {
      const res = await fetch('/api/vibration/abundance/goals')
      if (!res.ok) return
      const data = await res.json()
      setGoalsList(Array.isArray(data) ? data : [])
    } catch {
      setGoalsList([])
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    fetchGoalsList()
  }, [fetchGoalsList])

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
      await fetchSummary()
      await fetchGoalsList()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const pieData =
    summary && summary.goalAmount > 0
      ? [
          ...(summary.moneyTotal > 0
            ? [{ name: 'Money', value: summary.moneyTotal, color: MONEY_COLOR }]
            : []),
          ...(summary.valueTotal > 0
            ? [{ name: 'Value', value: summary.valueTotal, color: VALUE_COLOR }]
            : []),
          ...(summary.leftToGo > 0
            ? [{ name: 'Left to go', value: summary.leftToGo, color: LEFT_TO_GO_COLOR }]
            : []),
        ]
      : []

  const goalMet = summary != null && summary.goalAmount > 0 && summary.totalAmount >= summary.goalAmount

  const filteredGoals = goalsList.filter((g) => {
    if (filterTimeFrame !== 'all') {
      const typeMatch =
        filterTimeFrame === 'other'
          ? g.period_type === 'custom'
          : g.period_type === filterTimeFrame
      if (!typeMatch) return false
    }
    if (filterCategory !== 'all') {
      // Goals don't have category yet; show all when a category is selected
      return true
    }
    return true
  })

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Money Goals"
          subtitle="Set a goal for the period and track money vs value."
        >
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/abundance-tracker">Back to Abundance</Link>
            </Button>
          </div>
        </PageHero>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-10 h-10 border-4 border-[#39FF14] border-t-transparent rounded-full mx-auto" />
            <p className="text-neutral-400 mt-4">Loading...</p>
          </div>
        ) : (
          <>
            {/* Set goal - centered, goal-setting layout */}
            <Card variant="outlined" className="w-full max-w-2xl mx-auto bg-[#101010] border-[#1F1F1F] overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 md:gap-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#39FF14]/15 border border-[#39FF14]/30">
                      <Target className="h-6 w-6 text-[#39FF14]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Set your goal</h2>
                      <p className="text-sm text-neutral-400">Choose a period and the amount you want to actualize.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-8 md:grid-cols-2">
                  <section className="space-y-3">
                    <Text size="sm" className="text-neutral-400 uppercase tracking-[0.2em]">
                      Time period
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {PERIOD_OPTIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setPeriodType(value)
                            if (value !== 'custom') setPeriodKey(getPeriodKey(now, value))
                          }}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            periodType === value
                              ? 'bg-[#39FF14] text-black'
                              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-700'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {periodType === 'custom' && (
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <input
                          type="date"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          className="rounded-xl border-2 border-[#333] bg-[#404040] px-4 py-2.5 text-sm text-white"
                        />
                        <span className="text-neutral-500">to</span>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                          className="rounded-xl border-2 border-[#333] bg-[#404040] px-4 py-2.5 text-sm text-white"
                        />
                      </div>
                    )}
                  </section>

                  <section className="space-y-3">
                    <Text size="sm" className="text-neutral-400 uppercase tracking-[0.2em]">
                      Goal amount
                    </Text>
                    <div className="flex flex-wrap items-center gap-3">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="$"
                        value={formatAmountWithCommas(goalInput)}
                        onChange={(e) => setGoalInput(parseAmountInput(e.target.value))}
                        prefix="$"
                        className="!bg-[#404040] !border-[#333] max-w-[200px]"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveGoal}
                        disabled={saving || (periodType === 'custom' && (!customStart || !customEnd))}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save goal'}
                      </Button>
                    </div>
                  </section>
                </div>
              </div>
            </Card>

            {/* Metrics row */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card variant="outlined" className="p-4 bg-[#101010] border-[#1F1F1F]">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-4 decoration-[#333] mb-1">Goal</p>
                  <p className="text-xl font-bold text-white tabular-nums">
                    {formatCurrency(summary.goalAmount)}
                  </p>
                </Card>
                <Card variant="outlined" className="p-4 bg-[#101010] border-[#1F1F1F]">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-4 decoration-[#333] mb-1">Money</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: MONEY_COLOR }}>
                    {formatCurrency(summary.moneyTotal)}
                  </p>
                </Card>
                <Card variant="outlined" className="p-4 bg-[#101010] border-[#1F1F1F]">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-4 decoration-[#333] mb-1">Value</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: VALUE_COLOR }}>
                    {formatCurrency(summary.valueTotal)}
                  </p>
                </Card>
                <Card variant="outlined" className="p-4 bg-[#101010] border-[#1F1F1F]">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-4 decoration-[#333] mb-1">Left to go</p>
                  <p className="text-xl font-bold text-white tabular-nums">
                    {formatCurrency(summary.leftToGo)}
                  </p>
                </Card>
              </div>
            )}

            {/* Success banner */}
            {goalMet && (
              <div
                className="rounded-2xl border-2 border-[#39FF14]/50 p-4 md:p-5 flex items-center gap-3"
                style={{ backgroundColor: 'rgba(57, 255, 20, 0.1)' }}
              >
                <Target className="w-8 h-8 shrink-0 text-[#39FF14]" />
                <div>
                  <p className="font-semibold text-white">
                    You have smashed your goal this period. Congrats. Keep going.
                  </p>
                </div>
              </div>
            )}

            {/* Pie chart */}
            {summary && (pieData.length > 0 || summary.goalAmount > 0) && (
              <Card variant="outlined" className="p-6 bg-[#101010] border-[#1F1F1F]">
                <h3 className="text-sm uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-4 decoration-[#333] mb-4">Goal vs actual</h3>
                {pieData.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, value }) =>
                            value > 0 ? `${name}: ${formatCurrency(value)}` : ''
                          }
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: colors.neutral[800],
                            border: `1px solid ${colors.neutral[600]}`,
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-neutral-400 py-8 text-center">
                    No abundance logged for this period yet. Log moments on the main tracker to see progress.
                  </p>
                )}
              </Card>
            )}

            {/* Filter bar + goals list */}
            <div className="space-y-4">
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.2em]">
                Your goals
              </Text>
              <Card variant="outlined" className="w-full bg-[#0D0D0D] border-[#333] p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Time frame</span>
                    <div className="flex flex-wrap gap-1.5">
                      {TIME_FRAME_FILTERS.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFilterTimeFrame(value)}
                          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                            filterTimeFrame === value
                              ? 'bg-[#39FF14] text-black'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-700'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Life category</span>
                    <Select
                      value={filterCategory}
                      onChange={(v) => setFilterCategory(v)}
                      options={[
                        { value: 'all', label: 'All' },
                        ...LIFE_CATEGORIES_FOR_FILTER.map((c) => ({ value: c.key, label: c.label })),
                      ]}
                      className="min-w-[140px] !bg-[#404040] !border-[#333]"
                    />
                  </div>
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link href="/abundance-tracker/reports" className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      See Reports
                    </Link>
                  </Button>
                </div>
              </Card>

              {filteredGoals.length === 0 ? (
                <p className="text-neutral-500 text-sm py-6 text-center">
                  {goalsList.length === 0
                    ? 'No goals yet. Set one above.'
                    : 'No goals match the current filters.'}
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredGoals.map((goal) => (
                    <Card
                      key={goal.id}
                      variant="outlined"
                      className="p-4 bg-[#101010] border-[#1F1F1F]"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-1">
                        {formatPeriodLabel(goal.period_type, goal.period_key)}
                      </p>
                      <p className="text-xl font-bold text-white tabular-nums">
                        {formatCurrency(Number(goal.amount))}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Stack>
    </Container>
  )
}
