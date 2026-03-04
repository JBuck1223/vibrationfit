'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  Filter,
  Grid,
  List,
} from 'lucide-react'
import {
  Container,
  Card,
  Stack,
  PageHero,
  Button,
  TrackingMilestoneCard,
  CategoryCard,
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
  const router = useRouter()
  const [data, setData] = useState<AbundanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [dateFilter, setDateFilter] = useState<'all' | '7' | '30'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])
  const [valueTypeFilter, setValueTypeFilter] = useState<'all' | 'money' | 'value'>('all')
  const [selectedEntryCategories, setSelectedEntryCategories] = useState<string[]>(['all'])

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

  const filteredRecentEvents = useMemo(() => {
    if (!data?.recentEvents) return []
    let result = data.recentEvents

    if (dateFilter !== 'all') {
      const days = dateFilter === '7' ? 7 : 30
      const threshold = new Date()
      threshold.setDate(threshold.getDate() - days)
      result = result.filter((event) => {
        const d = new Date(event.date + 'T00:00:00')
        return d >= threshold
      })
    }

    if (valueTypeFilter !== 'all') {
      result = result.filter((event) => event.value_type === valueTypeFilter)
    }

    if (!selectedEntryCategories.includes('all') && selectedEntryCategories.length > 0) {
      result = result.filter((event) =>
        event.entry_category != null && selectedEntryCategories.includes(event.entry_category)
      )
    }

    if (!selectedCategories.includes('all') && selectedCategories.length > 0) {
      result = result.filter((event) => {
        const eventVision = event.vision_category
          ? event.vision_category.split(',').map((s) => s.trim()).filter(Boolean)
          : []
        return selectedCategories.some((cat) => eventVision.includes(cat))
      })
    }

    return result
  }, [data?.recentEvents, dateFilter, valueTypeFilter, selectedEntryCategories, selectedCategories])

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Abundance Tracker"
          subtitle="Your abundance at a glance. Notice what's flowing to you."
        >
          <div className="flex justify-center">
            <Button
              asChild
              variant="primary"
              size="sm"
              className="flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
            >
              <Link href="/abundance-tracker/new">
                <Plus className="w-4 h-4 shrink-0" />
                <span>Log Abundance Moment</span>
              </Link>
            </Button>
          </div>
        </PageHero>

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
            <Button asChild variant="primary" size="md" className="hover:-translate-y-0.5">
              <Link href="/abundance-tracker/new" className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Log Your First Moment
              </Link>
            </Button>
          </Card>
        ) : (
          <>
            {/* Total Abundance - centered under hero, no card */}
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-[#39FF14] tabular-nums flex items-center justify-center gap-2">
                <span>{formatCurrency(data.summary.totalAmount)}</span>
              </p>
              <p className="text-sm md:text-base text-neutral-400 uppercase tracking-wider mt-2">
                Total Abundance
              </p>
            </div>

            {/* Summary Stats - 3 cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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

            {/* Action Bar - same layout as daily-paper / journal */}
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-start">
                <button
                  onClick={() => router.push('/abundance-tracker/new')}
                  className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-[#39FF14]/30 transition-all duration-200"
                  aria-label="Log abundance moment"
                >
                  <Plus className="w-6 h-6 text-[#39FF14]" />
                </button>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </Button>
              <div className="flex-1 flex justify-end">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-full transition-all ${
                      viewMode === 'grid'
                        ? 'bg-[#39FF14] text-black shadow-lg'
                        : 'bg-[#1F1F1F] text-neutral-400 hover:text-white hover:bg-[#2A2A2A]'
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-full transition-all ${
                      viewMode === 'list'
                        ? 'bg-[#39FF14] text-black shadow-lg'
                        : 'bg-[#1F1F1F] text-neutral-400 hover:text-white hover:bg-[#2A2A2A]'
                    }`}
                    aria-label="List view"
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {showFilters && (
              <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-4 md:p-6 animate-in slide-in-from-top duration-300">
                <Stack gap="lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4 md:p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-3">Date range</p>
                      <div className="flex flex-wrap gap-2">
                        {(['all', '7', '30'] as const).map((key) => (
                          <Button
                            key={key}
                            variant={dateFilter === key ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setDateFilter(key)}
                          >
                            {key === 'all' ? 'All time' : key === '7' ? 'Last 7 days' : 'Last 30 days'}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4 md:p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-3">Money or value</p>
                      <div className="flex flex-wrap gap-2">
                        {(['all', 'money', 'value'] as const).map((key) => (
                          <Button
                            key={key}
                            variant={valueTypeFilter === key ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setValueTypeFilter(key)}
                          >
                            {key === 'all' ? 'Both' : key === 'money' ? 'Money' : 'Value'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4 md:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Kind of abundance</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-neutral-400 hover:text-white"
                        onClick={() => {
                          if (selectedEntryCategories.includes('all')) {
                            setSelectedEntryCategories([])
                          } else {
                            setSelectedEntryCategories(['all'])
                          }
                        }}
                      >
                        {selectedEntryCategories.includes('all') ? 'Deselect all' : 'Select all'}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(ENTRY_LABELS)
                        .filter(([k]) => k !== 'uncategorized')
                        .map(([key, { label }]) => (
                          <Button
                            key={key}
                            variant={selectedEntryCategories.includes(key) || selectedEntryCategories.includes('all') ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => {
                              if (selectedEntryCategories.includes(key)) {
                                setSelectedEntryCategories((prev) => prev.filter((c) => c !== key))
                              } else {
                                setSelectedEntryCategories((prev) => {
                                  const filtered = prev.filter((c) => c !== 'all')
                                  return [...filtered, key]
                                })
                              }
                            }}
                          >
                            {label}
                          </Button>
                        ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4 md:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Vision categories</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-neutral-400 hover:text-white"
                        onClick={() => {
                          if (selectedCategories.includes('all')) {
                            setSelectedCategories([])
                          } else {
                            setSelectedCategories(['all'])
                          }
                        }}
                      >
                        {selectedCategories.includes('all') ? 'Deselect all' : 'Select all'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-12 gap-3">
                      {VISION_CATEGORIES.filter((category) => category.key !== 'forward' && category.key !== 'conclusion').map((category) => {
                        const isSelected = selectedCategories.includes(category.key) || selectedCategories.includes('all')
                        return (
                          <CategoryCard
                            key={category.key}
                            category={category}
                            selected={isSelected}
                            onClick={() => {
                              if (selectedCategories.includes(category.key)) {
                                setSelectedCategories((prev) => prev.filter((cat) => cat !== category.key))
                              } else {
                                setSelectedCategories((prev) => {
                                  const filtered = prev.filter((cat) => cat !== 'all')
                                  return [...filtered, category.key]
                                })
                              }
                            }}
                            variant="outlined"
                            selectionStyle="border"
                            iconColor={isSelected ? '#39FF14' : '#FFFFFF'}
                            selectedIconColor="#39FF14"
                            className={isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' : '!bg-transparent !border-[#333]'}
                          />
                        )
                      })}
                    </div>
                  </div>
                </Stack>
              </Card>
            )}

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
                {filteredRecentEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-neutral-400 mb-4">No moments match your filter.</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setDateFilter('all')
                        setValueTypeFilter('all')
                        setSelectedEntryCategories(['all'])
                        setSelectedCategories(['all'])
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRecentEvents.map((event) => {
                      const eventVisionCategories = event.vision_category
                        ? event.vision_category.split(',').map((s) => s.trim()).filter(Boolean)
                        : []
                      return (
                        <div
                          key={event.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/abundance-tracker/${event.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              router.push(`/abundance-tracker/${event.id}`)
                            }
                          }}
                          className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 cursor-pointer transition-all duration-300 hover:border-[#199D67]"
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
                                {eventVisionCategories.map((catKey) => {
                                  const VisionIcon = getVisionIcon(catKey)
                                  return (
                                    <span
                                      key={catKey}
                                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400"
                                    >
                                      <VisionIcon className="w-3 h-3" />
                                      {getVisionLabel(catKey)}
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                            {event.amount != null && Number(event.amount) > 0 && (
                              <span className="text-sm font-semibold text-[#39FF14] tabular-nums shrink-0">
                                {formatCurrency(Number(event.amount))}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800">
                    {filteredRecentEvents.map((event) => {
                      const eventVisionCategories = event.vision_category
                      ? event.vision_category.split(',').map((s) => s.trim()).filter(Boolean)
                      : []
                    return (
                      <div
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/abundance-tracker/${event.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            router.push(`/abundance-tracker/${event.id}`)
                          }
                        }}
                        className="py-4 first:pt-0 last:pb-0 cursor-pointer transition-colors hover:bg-neutral-900/50 rounded-lg -mx-2 px-2"
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
                              {eventVisionCategories.map((catKey) => {
                                const VisionIcon = getVisionIcon(catKey)
                                return (
                                  <span
                                    key={catKey}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400"
                                  >
                                    <VisionIcon className="w-3 h-3" />
                                    {getVisionLabel(catKey)}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                          {event.amount != null && Number(event.amount) > 0 && (
                            <span className="text-sm font-semibold text-[#39FF14] tabular-nums shrink-0">
                              {formatCurrency(Number(event.amount))}
                            </span>
                          )}
                        </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )}
          </>
        )}
      </Stack>
    </Container>
  )
}
