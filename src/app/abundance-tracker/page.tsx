'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  TrendingUp,
  Banknote,
  Heart,
  CalendarDays,
  CalendarRange,
  Infinity,
  Plus,
  Gift,
  Tag,
  Briefcase,
  Coins,
  Search,
  HandHeart,
  Zap,
} from 'lucide-react'
import {
  Container,
  Card,
  Stack,
  PageHero,
  TrackingMilestoneCard,
} from '@/lib/design-system/components'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

interface AbundanceEvent {
  id: string
  date: string
  value_type: 'money' | 'value'
  amount: number | null
  vision_category: string | null
  entry_category: string | null
  note: string
  created_at: string
}

interface AbundanceData {
  summary: {
    totalAmount: number
    totalCount: number
    moneyCount: number
    valueCount: number
  }
  timePeriods: {
    week: { amount: number; count: number }
    month: { amount: number; count: number }
    allTime: { amount: number; count: number }
  }
  entryBreakdown: Record<string, { count: number; amount: number }>
  visionBreakdown: Record<string, { count: number; amount: number }>
  recentEvents: AbundanceEvent[]
}

const ENTRY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  gift: { label: 'Gift', icon: Gift },
  discount: { label: 'Discount', icon: Tag },
  income: { label: 'Income', icon: Briefcase },
  found_money: { label: 'Found Money', icon: Coins },
  opportunity: { label: 'Opportunity', icon: TrendingUp },
  support: { label: 'Support / Kindness', icon: HandHeart },
  synchronicity: { label: 'Synchronicity', icon: Zap },
  uncategorized: { label: 'Uncategorized', icon: Search },
}

const BAR_COLORS = [
  'bg-[#39FF14]',
  'bg-[#00FFFF]',
  'bg-[#BF00FF]',
  'bg-[#FFFF00]',
  'bg-[#FF6600]',
  'bg-[#FF0080]',
  'bg-[#00FF88]',
  'bg-[#06B6D4]',
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function getVisionLabel(key: string): string {
  const cat = VISION_CATEGORIES.find((c) => c.key === key)
  return cat?.label || key.charAt(0).toUpperCase() + key.slice(1)
}

function getVisionIcon(key: string) {
  const cat = VISION_CATEGORIES.find((c) => c.key === key)
  return cat?.icon || DollarSign
}

function BreakdownBar({
  items,
  getLabel,
  getIcon,
}: {
  items: [string, { count: number; amount: number }][]
  getLabel: (key: string) => string
  getIcon: (key: string) => React.ElementType
}) {
  if (items.length === 0) return null

  const maxCount = Math.max(...items.map(([, v]) => v.count))

  return (
    <div className="space-y-3">
      {items.map(([key, { count, amount }], i) => {
        const Icon = getIcon(key)
        const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
        return (
          <div key={key} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="w-4 h-4 text-neutral-400 shrink-0" />
                <span className="text-sm text-neutral-200 truncate">{getLabel(key)}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                {amount > 0 && (
                  <span className="text-xs text-neutral-500">{formatCurrency(amount)}</span>
                )}
                <span className="text-sm font-semibold text-white tabular-nums">{count}</span>
              </div>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${BAR_COLORS[i % BAR_COLORS.length]}`}
                style={{ width: `${Math.max(pct, 2)}%`, opacity: 0.85 }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AbundanceDashboardPage() {
  const [data, setData] = useState<AbundanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/vibration/abundance')
        if (!res.ok) throw new Error('Failed to load')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Error loading abundance data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const sortedEntries = data
    ? Object.entries(data.entryBreakdown).sort((a, b) => b[1].count - a[1].count)
    : []

  const sortedVision = data
    ? Object.entries(data.visionBreakdown).sort((a, b) => b[1].count - a[1].count)
    : []

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <PageHero
            title="Abundance Tracker"
            subtitle="Your abundance at a glance. Notice what's flowing to you."
          />
          <Link
            href="/abundance-tracker/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#39FF14] hover:bg-[#39FF14]/90 text-black font-semibold text-sm px-6 py-3 transition-all duration-300 hover:-translate-y-0.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Log Abundance Moment
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-12 h-12 border-4 border-[#39FF14] border-t-transparent rounded-full mx-auto" />
            <p className="text-neutral-400 mt-4">Loading your abundance data...</p>
          </div>
        ) : !data || data.summary.totalCount === 0 ? (
          <Card className="p-12 text-center">
            <DollarSign className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              No abundance moments yet
            </h2>
            <p className="text-neutral-400 mb-6 max-w-md mx-auto">
              Start tracking the gifts, synchronicities, and abundance flowing into your life.
              Every moment you notice builds your appreciation muscle.
            </p>
            <Link
              href="/abundance-tracker/new"
              className="inline-flex items-center gap-2 rounded-full bg-[#39FF14] hover:bg-[#39FF14]/90 text-black font-semibold text-sm px-6 py-3 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Log Your First Moment
            </Link>
          </Card>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <TrackingMilestoneCard
                label="Total Abundance"
                mobileLabel="Total"
                value={formatCurrency(data.summary.totalAmount)}
                theme="primary"
                icon={<DollarSign className="w-5 h-5" />}
              />
              <TrackingMilestoneCard
                label="Events Logged"
                mobileLabel="Events"
                value={String(data.summary.totalCount)}
                theme="secondary"
                icon={<TrendingUp className="w-5 h-5" />}
              />
              <TrackingMilestoneCard
                label="Money Events"
                mobileLabel="Money"
                value={String(data.summary.moneyCount)}
                theme="accent"
                icon={<Banknote className="w-5 h-5" />}
              />
              <TrackingMilestoneCard
                label="Value Events"
                mobileLabel="Value"
                value={String(data.summary.valueCount)}
                theme="neutral"
                icon={<Heart className="w-5 h-5" />}
              />
            </div>

            {/* Time Period Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <Card className="p-5 md:p-6 bg-gradient-to-br from-[#39FF14]/5 to-transparent border-[#39FF14]/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#39FF14]/15 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-[#39FF14]" />
                  </div>
                  <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">This Week</h3>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(data.timePeriods.week.amount)}
                </p>
                <p className="text-sm text-neutral-500">
                  {data.timePeriods.week.count} {data.timePeriods.week.count === 1 ? 'event' : 'events'}
                </p>
              </Card>

              <Card className="p-5 md:p-6 bg-gradient-to-br from-[#00FFFF]/5 to-transparent border-[#00FFFF]/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00FFFF]/15 flex items-center justify-center">
                    <CalendarRange className="w-5 h-5 text-[#00FFFF]" />
                  </div>
                  <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">This Month</h3>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(data.timePeriods.month.amount)}
                </p>
                <p className="text-sm text-neutral-500">
                  {data.timePeriods.month.count} {data.timePeriods.month.count === 1 ? 'event' : 'events'}
                </p>
              </Card>

              <Card className="p-5 md:p-6 bg-gradient-to-br from-[#BF00FF]/5 to-transparent border-[#BF00FF]/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#BF00FF]/15 flex items-center justify-center">
                    <Infinity className="w-5 h-5 text-[#BF00FF]" />
                  </div>
                  <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">All Time</h3>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(data.timePeriods.allTime.amount)}
                </p>
                <p className="text-sm text-neutral-500">
                  {data.timePeriods.allTime.count} {data.timePeriods.allTime.count === 1 ? 'event' : 'events'}
                </p>
              </Card>
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {sortedEntries.length > 0 && (
                <Card className="p-5 md:p-6">
                  <h2 className="text-lg font-bold text-white mb-5">By Kind of Abundance</h2>
                  <BreakdownBar
                    items={sortedEntries}
                    getLabel={(key) => ENTRY_LABELS[key]?.label || key}
                    getIcon={(key) => ENTRY_LABELS[key]?.icon || DollarSign}
                  />
                </Card>
              )}

              {sortedVision.length > 0 && (
                <Card className="p-5 md:p-6">
                  <h2 className="text-lg font-bold text-white mb-5">By Vision Category</h2>
                  <BreakdownBar
                    items={sortedVision}
                    getLabel={getVisionLabel}
                    getIcon={getVisionIcon}
                  />
                </Card>
              )}
            </div>

            {/* Recent Events */}
            {data.recentEvents.length > 0 && (
              <Card className="p-5 md:p-6">
                <h2 className="text-lg font-bold text-white mb-5">Recent Abundance Moments</h2>
                <div className="divide-y divide-neutral-800">
                  {data.recentEvents.map((event) => {
                    const VisionIcon = event.vision_category
                      ? getVisionIcon(event.vision_category)
                      : null
                    return (
                      <Link
                        key={event.id}
                        href={`/abundance-tracker/${event.id}`}
                        className="block py-4 first:pt-0 last:pb-0 hover:bg-neutral-800/30 -mx-2 px-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                            {event.value_type === 'money' ? (
                              <DollarSign className="w-4 h-4 text-[#39FF14]" />
                            ) : (
                              <Heart className="w-4 h-4 text-[#BF00FF]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-200 line-clamp-2">{event.note}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="text-xs text-neutral-500">
                                {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                              {event.entry_category && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                                  {ENTRY_LABELS[event.entry_category]?.label || event.entry_category}
                                </span>
                              )}
                              {event.vision_category && VisionIcon && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                                  <VisionIcon className="w-3 h-3" />
                                  {getVisionLabel(event.vision_category)}
                                </span>
                              )}
                            </div>
                          </div>
                          {event.amount != null && Number(event.amount) > 0 && (
                            <span className="text-sm font-semibold text-[#39FF14] tabular-nums shrink-0">
                              {formatCurrency(Number(event.amount))}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </Card>
            )}
          </>
        )}
      </Stack>
    </Container>
  )
}
