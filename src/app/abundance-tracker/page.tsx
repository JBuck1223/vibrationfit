'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  TrendingUp,
  Banknote,
  Heart,
  CalendarDays,
  CalendarRange,
  CalendarClock,
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
  ChevronDown,
  Eye,
  Target,
  BarChart3,
} from 'lucide-react'
import {
  Container,
  Card,
  Stack,
  PageHero,
  Button,
  PracticeCard,
} from '@/lib/design-system/components'
import { useAreaStats } from '@/hooks/useAreaStats'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { ENTRY_LABELS, ABUNDANCE_ENTRY_CATEGORIES, getEntryCategoryDisplay } from '@/lib/abundance/entry-categories'

interface AbundanceEvent {
  id: string
  date: string
  value_type: 'money' | 'value'
  amount: number | null
  vision_category: string | null
  entry_category: string | null
  note: string
  image_url: string | null
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

export default function AbundanceDashboardPage() {
  const router = useRouter()
  const { stats: practiceStats } = useAreaStats('abundance-tracker')
  const [data, setData] = useState<AbundanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])
  const [valueTypeFilter, setValueTypeFilter] = useState<'all' | 'money' | 'value'>('all')
  const [selectedEntryCategories, setSelectedEntryCategories] = useState<string[]>(['all'])
  const [showKindDropdown, setShowKindDropdown] = useState(false)
  const [showVisionDropdown, setShowVisionDropdown] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const kindDropdownRef = useRef<HTMLDivElement>(null)
  const visionDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (kindDropdownRef.current && !kindDropdownRef.current.contains(target)) {
        setShowKindDropdown(false)
      }
      if (visionDropdownRef.current && !visionDropdownRef.current.contains(target)) {
        setShowVisionDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      const now = new Date()
      const todayStr = now.toISOString().slice(0, 10)
      let startStr: string
      if (dateFilter === 'week') {
        const dayOfWeek = now.getDay()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - dayOfWeek)
        startStr = startOfWeek.toISOString().slice(0, 10)
      } else if (dateFilter === 'month') {
        startStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      } else {
        startStr = `${now.getFullYear()}-01-01`
      }
      result = result.filter((event) => event.date >= startStr && event.date <= todayStr)
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
          subtitle="Your abundance at a glance. Acknowledge what's flowing to you."
        >
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              asChild
              variant="primary"
              size="sm"
              className="flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
            >
              <Link href="/abundance-tracker/new">
                <Plus className="w-4 h-4 shrink-0" />
                <span>Abundance Entry</span>
              </Link>
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

            {/* Practice Stats */}
            <PracticeCard
              title="Abundance Tracker"
              icon={DollarSign}
              theme="green"
              todayCompleted={practiceStats?.todayCompleted ?? false}
              currentStreak={practiceStats?.currentStreak ?? 0}
              countLast7={practiceStats?.countLast7 ?? 0}
              countLast30={practiceStats?.countLast30 ?? 0}
              countAllTime={practiceStats?.countAllTime ?? 0}
              streakFreezeAvailable={practiceStats?.streakFreezeAvailable ?? false}
              streakFreezeUsedThisWeek={practiceStats?.streakFreezeUsedThisWeek ?? false}
              ctaHref="/abundance-tracker/new"
              ctaLabel="Log Abundance"
              ctaDoneLabel="Log another"
              ctaHelperText="What you notice, you attract more of."
              ctaDoneHelperText="Done for today. Keep noticing the abundance around you."
            />

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
              <div className="rounded-2xl border-2 border-[#39FF14]/50 bg-[#161616] p-3 md:p-4 w-full animate-in slide-in-from-top duration-300">
                    <div className="flex flex-wrap items-end gap-6 md:gap-8">
                      <div className="space-y-1.5">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider">Timeframe</p>
                        <div className="flex flex-wrap gap-2">
                          {(['all', 'week', 'month', 'year'] as const).map((key) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setDateFilter(key)}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                dateFilter === key
                                  ? 'bg-[#39FF14] text-black'
                                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-700'
                              }`}
                            >
                              {key === 'all' ? 'All time' : key === 'week' ? 'This week' : key === 'month' ? 'This month' : 'This year'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider">Abundance</p>
                        <div className="flex flex-wrap gap-2">
                          {(['all', 'money', 'value'] as const).map((key) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setValueTypeFilter(key)}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                valueTypeFilter === key
                                  ? 'bg-[#39FF14] text-black'
                                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-700'
                              }`}
                            >
                              {key === 'all' ? 'Both' : key === 'money' ? 'Money' : 'Value'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider">Kind</p>
                        <div ref={kindDropdownRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setShowKindDropdown(!showKindDropdown)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-neutral-800 rounded-full hover:bg-neutral-700 transition-colors border border-neutral-700"
                        >
                            {selectedEntryCategories.includes('all') || selectedEntryCategories.length === 0
                            ? 'All'
                            : selectedEntryCategories.length === 1
                              ? (ENTRY_LABELS[selectedEntryCategories[0]]?.label ?? selectedEntryCategories[0])
                              : `${selectedEntryCategories.length} selected`}
                          <ChevronDown className={`w-4 h-4 transition-transform ${showKindDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showKindDropdown && (
                          <div className="absolute left-0 top-full mt-1 w-56 bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg overflow-hidden z-50 py-1">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700">
                              <span className="text-xs uppercase tracking-wider text-neutral-500">Kind of abundance</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedEntryCategories.includes('all')) {
                                    setSelectedEntryCategories([])
                                  } else {
                                    setSelectedEntryCategories(['all'])
                                  }
                                }}
                                className="text-xs text-neutral-400 hover:text-white"
                              >
                                {selectedEntryCategories.includes('all') ? 'Deselect all' : 'Select all'}
                              </button>
                            </div>
                            {ABUNDANCE_ENTRY_CATEGORIES
                              .map(({ value: key, label }) => {
                                const isSelected = selectedEntryCategories.includes(key) || selectedEntryCategories.includes('all')
                                return (
                                  <button
                                    key={key}
                                    type="button"
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
                                    className={`w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                                      isSelected ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                )
                              })}
                          </div>
                        )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider">Vision Category</p>
                        <div ref={visionDropdownRef} className="relative">
                          <button
                            type="button"
                            onClick={() => setShowVisionDropdown(!showVisionDropdown)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-neutral-800 rounded-full hover:bg-neutral-700 transition-colors border border-neutral-700"
                          >
                            {selectedCategories.includes('all') || selectedCategories.length === 0
                              ? 'All'
                              : selectedCategories.length === 1
                                ? getVisionLabel(selectedCategories[0])
                                : `${selectedCategories.length} selected`}
                            <ChevronDown className={`w-4 h-4 transition-transform ${showVisionDropdown ? 'rotate-180' : ''}`} />
                          </button>
                          {showVisionDropdown && (
                            <div className="absolute left-0 top-full mt-1 w-56 max-h-72 overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg z-50 py-1">
                              <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700 sticky top-0 bg-neutral-900">
                                <span className="text-xs uppercase tracking-wider text-neutral-500">Vision categories</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (selectedCategories.includes('all')) {
                                      setSelectedCategories([])
                                    } else {
                                      setSelectedCategories(['all'])
                                    }
                                  }}
                                  className="text-xs text-neutral-400 hover:text-white"
                                >
                                  {selectedCategories.includes('all') ? 'Deselect all' : 'Select all'}
                                </button>
                              </div>
                              {VISION_CATEGORIES.filter((c) => c.key !== 'forward' && c.key !== 'conclusion').map((category) => {
                                const isSelected = selectedCategories.includes(category.key) || selectedCategories.includes('all')
                                const Icon = category.icon
                                return (
                                  <button
                                    key={category.key}
                                    type="button"
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
                                    className={`w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                                      isSelected ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                                    }`}
                                  >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    {category.label}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
            )}

            {/* Recent Events - Grid and List match journal layout */}
            {data.recentEvents.length > 0 && (
              <>
                {filteredRecentEvents.length === 0 ? (
                  <Card className="p-8 text-center">
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
                  </Card>
                ) : viewMode === 'grid' ? (
                  /* Grid View - same masonry layout as journal */
                  <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
                    {filteredRecentEvents.map((event) => {
                      const eventVisionCategories = event.vision_category
                        ? event.vision_category.split(',').map((s) => s.trim()).filter(Boolean)
                        : []
                      return (
                        <Card
                          key={event.id}
                          className="hover:border-primary-500/50 transition-all duration-200 hover:-translate-y-1 scroll-mt-8 cursor-pointer break-inside-avoid mb-4"
                          onClick={() => router.push(`/abundance-tracker/${event.id}`)}
                        >
                          <div className="space-y-2 md:space-y-3">
                            {/* Date - right-aligned banner (journal style) */}
                            <div className="relative -mt-1">
                              <div className="flex justify-end">
                                <div className="relative inline-block">
                                  <div className="absolute inset-y-0 left-0 right-0 bg-primary-500/10 rounded" />
                                  <div className="relative text-sm md:text-base text-primary-500/80 font-medium text-right uppercase tracking-wider px-2 py-1">
                                    {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Image preview only when present - no placeholder */}
                            {event.image_url && !imageErrors[event.id] && (
                              <div className="relative w-full rounded-lg overflow-hidden border border-neutral-700">
                                <img
                                  src={event.image_url}
                                  alt=""
                                  className="w-full h-auto object-contain rounded-lg"
                                  loading="lazy"
                                  onError={() => setImageErrors((prev) => ({ ...prev, [event.id]: true }))}
                                />
                              </div>
                            )}

                            {/* Amount card - its own card above description */}
                            <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4 md:p-5 space-y-3">
                              {(event.amount != null && Number(event.amount) > 0) && (
                                <p className="text-2xl md:text-3xl font-bold text-[#39FF14] tabular-nums">
                                  {formatCurrency(Number(event.amount))}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-sm px-3 py-1 rounded-full ${
                                  event.value_type === 'money' ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'bg-[#BF00FF]/20 text-[#BF00FF]'
                                }`}>
                                  {event.value_type === 'money' ? 'Money' : 'Value'}
                                </span>
                                {event.entry_category && (
                                  <span className="text-sm bg-primary-500/20 text-primary-500 px-3 py-1 rounded-full">
                                    {getEntryCategoryDisplay(event.entry_category).label}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Description card */}
                            <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4 md:p-5">
                              <p className="text-sm text-neutral-400 line-clamp-3 whitespace-pre-line">
                                {event.note || 'No note'}
                              </p>
                            </div>

                            {/* Vision categories */}
                            {eventVisionCategories.length > 0 && (
                              <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4 md:p-5">
                                <div className="flex flex-row flex-wrap gap-4 md:gap-6 items-center justify-start">
                                  <div className="flex flex-row items-center gap-2 flex-wrap">
                                    <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Categories:</span>
                                    <div className="flex flex-wrap gap-2 items-center">
                                      {eventVisionCategories.map((catKey) => {
                                        const label = getVisionLabel(catKey)
                                        return (
                                          <span
                                            key={catKey}
                                            className="text-sm bg-primary-500/20 text-primary-500 px-3 py-1 rounded-full"
                                          >
                                            {label}
                                          </span>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* View Entry button (journal style) */}
                            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                              <Button asChild variant="ghost" size="sm" className="w-full">
                                <Link href={`/abundance-tracker/${event.id}`}>
                                  <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                                  View Entry
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  /* List View - date, amount, money/value, kind only */
                  <div className="space-y-2">
                    {filteredRecentEvents.map((event) => (
                      <Card
                        key={event.id}
                        className="hover:border-primary-500/50 transition-all duration-200 cursor-pointer"
                        onClick={() => router.push(`/abundance-tracker/${event.id}`)}
                      >
                        <div className="flex flex-wrap items-center gap-3 md:gap-6">
                          <span className="text-sm text-primary-500/90 font-medium uppercase tracking-wider shrink-0">
                            {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className={`text-sm px-3 py-1 rounded-full shrink-0 ${
                            event.value_type === 'money' ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'bg-[#BF00FF]/20 text-[#BF00FF]'
                          }`}>
                            {event.value_type === 'money' ? 'Money' : 'Value'}
                          </span>
                          {event.entry_category && (
                            <span className="text-sm bg-primary-500/20 text-primary-500 px-3 py-1 rounded-full shrink-0">
                              {getEntryCategoryDisplay(event.entry_category).label}
                            </span>
                          )}
                          <span className="text-lg font-bold text-[#39FF14] tabular-nums shrink-0 ml-auto">
                            {(event.amount != null && Number(event.amount) > 0) ? formatCurrency(Number(event.amount)) : '—'}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Stack>
    </Container>
  )
}
