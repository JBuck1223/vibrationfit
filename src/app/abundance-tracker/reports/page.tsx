'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Container, Stack, Button, Select, DatePicker, HouseholdScopeToggle, type HouseholdScope } from '@/lib/design-system/components'
import { colors } from '@/lib/design-system/tokens'
import { getEntryCategoryDisplay } from '@/lib/abundance/entry-categories'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

function getVisionLabel(key: string): string {
  const cat = VISION_CATEGORIES.find((c) => c.key === key)
  return cat?.label ?? key.charAt(0).toUpperCase() + key.slice(1)
}

interface ReportData {
  period: string
  start: string
  end: string
  moneyTotal: number
  valueTotal: number
  totalAmount: number
  entryBreakdown: Record<string, { count: number; amount: number }>
  visionBreakdown: Record<string, { count: number; amount: number }>
  household?: {
    id: string
    name: string
    isMultiMember: boolean
    members: { userId: string; firstName?: string | null; displayName: string; avatarUrl: string | null; isSelf: boolean }[]
  } | null
}

const MONEY_COLOR = colors.secondary[500]
const VALUE_COLOR = colors.energy.pink[500]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Matches Abundance Tracker overview cards / legend pills */
const shellCard =
  'overflow-hidden rounded-2xl border border-[#282828] bg-[#101010] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]'
const sectionLabel = 'mb-3 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500'
const segmentTrackFour =
  'grid grid-cols-4 gap-0 overflow-hidden rounded-xl bg-zinc-950/90 p-1 ring-1 ring-inset ring-white/[0.08]'

/** Aligns Money vs value / By category header strips on desktop (separator lines match). */
const chartHeaderBar =
  'flex items-center border-b border-[#252525] px-4 py-3 md:min-h-[3.5rem] md:px-6'

/** Matches abundance / journal select surfaces */
const periodSelectClassName =
  'w-full max-w-md mx-auto [&_button]:!min-h-[3rem] [&_button]:!rounded-xl [&_button]:!border [&_button]:!border-[#282828] [&_button]:!bg-[#1A1A1A] [&_button]:!py-3 [&_button]:!pl-4 [&_button]:!pr-12 [&_button]:!text-left [&_button]:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] [&_button]:transition-colors [&_button]:hover:!border-primary-500/40'

/** Same surface as period select — DatePicker styles the inner input */
const customRangeDateClassName =
  'w-full [&_input]:!min-h-[3rem] [&_input]:!rounded-xl [&_input]:!border [&_input]:!border-solid [&_input]:!border-[#282828] [&_input]:!bg-[#1A1A1A] [&_input]:!py-3 [&_input]:!pl-4 [&_input]:!pr-10 [&_input]:!text-white [&_input]:placeholder:!text-neutral-500 [&_input]:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] [&_input]:transition-colors [&_input]:hover:!border-primary-500/40 [&_svg]:!text-neutral-400'

function pieLegendPayload(entries: { name: string; value: number; color: string }[]) {
  return entries.map((d) => ({
    value: d.name,
    color: d.color,
    payload: { value: d.value },
  }))
}

function ChartLegend(props: { payload?: Array<{ value: string; color: string; payload?: { value?: number } }>; formatCurrency?: (n: number) => string }) {
  const { payload = [], formatCurrency: fmt = formatCurrency } = props
  return (
    <ul className="flex flex-wrap justify-center gap-2 pt-2 list-none p-0 m-0">
      {payload.map((entry, i) => (
        <li
          key={`legend-${i}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white transition hover:border-white/[0.12] hover:bg-white/[0.06]"
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

export default function AbundanceReportsPage() {
  const now = new Date()
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('month')
  const [periodKey, setPeriodKey] = useState(() => {
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  })
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [categoryView, setCategoryView] = useState<'entry' | 'vision'>('entry')
  const [scope, setScope] = useState<HouseholdScope>('me')

  useEffect(() => {
    if (period === 'month') {
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      setPeriodKey(`${y}-${m}`)
    } else if (period === 'quarter') {
      const q = Math.ceil((now.getMonth() + 1) / 3)
      setPeriodKey(`${now.getFullYear()}-Q${q}`)
    } else if (period === 'year') {
      setPeriodKey(String(now.getFullYear()))
    }
  }, [period])

  const setPeriodAndKey = (p: 'month' | 'quarter' | 'year' | 'custom') => {
    setPeriod(p)
    if (p === 'month') {
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      setPeriodKey(`${y}-${m}`)
    } else if (p === 'quarter') {
      const q = Math.ceil((now.getMonth() + 1) / 3)
      setPeriodKey(`${now.getFullYear()}-Q${q}`)
    } else if (p === 'year') {
      setPeriodKey(String(now.getFullYear()))
    }
  }

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      let url = '/api/vibration/abundance/reports?'
      if (period === 'custom' && customStart && customEnd) {
        url += `period=custom&start=${customStart}&end=${customEnd}`
      } else {
        url += `period=${period}&key=${encodeURIComponent(periodKey)}`
      }
      if (scope !== 'me') url += '&scope=all'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [period, periodKey, customStart, customEnd, scope])

  useEffect(() => {
    if (period === 'custom' && (!customStart || !customEnd)) {
      setData(null)
      return
    }
    if (period !== 'custom') {
      fetchReport()
    } else {
      setData(null)
    }
  }, [period, periodKey, customStart, customEnd, fetchReport])

  const runCustomReport = () => {
    if (customStart && customEnd) fetchReport()
  }

  const moneyValuePieData = data
    ? [
        ...(data.moneyTotal > 0 ? [{ name: 'Money', value: data.moneyTotal, color: MONEY_COLOR }] : []),
        ...(data.valueTotal > 0 ? [{ name: 'Value', value: data.valueTotal, color: VALUE_COLOR }] : []),
      ]
    : []

  const breakdown = data
    ? categoryView === 'entry'
      ? data.entryBreakdown
      : data.visionBreakdown
    : {}
  const breakdownEntries = Object.entries(breakdown)
    .filter(([, v]) => v.amount > 0)
    .sort((a, b) => b[1].amount - a[1].amount)
  const getLabel = categoryView === 'entry'
    ? (key: string) => getEntryCategoryDisplay(key).label
    : (key: string) => getVisionLabel(key)
  const CATEGORY_COLORS = [
    colors.secondary[500],
    colors.energy.pink[500],
    colors.accent[500],
    colors.primary[500],
    colors.energy.yellow[500],
    colors.energy.orange[500],
  ]
  const categoryPieData = breakdownEntries.map(([key, v], i) => ({
    name: getLabel(key),
    value: v.amount,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }))

  return (
    <Container size="xl">
      <Stack gap="md">
        <h1 className="sr-only">Reports</h1>

        {/* Household lens: combined report when on Both */}
        {data?.household?.isMultiMember && (
          <div className="flex items-center justify-center">
            <HouseholdScopeToggle
              compact
              members={(data.household.members || []).map((m) => ({
                userId: m.userId,
                displayName: m.firstName || m.displayName,
                avatarUrl: m.avatarUrl,
                isSelf: m.isSelf,
              }))}
              value={scope}
              onChange={setScope}
            />
          </div>
        )}

        {/* Period selector — app shell aligned with Abundance Tracker overview */}
        <div className={shellCard}>
          <div className="border-b border-[#252525] px-4 pb-4 pt-5 md:px-6 md:pb-5 md:pt-6">
            <p className={sectionLabel}>Time period</p>
            <div className="mx-auto w-full max-w-xl" role="group" aria-label="Report period type">
              <div className={segmentTrackFour}>
                {(['month', 'quarter', 'year', 'custom'] as const).map((p, index, arr) => {
                  const selected = period === p
                  const short = p === 'month' ? 'Mo' : p === 'quarter' ? 'Qtr' : p === 'year' ? 'Yr' : 'Custom'
                  const long = p.charAt(0).toUpperCase() + p.slice(1)
                  const endCaps =
                    index === 0 ? 'rounded-l-lg' : index === arr.length - 1 ? 'rounded-r-lg' : ''
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriodAndKey(p)}
                      aria-pressed={selected}
                      className={`min-h-[2.75rem] overflow-hidden px-1 py-2 text-center text-[11px] font-medium leading-tight transition-colors sm:min-h-11 sm:px-2 sm:text-sm ${endCaps} ${
                        selected
                          ? 'bg-zinc-900/85 font-semibold text-primary-400'
                          : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                      }`}
                    >
                      <span className="hidden sm:inline">{long}</span>
                      <span className="sm:hidden">{short}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {period !== 'custom' && (
            <div className="border-b border-[#252525] px-4 py-5 md:px-6 md:py-6">
              <div className="mx-auto w-full max-w-md space-y-2">
                <p className="text-center text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500">
                  {period === 'month' ? 'Choose month' : period === 'quarter' ? 'Choose quarter' : 'Choose year'}
                </p>
                {period === 'month' &&
                  (() => {
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
                        className={periodSelectClassName}
                      />
                    )
                  })()}
                {period === 'quarter' &&
                  (() => {
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
                        className={periodSelectClassName}
                      />
                    )
                  })()}
                {period === 'year' && (
                  <Select
                    value={periodKey}
                    onChange={(value) => setPeriodKey(value)}
                    placeholder="Select year..."
                    options={Array.from({ length: 5 }, (_, i) => {
                      const y = now.getFullYear() + i
                      return { value: String(y), label: String(y) }
                    })}
                    className={periodSelectClassName}
                  />
                )}
              </div>
            </div>
          )}

          {period === 'custom' && (
            <div className="border-b border-[#252525] px-4 py-5 md:px-6 md:py-6">
              <div className="mx-auto w-full max-w-2xl space-y-5">
                <p className="text-center text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500">
                  Custom date range
                </p>
                <div className="space-y-3">
                  <div className="hidden gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr]">
                    <p className="text-center text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                      Start date
                    </p>
                    <span aria-hidden className="block" />
                    <p className="text-center text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                      End date
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3">
                    <div className="min-w-0 space-y-2 sm:space-y-0">
                      <p className="text-center text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500 sm:hidden">
                        Start date
                      </p>
                      <DatePicker
                        value={customStart}
                        onChange={(dateString) => setCustomStart(dateString)}
                        className={customRangeDateClassName}
                      />
                    </div>
                    <span className="flex justify-center text-xs font-medium uppercase tracking-wider text-neutral-500">
                      to
                    </span>
                    <div className="min-w-0 space-y-2 sm:space-y-0">
                      <p className="text-center text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500 sm:hidden">
                        End date
                      </p>
                      <DatePicker
                        value={customEnd}
                        onChange={(dateString) => setCustomEnd(dateString)}
                        minDate={customStart || undefined}
                        className={customRangeDateClassName}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-center pt-1">
                  <Button variant="primary" size="sm" onClick={runCustomReport}>
                    Generate report
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#39FF14] border-t-transparent" />
            <p className="mt-4 text-neutral-400">Loading report...</p>
          </div>
        ) : !data ? (
          period === 'custom' && (!customStart || !customEnd) ? (
            <div className={`${shellCard} px-4 py-10 text-center md:px-6 md:py-12`}>
              <p className="text-neutral-400">Select a date range and click Generate report.</p>
            </div>
          ) : (
            <div className={`${shellCard} px-4 py-10 text-center md:px-6 md:py-12`}>
              <p className="text-neutral-400">No data for this period. Log abundance moments to see reports.</p>
              <Button asChild variant="primary" size="sm" className="mt-4">
                <Link href="/abundance-tracker">Go to Abundance Tracker</Link>
              </Button>
            </div>
          )
        ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-6">
            {/* Money vs Value pie */}
            <div className={`${shellCard} flex min-h-0 flex-col`}>
              <div className={`${chartHeaderBar} justify-start`}>
                <p className="text-left text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500">
                  Money vs value
                </p>
              </div>
              <div className="flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6 md:py-5">
              {moneyValuePieData.length > 0 ? (
                <div className="flex w-full flex-col">
                  <div className="h-[260px] w-full min-w-0 sm:h-[280px] lg:h-[270px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie
                          data={moneyValuePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius="34%"
                          outerRadius="52%"
                          paddingAngle={0}
                          dataKey="value"
                          nameKey="name"
                          label={false}
                          stroke="none"
                        >
                          {moneyValuePieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ChartLegend payload={pieLegendPayload(moneyValuePieData)} formatCurrency={formatCurrency} />
                </div>
              ) : (
                <p className="text-neutral-400 py-6 text-center">No money or value in this period.</p>
              )}
              </div>
            </div>

            {/* By category pie */}
            <div className={`${shellCard} flex min-h-0 flex-col`}>
              <div className={`${chartHeaderBar} justify-between gap-3`}>
                <p className="min-w-0 flex-1 text-left text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500 leading-none">
                  By category
                </p>
                <div
                  className="inline-flex shrink-0 gap-0 overflow-hidden rounded-lg bg-zinc-950/90 p-0.5 ring-1 ring-inset ring-white/[0.08]"
                  role="group"
                  aria-label="Category breakdown type"
                >
                  <button
                    type="button"
                    onClick={() => setCategoryView('entry')}
                    aria-pressed={categoryView === 'entry'}
                    className={`flex h-7 min-w-[3.25rem] items-center justify-center rounded-md px-2 text-[11px] font-medium leading-none transition-colors ${
                      categoryView === 'entry'
                        ? 'bg-[#39FF14] font-semibold text-black'
                        : 'text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200'
                    }`}
                  >
                    Kind
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryView('vision')}
                    aria-pressed={categoryView === 'vision'}
                    className={`flex h-7 min-w-[3.25rem] items-center justify-center rounded-md px-2 text-[11px] font-medium leading-none transition-colors ${
                      categoryView === 'vision'
                        ? 'bg-[#39FF14] font-semibold text-black'
                        : 'text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200'
                    }`}
                  >
                    Vision
                  </button>
                </div>
              </div>
              <div className="flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6 md:py-5">
              {categoryPieData.length > 0 ? (
                <div className="flex w-full flex-col">
                  <div className="h-[280px] w-full min-w-0 sm:h-[300px] lg:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie
                          data={categoryPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius="32%"
                          outerRadius="50%"
                          paddingAngle={0}
                          dataKey="value"
                          nameKey="name"
                          label={false}
                          stroke="none"
                        >
                          {categoryPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ChartLegend payload={pieLegendPayload(categoryPieData)} formatCurrency={formatCurrency} />
                </div>
              ) : (
                <p className="text-neutral-400 py-6 text-center">No category data in this period.</p>
              )}
              </div>
            </div>
            </div>
        )}
      </Stack>
    </Container>
  )
}
