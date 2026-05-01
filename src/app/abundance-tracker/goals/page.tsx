'use client'

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Target } from 'lucide-react'
import { Container, Stack } from '@/lib/design-system/components'
import { colors } from '@/lib/design-system/tokens'
import { getPeriodKey, formatPeriodLabel, type PeriodType } from '@/lib/abundance/period-utils'
import { useGoalPeriodSummary } from './use-goal-period-summary'
import {
  shellCard,
  goalsFilterBarShell,
  chartHeaderBar,
  metricTile,
  TIME_FRAME_FILTERS,
} from './ui-constants'

const GoalsPieChartDynamic = dynamic(
  () => import('./goals-pie-chart').then((m) => m.GoalsPieChart),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[260px] w-full min-w-0 animate-pulse rounded-xl bg-[#141414] sm:h-[280px] lg:h-[270px]"
        aria-hidden
      />
    ),
  }
)

/** Primary / secondary button styling — avoid Button asChild + Link (React 19 / Next 15) */
const primaryBtnSm =
  'inline-flex w-full shrink-0 items-center justify-center rounded-full border-2 border-transparent bg-[#39FF14] px-4 py-3 text-sm font-semibold text-black transition-all duration-300 antialiased hover:border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] active:opacity-80 sm:w-auto md:px-5'
const secondaryBtnSm =
  'mt-4 inline-flex items-center justify-center rounded-full border-2 border-transparent bg-[#00FFFF] px-4 py-3 text-sm font-semibold text-black transition-all duration-300 antialiased hover:border-[rgba(0,255,255,0.2)] hover:bg-[rgba(0,255,255,0.1)] hover:text-[#00FFFF] active:opacity-80 md:px-5'

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

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`${metricTile} animate-pulse`}>
          <div className="mb-2 h-3 w-14 rounded bg-neutral-700/70 md:w-16" />
          <div className="h-8 w-20 rounded bg-neutral-700/50 md:w-24" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className={shellCard} aria-hidden>
      <div className={chartHeaderBar}>
        <div className="mx-auto h-3 w-32 animate-pulse rounded bg-neutral-700/50" />
      </div>
      <div className="px-4 py-4 md:px-6 md:py-5">
        <div className="h-[260px] w-full animate-pulse rounded-xl bg-[#141414] sm:h-[280px] lg:h-[270px]" />
      </div>
    </div>
  )
}

export default function AbundanceGoalsOverviewPage() {
  /** Metrics + chart use current calendar month (period picker removed from overview) */
  const [summaryMonthKey] = useState(() => getPeriodKey(new Date(), 'month'))
  const [goalsList, setGoalsList] = useState<SavedGoal[]>([])
  const [filterTimeFrame, setFilterTimeFrame] = useState<string>('all')

  const { summary, summaryLoading } = useGoalPeriodSummary('month', summaryMonthKey, '', '')

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
    fetchGoalsList()
  }, [fetchGoalsList])

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
    if (filterTimeFrame === 'all') return true
    const typeMatch =
      filterTimeFrame === 'other'
        ? g.period_type === 'custom'
        : g.period_type === filterTimeFrame
    return typeMatch
  })

  return (
    <Container size="xl">
      <Stack gap="lg">
        <h1 className="sr-only">Money Goals — Overview</h1>

            {summaryLoading ? (
              <MetricsSkeleton />
            ) : (
              summary && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                  <div className={metricTile}>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">Goal</p>
                    <p className="text-xl font-bold tabular-nums" style={{ color: colors.primary[500] }}>
                      {formatCurrency(summary.goalAmount)}
                    </p>
                  </div>
                  <div className={metricTile}>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                      Left to go
                    </p>
                    <p className="text-xl font-bold tabular-nums text-white">
                      {formatCurrency(summary.leftToGo)}
                    </p>
                  </div>
                  <div className={metricTile}>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">Money</p>
                    <p className="text-xl font-bold tabular-nums" style={{ color: MONEY_COLOR }}>
                      {formatCurrency(summary.moneyTotal)}
                    </p>
                  </div>
                  <div className={metricTile}>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">Value</p>
                    <p className="text-xl font-bold tabular-nums" style={{ color: VALUE_COLOR }}>
                      {formatCurrency(summary.valueTotal)}
                    </p>
                  </div>
                </div>
              )
            )}

            {!summaryLoading && goalMet && (
              <div className="flex items-center gap-3 rounded-2xl border border-[#39FF14]/35 bg-[#39FF14]/10 p-4 md:p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
                <Target className="h-8 w-8 shrink-0 text-[#39FF14]" />
                <div>
                  <p className="font-semibold text-white">
                    You have smashed your goal this period. Congrats. Keep going.
                  </p>
                </div>
              </div>
            )}

            {summaryLoading ? (
              <ChartSkeleton />
            ) : (
              summary &&
              (pieData.length > 0 || summary.goalAmount > 0) && (
                <div className={shellCard}>
                  <div className={chartHeaderBar}>
                    <p className="text-center text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500">
                      Goal vs actual
                    </p>
                  </div>
                  <div className="px-4 py-4 md:px-6 md:py-5">
                    {pieData.length > 0 ? (
                      <GoalsPieChartDynamic data={pieData} />
                    ) : (
                      <p className="py-8 text-center text-neutral-400">
                        No abundance logged for this period yet. Log moments on the main tracker to see progress.
                      </p>
                    )}
                  </div>
                </div>
              )
            )}

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
                <p className="text-center text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500 sm:text-left">
                  Your goals
                </p>
                <Link href="/abundance-tracker/goals/new" className={primaryBtnSm}>
                  New goal
                </Link>
              </div>

              <div className={`${goalsFilterBarShell} w-full`}>
                <div
                  className="flex flex-wrap justify-center gap-2"
                  role="group"
                  aria-label="Filter goals by time frame"
                >
                  {TIME_FRAME_FILTERS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilterTimeFrame(value)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        filterTimeFrame === value
                          ? 'bg-[#39FF14] text-black'
                          : 'border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredGoals.length === 0 ? (
                <div className="overflow-hidden rounded-xl border border-[#333] bg-[#0c0c0c] px-4 py-10 text-center">
                  <p className="text-sm text-neutral-500">
                    {goalsList.length === 0
                      ? 'No goals saved yet.'
                      : 'No goals match the current filters.'}
                  </p>
                  {goalsList.length === 0 && (
                    <Link href="/abundance-tracker/goals/new" className={secondaryBtnSm}>
                      Add a goal
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#333] bg-[#0c0c0c]">
                  {filteredGoals.map((goal) => (
                    <div key={goal.id} className="border-b border-[#1f1f1f] last:border-b-0">
                      <div className="flex w-full items-center justify-between gap-3 px-3 py-2 md:px-3.5 md:py-2.5">
                        <span className="min-w-0 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500 md:text-xs">
                          {formatPeriodLabel(goal.period_type, goal.period_key)}
                        </span>
                        <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-[#39FF14] md:text-base">
                          {formatCurrency(Number(goal.amount))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
      </Stack>
    </Container>
  )
}
