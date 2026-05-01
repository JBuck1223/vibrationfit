'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ChevronDown, Filter, Plus, Target } from 'lucide-react'
import { Button, Container, Stack, Select } from '@/lib/design-system/components'
import { colors } from '@/lib/design-system/tokens'
import { getPeriodKey, formatPeriodLabel, type PeriodType } from '@/lib/abundance/period-utils'
import { goalAppliesToNow } from '@/lib/abundance/goal-active'
import { useGoalPeriodSummary, type GoalSummary } from './use-goal-period-summary'
import {
  shellCard,
  chartHeaderBar,
  metricTile,
  TIME_FRAME_FILTERS,
  sectionLabel,
  selectTriggerSurface,
} from './ui-constants'

interface SavedGoal {
  id: string
  period_type: PeriodType
  period_key: string
  amount: number
}

const FOCUS_STORAGE_KEY = 'abundance-goals-overview-focus'

const GOAL_TYPE_ORDER: PeriodType[] = ['week', 'month', 'quarter', 'year', 'custom']

function goalSortKey(a: SavedGoal, b: SavedGoal): number {
  const ti = GOAL_TYPE_ORDER.indexOf(a.period_type)
  const tj = GOAL_TYPE_ORDER.indexOf(b.period_type)
  if (ti !== tj) return ti - tj
  return a.period_key.localeCompare(b.period_key)
}

function resolveFocusToSummaryParams(
  focusKey: string,
  goalsList: SavedGoal[],
  now: Date
): { periodType: PeriodType; periodKey: string; customStart: string; customEnd: string } {
  const fallback = () => ({
    periodType: 'month' as const,
    periodKey: getPeriodKey(now, 'month'),
    customStart: '',
    customEnd: '',
  })

  if (focusKey === 'none' || focusKey === '') {
    return fallback()
  }

  if (focusKey.startsWith('goal:')) {
    const id = focusKey.slice('goal:'.length)
    const goal = goalsList.find((g) => g.id === id)
    if (!goal) return fallback()
    if (goal.period_type === 'custom') {
      const parts = goal.period_key.split('_')
      if (parts.length === 2) {
        return {
          periodType: 'custom',
          periodKey: '',
          customStart: parts[0]!,
          customEnd: parts[1]!,
        }
      }
      return fallback()
    }
    return {
      periodType: goal.period_type,
      periodKey: goal.period_key,
      customStart: '',
      customEnd: '',
    }
  }

  return fallback()
}

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

/** Matches vision-board new-item control */
const newGoalPlusLinkClassName =
  'flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#39FF14]/20 transition-all duration-200 hover:bg-[#39FF14]/30'

/** Primary CTA in empty-state card (anchor must wrap visible content for reliable layout) */
const emptyStateNewGoalCtaClassName =
  'inline-flex items-center justify-center gap-2 rounded-full border-2 border-transparent bg-[#39FF14] px-5 py-3 text-sm font-semibold text-black transition-all duration-300 hover:border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] active:opacity-80'

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

function GoalMetricCards({ summary }: { summary: GoalSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      <div className={metricTile}>
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">Goal</p>
        <p className="text-xl font-bold tabular-nums" style={{ color: colors.primary[500] }}>
          {formatCurrency(summary.goalAmount)}
        </p>
      </div>
      <div className={metricTile}>
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">Left to go</p>
        <p className="text-xl font-bold tabular-nums text-white">{formatCurrency(summary.leftToGo)}</p>
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
}

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

/** Fetches period summary only while the parent goal row is expanded */
function GoalExpandMetrics({ goal, goalsList }: { goal: SavedGoal; goalsList: SavedGoal[] }) {
  const summaryParams = useMemo(
    () => resolveFocusToSummaryParams(`goal:${goal.id}`, goalsList, new Date()),
    [goal.id, goalsList]
  )
  const { summary, summaryLoading } = useGoalPeriodSummary(
    summaryParams.periodType,
    summaryParams.periodKey,
    summaryParams.customStart,
    summaryParams.customEnd
  )
  if (summaryLoading) return <MetricsSkeleton />
  if (!summary) return null
  return <GoalMetricCards summary={summary} />
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

function ProgressPickerSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-2" aria-hidden>
      <div className="mx-auto h-3 w-28 animate-pulse rounded bg-neutral-700/50" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-neutral-800/90" />
    </div>
  )
}

export default function AbundanceGoalsOverviewPage() {
  const [focusKey, setFocusKey] = useState('none')
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null)
  const [showGoalFilters, setShowGoalFilters] = useState(false)
  const [goalsList, setGoalsList] = useState<SavedGoal[]>([])
  const [goalsFetchDone, setGoalsFetchDone] = useState(false)
  const [filterTimeFrame, setFilterTimeFrame] = useState<string>('all')

  const activeGoals = useMemo(
    () => goalsList.filter((g) => goalAppliesToNow(g)),
    [goalsList]
  )

  const sortedActiveGoals = useMemo(() => [...activeGoals].sort(goalSortKey), [activeGoals])

  const resolvedFocusKey = useMemo(() => {
    if (sortedActiveGoals.length === 0) return 'none'
    if (focusKey.startsWith('goal:')) {
      const id = focusKey.slice('goal:'.length)
      if (sortedActiveGoals.some((g) => g.id === id)) return focusKey
    }
    return `goal:${sortedActiveGoals[0]!.id}`
  }, [sortedActiveGoals, focusKey])

  const focusSelectOptions = useMemo(
    () =>
      sortedActiveGoals.map((g) => ({
        value: `goal:${g.id}`,
        label: `${formatPeriodLabel(g.period_type, g.period_key)} ${formatCurrency(Number(g.amount))}`,
      })),
    [sortedActiveGoals]
  )

  const summaryParams = useMemo(
    () => resolveFocusToSummaryParams(resolvedFocusKey, goalsList, new Date()),
    [resolvedFocusKey, goalsList]
  )

  const { summary, summaryLoading } = useGoalPeriodSummary(
    summaryParams.periodType,
    summaryParams.periodKey,
    summaryParams.customStart,
    summaryParams.customEnd
  )

  const filteredGoals = useMemo(() => {
    return goalsList.filter((g) => {
      if (filterTimeFrame === 'all') return true
      const typeMatch =
        filterTimeFrame === 'other'
          ? g.period_type === 'custom'
          : g.period_type === filterTimeFrame
      return typeMatch
    })
  }, [goalsList, filterTimeFrame])

  const sortedFilteredGoals = useMemo(() => [...filteredGoals].sort(goalSortKey), [filteredGoals])

  useEffect(() => {
    if (
      expandedGoalId &&
      !filteredGoals.some((g) => g.id === expandedGoalId)
    ) {
      setExpandedGoalId(null)
    }
  }, [filteredGoals, expandedGoalId])

  useEffect(() => {
    if (!goalsFetchDone) return
    if (activeGoals.length === 0) {
      setFocusKey('none')
      try {
        sessionStorage.removeItem(FOCUS_STORAGE_KEY)
      } catch {
        /* ignore */
      }
      return
    }
    try {
      const stored = sessionStorage.getItem(FOCUS_STORAGE_KEY)
      if (stored?.startsWith('goal:')) {
        const id = stored.slice('goal:'.length)
        if (activeGoals.some((g) => g.id === id)) {
          setFocusKey(stored)
          return
        }
      }
    } catch {
      /* ignore */
    }
    const next = `goal:${activeGoals[0]!.id}`
    setFocusKey(next)
    try {
      sessionStorage.setItem(FOCUS_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [goalsFetchDone, activeGoals])

  const persistFocus = useCallback((next: string) => {
    setFocusKey(next)
    try {
      sessionStorage.setItem(FOCUS_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const fetchGoalsList = useCallback(async () => {
    try {
      const res = await fetch('/api/vibration/abundance/goals')
      if (!res.ok) return
      const data = await res.json()
      setGoalsList(Array.isArray(data) ? data : [])
    } catch {
      setGoalsList([])
    } finally {
      setGoalsFetchDone(true)
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

  return (
    <Container size="xl">
      <Stack gap="lg">
        <h1 className="sr-only">Money Goals — Overview</h1>

            <div className={`${shellCard} w-full p-4 md:p-6 lg:p-8`}>
              {!goalsFetchDone ? (
                <ProgressPickerSkeleton />
              ) : activeGoals.length === 0 ? (
                <div className="mx-auto max-w-xl px-2 py-4 text-center md:py-6">
                  <p className="text-sm text-neutral-400">
                    You do not have any active money goals for the current period.
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    Set a goal for this week, month, or another period to track progress here.
                  </p>
                  <div className="mt-5 flex justify-center">
                    <Link
                      href="/abundance-tracker/goals/new"
                      className={emptyStateNewGoalCtaClassName}
                    >
                      <Plus className="h-5 w-5 shrink-0" aria-hidden />
                      Make a new money goal
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 md:space-y-6">
                  <div className="mx-auto w-full max-w-xl space-y-2">
                    <p className={`${sectionLabel} mb-2`}>Progress for</p>
                    <Select
                      value={resolvedFocusKey}
                      onChange={persistFocus}
                      options={focusSelectOptions}
                      placeholder="Choose goal..."
                      className={`w-full max-w-xl mx-auto ${selectTriggerSurface}`}
                    />
                  </div>
                  {summaryLoading ? (
                    <MetricsSkeleton />
                  ) : (
                    summary && <GoalMetricCards summary={summary} />
                  )}
                </div>
              )}
            </div>

            {goalsFetchDone && activeGoals.length > 0 && !summaryLoading && goalMet && (
              <div className="flex items-center gap-3 rounded-2xl border border-[#39FF14]/35 bg-[#39FF14]/10 p-4 md:p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
                <Target className="h-8 w-8 shrink-0 text-[#39FF14]" />
                <div>
                  <p className="font-semibold text-white">
                    You have smashed your goal this period. Congrats. Keep going.
                  </p>
                </div>
              </div>
            )}

            {goalsFetchDone && activeGoals.length > 0 && summaryLoading ? (
              <ChartSkeleton />
            ) : goalsFetchDone && activeGoals.length > 0 ? (
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
            ) : null}

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href="/abundance-tracker/goals/new"
                  className={newGoalPlusLinkClassName}
                  aria-label="New money goal"
                >
                  <Plus className="h-6 w-6 text-[#39FF14]" />
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => setShowGoalFilters((open) => !open)}
                  className="flex items-center gap-2"
                  aria-expanded={showGoalFilters}
                  aria-controls="goals-timeframe-filters"
                  aria-label="Filter goals by time frame"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
              </div>

              {showGoalFilters && (
                <div
                  id="goals-timeframe-filters"
                  className="mx-auto grid w-full max-w-md grid-cols-3 gap-2 animate-in slide-in-from-top duration-300 justify-items-stretch md:max-w-none md:flex md:flex-wrap md:justify-center md:gap-2"
                  role="group"
                  aria-label="Time frame options"
                >
                  {TIME_FRAME_FILTERS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilterTimeFrame(value)}
                      className={`w-full min-w-0 rounded-full px-3 py-1.5 text-center text-sm font-medium transition-colors md:w-auto ${
                        filterTimeFrame === value
                          ? 'bg-[#39FF14] text-black'
                          : 'border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {filteredGoals.length === 0 ? (
                <div className="overflow-hidden rounded-xl border border-[#333] bg-[#0c0c0c] px-4 py-10 text-center">
                  <p className="text-sm text-neutral-500">
                    {goalsList.length === 0
                      ? 'No goals saved yet.'
                      : 'No goals match the current filters.'}
                  </p>
                  {goalsList.length === 0 && (
                    <div className="mt-4 flex justify-center">
                      <Link
                        href="/abundance-tracker/goals/new"
                        className={newGoalPlusLinkClassName}
                        aria-label="Add a goal"
                      >
                        <Plus className="h-6 w-6 text-[#39FF14]" />
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#333] bg-[#0c0c0c]">
                  {sortedFilteredGoals.map((goal) => {
                    const isExpanded = expandedGoalId === goal.id
                    return (
                      <div key={goal.id} className="border-b border-[#1f1f1f] last:border-b-0">
                        <div
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 hover:bg-white/[0.03] md:gap-3 md:px-3.5 md:py-2.5 ${
                            isExpanded ? 'bg-white/[0.04]' : ''
                          }`}
                          onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setExpandedGoalId(isExpanded ? null : goal.id)
                            }
                          }}
                        >
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500 md:text-xs">
                            {formatPeriodLabel(goal.period_type, goal.period_key)}
                          </span>
                          <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-[#39FF14] md:text-base">
                            {formatCurrency(Number(goal.amount))}
                          </span>
                        </div>
                        {isExpanded && (
                          <div
                            className="border-t border-[#252525] bg-[#0a0a0a] px-3 pb-4 pt-3 md:px-3.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GoalExpandMetrics goal={goal} goalsList={goalsList} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
      </Stack>
    </Container>
  )
}
