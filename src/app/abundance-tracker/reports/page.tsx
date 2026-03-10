'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Target } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { Container, Card, Stack, PageHero, Button, Text, Select, DatePicker } from '@/lib/design-system/components'
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
  }, [period, periodKey, customStart, customEnd])

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
      <Stack gap="lg">
        <PageHero
          title="Reports"
          subtitle="View abundance by period: money vs value and by category."
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
              <Link href="/abundance-tracker/goals">
                <Target className="w-4 h-4 shrink-0" />
                <span>Goals</span>
              </Link>
            </Button>
          </div>
        </PageHero>

        {/* Period selector */}
        <Card variant="outlined" className="p-4 md:p-6 bg-[#101010] border-[#1F1F1F]">
          <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333] mb-3">
            Time period
          </Text>
          <div className="flex flex-wrap gap-2 mb-3">
            {(['month', 'quarter', 'year', 'custom'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodAndKey(p)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-[#39FF14] text-black'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-700'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {period !== 'custom' && (
            <div className="flex flex-wrap items-center gap-3 pt-5">
              {period === 'month' && (() => {
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
                    className="min-w-[200px]"
                  />
                )
              })()}
              {period === 'quarter' && (() => {
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
                    className="min-w-[180px]"
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
                  className="min-w-[140px]"
                />
              )}
            </div>
          )}

          {period === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 pt-5">
              <DatePicker
                value={customStart}
                onChange={(dateString) => setCustomStart(dateString)}
                className="w-full min-w-0 max-w-full sm:min-w-[160px] sm:max-w-[200px]"
              />
              <span className="text-neutral-500">to</span>
              <DatePicker
                value={customEnd}
                onChange={(dateString) => setCustomEnd(dateString)}
                minDate={customStart || undefined}
                className="w-full min-w-0 max-w-full sm:min-w-[160px] sm:max-w-[200px]"
              />
              <Button variant="primary" size="sm" onClick={runCustomReport}>
                Generate report
              </Button>
            </div>
          )}
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-10 h-10 border-4 border-[#39FF14] border-t-transparent rounded-full mx-auto" />
            <p className="text-neutral-400 mt-4">Loading report...</p>
          </div>
        ) : !data ? (
          period === 'custom' && (!customStart || !customEnd) ? (
            <Card variant="outlined" className="p-8 text-center bg-[#101010] border-[#1F1F1F]">
              <p className="text-neutral-400">Select a date range and click Generate report.</p>
            </Card>
          ) : (
            <Card variant="outlined" className="p-8 text-center bg-[#101010] border-[#1F1F1F]">
              <p className="text-neutral-400">No data for this period. Log abundance moments to see reports.</p>
              <Button asChild variant="primary" size="sm" className="mt-4">
                <Link href="/abundance-tracker">Go to Abundance Tracker</Link>
              </Button>
            </Card>
          )
        ) : (
          <>
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-4 decoration-[#333]">
              Period: {data.period}
            </p>

            {/* Money vs Value pie */}
            <Card variant="outlined" className="p-6 bg-[#101010] border-[#1F1F1F]">
              <h3 className="text-sm uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-4 decoration-[#333] mb-4">Money vs Value</h3>
              {moneyValuePieData.length > 0 ? (
                <div className="h-[280px] w-full min-w-0 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Pie
                        data={moneyValuePieData}
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
                        {moneyValuePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend
                        layout="vertical"
                        verticalAlign="bottom"
                        align="center"
                        content={(props) => <ChartLegend {...props} formatCurrency={formatCurrency} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-neutral-400 py-6 text-center">No money or value in this period.</p>
              )}
            </Card>

            {/* By category pie */}
            <Card variant="outlined" className="p-6 bg-[#101010] border-[#1F1F1F]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-4 decoration-[#333]">By category</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryView('entry')}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      categoryView === 'entry' ? 'bg-[#39FF14] text-black' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    Kind
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryView('vision')}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      categoryView === 'vision' ? 'bg-[#39FF14] text-black' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    Vision
                  </button>
                </div>
              </div>
              {categoryPieData.length > 0 ? (
                <div className="h-[320px] w-full min-w-0 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Pie
                        data={categoryPieData}
                        cx="50%"
                        cy="40%"
                        innerRadius={50}
                        outerRadius={75}
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
                      <Legend
                        layout="vertical"
                        verticalAlign="bottom"
                        align="center"
                        content={(props) => <ChartLegend {...props} formatCurrency={formatCurrency} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-neutral-400 py-6 text-center">No category data in this period.</p>
              )}
            </Card>
          </>
        )}
      </Stack>
    </Container>
  )
}
