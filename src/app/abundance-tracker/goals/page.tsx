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
  DatePicker,
} from '@/lib/design-system/components'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { colors } from '@/lib/design-system/tokens'
import {
  getPeriodKey,
  formatPeriodLabel,
  formatPeriodForGoalLabel,
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

function ChartLegend(props: { payload?: Array<{ value: string; color: string; payload?: { value?: number } }>; formatCurrency?: (n: number) => string }) {
  const { payload = [], formatCurrency: fmt = formatCurrency } = props
  return (
    <ul className="flex flex-wrap justify-center gap-2 pt-3 list-none p-0 m-0">
      {payload.map((entry, i) => (
        <li
          key={`legend-${i}`}
          className="inline-flex items-center gap-2 rounded-full border border-[#333] bg-[#0d0d0d] px-3 py-1.5 text-sm text-white shadow-sm transition hover:border-[#444] hover:bg-[#151515]"
        >
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{
              backgroundColor: entry.color,
              boxShadow: `0 0 8px ${entry.color}40`,
            }}
          />
          <span>
            {entry.value}: {fmt(entry.payload?.value ?? 0)}
          </span>
        </li>
      ))}
    </ul>
  )
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
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
            >
              <Link href="/abundance-tracker">Abundance Tracker</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
            >
              <Link href="/abundance-tracker/reports">
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Reports</span>
              </Link>
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
            {/* Set goal - 3 steps */}
            <Card variant="outlined" className="w-full bg-[#1F1F1F] border-2 border-[#333]">
              <div className="space-y-6 flex flex-col items-center text-center">
                <h2 className="text-lg font-semibold tracking-wide text-white">
                  Set Your Money Goal
                </h2>
                {/* 1. Select time period */}
                <section className="space-y-2.5 w-full flex flex-col items-center">
                  <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                    Select time period
                  </Text>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {PERIOD_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setPeriodType(value)
                          if (value !== 'custom') setPeriodKey(getPeriodKey(now, value))
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          periodType === value
                            ? 'bg-[#39FF14] text-black'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {periodType !== 'custom' && (
                    <div className="w-full flex justify-center pt-5">
                      {periodType === 'month' && (() => {
                        const currentYear = now.getFullYear()
                        const currentMonth = now.getMonth()
                        const options: { value: string; label: string }[] = []
                        for (let i = 0; i < 24; i++) {
                          const d = new Date(currentYear, currentMonth + i, 1)
                          const y = d.getFullYear()
                          const m = d.getMonth() + 1
                          const value = `${y}-${String(m).padStart(2, '0')}`
                          const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
                          options.push({ value, label })
                        }
                        return (
                          <Select
                            value={periodKey}
                            onChange={(value) => setPeriodKey(value)}
                            placeholder="Select month..."
                            options={options}
                            className="w-full sm:w-[200px]"
                          />
                        )
                      })()}
                      {periodType === 'quarter' && (() => {
                        const currentYear = now.getFullYear()
                        const currentQ = Math.ceil((now.getMonth() + 1) / 3)
                        const options: { value: string; label: string }[] = []
                        for (let y = currentYear; y <= currentYear + 2; y++) {
                          const startQ = y === currentYear ? currentQ : 1
                          for (let q = startQ; q <= 4; q++) {
                            options.push({ value: `${y}-Q${q}`, label: `Q${q} ${y}` })
                          }
                        }
                        return (
                          <Select
                            value={periodKey}
                            onChange={(value) => setPeriodKey(value)}
                            placeholder="Select quarter..."
                            options={options}
                            className="w-full sm:w-[200px]"
                          />
                        )
                      })()}
                      {periodType === 'year' && (
                        <Select
                          value={periodKey}
                          onChange={(value) => setPeriodKey(value)}
                          placeholder="Select year..."
                          options={Array.from({ length: 5 }, (_, i) => {
                            const y = now.getFullYear() + i
                            return { value: String(y), label: String(y) }
                          })}
                          className="w-full sm:w-[200px]"
                        />
                      )}
                    </div>
                  )}
                  {periodType === 'custom' && (
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-5">
                      <DatePicker
                        value={customStart}
                        onChange={(dateString: string) => setCustomStart(dateString)}
                        className="w-full sm:w-auto"
                      />
                      <span className="text-neutral-500">to</span>
                      <DatePicker
                        value={customEnd}
                        onChange={(dateString: string) => setCustomEnd(dateString)}
                        minDate={customStart || undefined}
                        className="w-full sm:w-auto"
                      />
                    </div>
                  )}
                </section>

                {/* 2. Choose amount */}
                {(() => {
                  const canSetGoal = periodType !== 'custom' || (customStart && customEnd)
                  return canSetGoal ? (
                    <section className="space-y-2.5 w-full flex flex-col items-center">
                      <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                        Choose amount
                      </Text>
                      <div className="w-full sm:max-w-[200px]">
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="$"
                          value={formatAmountWithCommas(goalInput)}
                          onChange={(e) => setGoalInput(parseAmountInput(e.target.value))}
                          prefix="$"
                          className="!bg-[#404040] !border-2 !border-[#333]"
                        />
                      </div>
                    </section>
                  ) : null
                })()}

                {/* 3. Save goal */}
                {(() => {
                  const canSetGoal = periodType !== 'custom' || (customStart && customEnd)
                  return canSetGoal ? (
                    <section className="w-full flex flex-col items-center">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveGoal}
                        disabled={saving}
                        className="w-full sm:w-auto flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save goal'}
                      </Button>
                    </section>
                  ) : null
                })()}
              </div>
            </Card>

            {/* Metrics row */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card variant="outlined" className="p-4 bg-[#1F1F1F]">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-4 decoration-[#333] mb-1">Goal</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: colors.primary[500] }}>
                    {formatCurrency(summary.goalAmount)}
                  </p>
                </Card>
                <Card variant="outlined" className="p-4 bg-[#1F1F1F]">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-4 decoration-[#333] mb-1">Left to go</p>
                  <p className="text-xl font-bold text-white tabular-nums">
                    {formatCurrency(summary.leftToGo)}
                  </p>
                </Card>
                <Card variant="outlined" className="p-4 bg-[#1F1F1F]">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-4 decoration-[#333] mb-1">Money</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: MONEY_COLOR }}>
                    {formatCurrency(summary.moneyTotal)}
                  </p>
                </Card>
                <Card variant="outlined" className="p-4 bg-[#1F1F1F]">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-4 decoration-[#333] mb-1">Value</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: VALUE_COLOR }}>
                    {formatCurrency(summary.valueTotal)}
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
                  <div className="h-[280px] w-full min-w-0 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="45%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={0}
                          dataKey="value"
                          nameKey="name"
                          label={false}
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend
                          layout="vertical"
                          verticalAlign="bottom"
                          align="center"
                          content={(props: any) => <ChartLegend {...props} formatCurrency={formatCurrency} />}
                        />
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
                <div className="flex flex-col gap-4">
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
                      className="min-w-[140px]"
                    />
                  </div>
                </div>
              </Card>

              {filteredGoals.length === 0 ? (
                <p className="text-neutral-500 text-sm py-6 text-center">
                  {goalsList.length === 0
                    ? 'No goals yet. Set one above.'
                    : 'No goals match the current filters.'}
                </p>
              ) : (
                <div className="grid gap-3">
                  {filteredGoals.map((goal) => (
                    <Card
                      key={goal.id}
                      variant="outlined"
                      className="p-4 bg-[#1F1F1F]"
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
