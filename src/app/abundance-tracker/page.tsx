'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
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
  Flame,
  Shield,
  Edit,
  Trash2,
} from 'lucide-react'
import {
  Container,
  Card,
  Stack,
  Button,
  Text,
  DeleteConfirmationDialog,
  ImageLightbox,
} from '@/lib/design-system/components'
import { SavedRecordings } from '@/components/SavedRecordings'
import { AbundanceEditModal } from '@/components/abundance-tracker/AbundanceEditModal'
import { createClient } from '@/lib/supabase/client'
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
  updated_at?: string
  audio_recordings?: unknown[]
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
    year: { amount: number; count: number }
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

function getVisionIcon(key: string) {
  const cat = VISION_CATEGORIES.find((c) => c.key === key)
  return cat?.icon || DollarSign
}

function formatEntryDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' as const }),
  })
}

type AbundancePeriodKey = 'all' | 'week' | 'month' | 'year'

const LS_ABUNDANCE_DATE_FILTER = 'vf.abundance-tracker.dateFilter'
const LS_ABUNDANCE_TOTALS_PERIOD = 'vf.abundance-tracker.totalsPeriod'

function parseStoredPeriodKey(raw: string | null): AbundancePeriodKey | null {
  if (raw === 'all' || raw === 'week' || raw === 'month' || raw === 'year') return raw
  return null
}

export default function AbundanceDashboardPage() {
  const router = useRouter()
  const { stats: practiceStats } = useAreaStats('abundance-tracker')
  const [data, setData] = useState<AbundanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [totalsPeriod, setTotalsPeriod] = useState<AbundancePeriodKey>('all')
  const [dateFilter, setDateFilter] = useState<AbundancePeriodKey>('all')
  const skipPersistDateFilterRef = useRef(true)
  const skipPersistTotalsPeriodRef = useRef(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])
  const [valueTypeFilter, setValueTypeFilter] = useState<'all' | 'money' | 'value'>('all')
  const [selectedEntryCategories, setSelectedEntryCategories] = useState<string[]>(['all'])
  const [showKindDropdown, setShowKindDropdown] = useState(false)
  const [showVisionDropdown, setShowVisionDropdown] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [statsExpanded, setStatsExpanded] = useState(false)
  const [freezeOpen, setFreezeOpen] = useState(false)
  const freezeRef = useRef<HTMLDivElement>(null)
  const kindDropdownRef = useRef<HTMLDivElement>(null)
  const visionDropdownRef = useRef<HTMLDivElement>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editEntryId, setEditEntryId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const refetchAbundance = useCallback(async () => {
    try {
      const res = await fetch('/api/vibration/abundance')
      if (!res.ok) return
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const confirmDeleteEntry = async () => {
    if (!deleteConfirmId) return
    setDeleting(true)
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) return
      const { error } = await supabase
        .from('abundance_events')
        .delete()
        .eq('id', deleteConfirmId)
        .eq('user_id', session.user.id)
      if (error) throw error
      await refetchAbundance()
      setExpandedId(null)
      setDeleteConfirmId(null)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (!freezeOpen) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (freezeRef.current && !freezeRef.current.contains(e.target as Node)) {
        setFreezeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [freezeOpen])

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

  useEffect(() => {
    try {
      const df = parseStoredPeriodKey(localStorage.getItem(LS_ABUNDANCE_DATE_FILTER))
      if (df) setDateFilter(df)
      const tp = parseStoredPeriodKey(localStorage.getItem(LS_ABUNDANCE_TOTALS_PERIOD))
      if (tp) setTotalsPeriod(tp)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (skipPersistDateFilterRef.current) {
      skipPersistDateFilterRef.current = false
      return
    }
    try {
      localStorage.setItem(LS_ABUNDANCE_DATE_FILTER, dateFilter)
    } catch {
      /* ignore */
    }
  }, [dateFilter])

  useEffect(() => {
    if (skipPersistTotalsPeriodRef.current) {
      skipPersistTotalsPeriodRef.current = false
      return
    }
    try {
      localStorage.setItem(LS_ABUNDANCE_TOTALS_PERIOD, totalsPeriod)
    } catch {
      /* ignore */
    }
  }, [totalsPeriod])

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

  const headlineTotals = useMemo(() => {
    if (!data) {
      return { amount: 0, count: 0 }
    }
    switch (totalsPeriod) {
      case 'week':
        return {
          amount: data.timePeriods.week.amount,
          count: data.timePeriods.week.count,
        }
      case 'month':
        return {
          amount: data.timePeriods.month.amount,
          count: data.timePeriods.month.count,
        }
      case 'year':
        return {
          amount: data.timePeriods.year.amount,
          count: data.timePeriods.year.count,
        }
      default:
        return {
          amount: data.summary.totalAmount,
          count: data.summary.totalCount,
        }
    }
  }, [data, totalsPeriod])

  return (
    <Container size="xl">
      <Stack gap="lg">
        <h1 className="sr-only">Abundance Tracker</h1>

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
            {/* Total abundance + stats — card (toolbar stays outside like before) */}
            <div className="overflow-hidden rounded-2xl border border-[#282828] bg-[#101010] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
              {/* Period segmented control */}
              <div className="border-b border-[#252525] px-4 pb-4 pt-5 md:px-6 md:pb-5 md:pt-6">
                <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500">
                  Total abundance for
                </p>
                <div
                  className="mx-auto w-full max-w-xl"
                  role="group"
                  aria-label="Total abundance time range"
                >
                  <div className="grid grid-cols-4 gap-0 overflow-hidden rounded-xl bg-zinc-950/90 p-1 ring-1 ring-inset ring-white/[0.08]">
                    {(['all', 'week', 'month', 'year'] as const).map((key, index, arr) => {
                      const label =
                        key === 'all' ? 'All' : key === 'week' ? 'Week' : key === 'month' ? 'Month' : 'Year'
                      const selected = totalsPeriod === key
                      const endCaps =
                        index === 0 ? 'rounded-l-lg' : index === arr.length - 1 ? 'rounded-r-lg' : ''
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setTotalsPeriod(key)}
                          aria-pressed={selected}
                          title={
                            key === 'all'
                              ? 'All time'
                              : key === 'week'
                                ? 'This week'
                                : key === 'month'
                                  ? 'This month'
                                  : 'This year'
                          }
                          className={`min-h-[2.75rem] overflow-hidden px-1 py-2 text-center text-[11px] font-medium leading-tight transition-colors sm:min-h-11 sm:px-2 sm:text-sm ${endCaps} ${
                            selected
                              ? 'bg-zinc-900/85 font-semibold text-primary-400'
                              : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                          }`}
                        >
                          <span className="hidden sm:inline">
                            {key === 'all'
                              ? 'All time'
                              : key === 'week'
                                ? 'This week'
                                : key === 'month'
                                  ? 'This month'
                                  : 'This year'}
                          </span>
                          <span className="sm:hidden">{label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="border-b border-[#252525] px-4 py-6 text-center md:px-6 md:py-8">
                <p className="text-4xl font-bold tabular-nums text-[#39FF14] md:text-5xl">
                  {formatCurrency(headlineTotals.amount)}
                </p>
              </div>

            {/* Practice stats — same pill styling as /journal */}
            <div className="flex flex-wrap items-center justify-center gap-2 bg-[#0c0c0c]/50 px-4 py-3 text-[11px] leading-none md:px-5">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-white font-medium">
                <Flame className={`w-3 h-3 ${(practiceStats?.currentStreak ?? 0) >= 1 ? 'text-orange-400' : 'text-orange-400/40'}`} />
                {practiceStats?.currentStreak ?? 0}
                <span className="text-neutral-500">{(practiceStats?.currentStreak ?? 0) === 1 ? 'day' : 'days'}</span>
                <span className="relative ml-0.5" ref={freezeRef}>
                  <button
                    type="button"
                    onClick={() => setFreezeOpen(prev => !prev)}
                    className="inline-flex items-center"
                    aria-label="Streak freeze info"
                  >
                    <Shield className={`w-3 h-3 ${
                      practiceStats?.streakFreezeUsedThisWeek
                        ? 'text-blue-500/40'
                        : practiceStats?.streakFreezeAvailable
                          ? 'text-blue-400'
                          : 'text-blue-400/40'
                    }`} />
                  </button>
                  <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 w-56 rounded-xl bg-neutral-900 border border-blue-500/20 p-3 shadow-xl transition-all duration-200 z-[400] ${freezeOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                    <p className="text-sm font-semibold text-blue-400 mb-1">
                      Streak Freeze <span className="font-normal text-blue-400/70">({practiceStats?.streakFreezeUsedThisWeek ? 'Used this week' : practiceStats?.streakFreezeAvailable ? 'Available' : 'Not available yet'})</span>
                    </p>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {practiceStats?.streakFreezeUsedThisWeek
                        ? 'Your streak was saved this week. You get 1 free grace day per week for each habit.'
                        : 'You get 1 free grace day per week. If you miss a day, your streak stays alive so one off-day does not wipe out your progress.'}
                    </p>
                  </div>
                </span>
              </span>
              <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-white font-medium">
                {practiceStats?.countLast7 ?? 0}<span className="text-neutral-500 ml-1">/7 week</span>
              </span>
              <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-white font-medium">
                {practiceStats?.countLast30 ?? 0}<span className="text-neutral-500 ml-1">/30 month</span>
              </span>
              {statsExpanded && (
                <>
                  <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-white font-medium">
                    {(practiceStats?.countAllTime ?? 0).toLocaleString()} <span className="text-neutral-500 ml-1">total days</span>
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-white font-medium">
                    {(headlineTotals.count ?? 0).toLocaleString()} <span className="text-neutral-500 ml-1">logged</span>
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-white font-medium tabular-nums">
                    {formatCurrency(headlineTotals.amount)} <span className="text-neutral-500 ml-1 font-normal">amount</span>
                  </span>
                </>
              )}
              <button
                type="button"
                onClick={() => setStatsExpanded(prev => !prev)}
                className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-neutral-400 hover:text-neutral-300 transition-colors"
                aria-expanded={statsExpanded}
              >
                {statsExpanded ? 'Less' : 'More'}
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${statsExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
            </div>

            {/* Action bar — no card shell; view toggles are a segmented control (matches period strip) */}
            <div className="flex items-center justify-between py-3">
              <div className="flex flex-1 justify-start">
                <button
                  type="button"
                  onClick={() => router.push('/abundance-tracker/new')}
                  className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#39FF14]/20 transition-all duration-200 hover:bg-[#39FF14]/30"
                  aria-label="Log abundance moment"
                >
                  <Plus className="h-6 w-6 text-[#39FF14]" />
                </button>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
              <div className="flex flex-1 justify-end">
                <div
                  className="inline-flex gap-0 overflow-hidden rounded-xl bg-zinc-950/90 p-1 ring-1 ring-inset ring-white/[0.08]"
                  role="group"
                  aria-label="Layout"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-pressed={viewMode === 'grid'}
                    className={`flex min-h-10 min-w-[2.75rem] items-center justify-center rounded-lg px-3 py-2 transition-colors duration-200 sm:min-h-11 sm:min-w-11 ${
                      viewMode === 'grid'
                        ? 'bg-[#39FF14] font-semibold text-black shadow-md'
                        : 'text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200'
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-pressed={viewMode === 'list'}
                    className={`flex min-h-10 min-w-[2.75rem] items-center justify-center rounded-lg px-3 py-2 transition-colors duration-200 sm:min-h-11 sm:min-w-11 ${
                      viewMode === 'list'
                        ? 'bg-[#39FF14] font-semibold text-black shadow-md'
                        : 'text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200'
                    }`}
                    aria-label="List view"
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="mt-2 w-full animate-in slide-in-from-top duration-200 rounded-xl border border-[#282828] bg-[#101010]/90 p-3 shadow-[0_4px_24px_rgba(0,0,0,0.22)] md:p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 lg:items-end">
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
                              <span className="text-xs uppercase tracking-wider text-neutral-500">Type</span>
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
                  <div className="columns-1 md:columns-2 lg:columns-3 gap-3">
                    {filteredRecentEvents.map((event) => {
                      const eventVisionCategories = event.vision_category
                        ? event.vision_category.split(',').map((s) => s.trim()).filter(Boolean)
                        : []
                      const isExpanded = expandedId === event.id
                      const amountDisplay =
                        event.amount != null && Number(event.amount) > 0
                          ? formatCurrency(Number(event.amount))
                          : null
                      const { label: entryLabel, icon: EntryIcon } = getEntryCategoryDisplay(event.entry_category)
                      return (
                        <Card
                          key={event.id}
                          id={`abundance-entry-${event.id}`}
                          variant="outlined"
                          className={`mb-3 scroll-mt-8 break-inside-avoid rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-3 md:p-4 transition-colors ${
                            isExpanded
                              ? 'border-[#39FF14]/35 bg-[#101010]'
                              : 'cursor-pointer hover:border-[#39FF14]/35 hover:bg-[#101010]'
                          }`}
                          onClick={() => setExpandedId(isExpanded ? null : event.id)}
                        >
                          {!isExpanded ? (
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <time
                                  className="text-[11px] font-medium text-neutral-500 tabular-nums"
                                  dateTime={event.date}
                                >
                                  {formatEntryDate(event.date)}
                                </time>
                                <div className="flex items-center gap-1">
                                  {amountDisplay && (
                                    <span className="text-base font-semibold tabular-nums text-[#39FF14] leading-none">
                                      {amountDisplay}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                <span
                                  className={`inline-flex max-w-full items-center truncate rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                    event.value_type === 'money'
                                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                      : 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300'
                                  }`}
                                >
                                  {event.value_type === 'money' ? 'Money' : 'Value'}
                                </span>
                                {event.entry_category && (
                                  <span className="inline-flex max-w-full items-center truncate rounded border border-neutral-600 bg-neutral-900/90 px-1.5 py-0.5 text-[10px] font-medium text-neutral-300">
                                    {getEntryCategoryDisplay(event.entry_category).label}
                                  </span>
                                )}
                                {eventVisionCategories.map((catKey) => (
                                  <span
                                    key={catKey}
                                    className="inline-flex max-w-full items-center truncate rounded border border-neutral-700 bg-neutral-900/60 px-1.5 py-0.5 text-[10px] text-neutral-400"
                                  >
                                    {getVisionLabel(catKey)}
                                  </span>
                                ))}
                              </div>
                              {event.note?.trim() && (
                                <p className="mt-2 text-xs leading-snug text-neutral-400 line-clamp-2 whitespace-pre-line">
                                  {event.note}
                                </p>
                              )}
                              {event.image_url && !imageErrors[event.id] && (
                                <div className="mt-2 overflow-hidden rounded-md border border-neutral-800">
                                  <img
                                    src={event.image_url}
                                    alt=""
                                    className="max-h-28 w-full object-cover"
                                    loading="lazy"
                                    onError={() => setImageErrors((prev) => ({ ...prev, [event.id]: true }))}
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            <div onClick={(e) => e.stopPropagation()} className="space-y-3">
                              <div className="flex items-start justify-between gap-2 border-b border-[#252525] pb-2">
                                <time className="text-sm font-medium text-white" dateTime={event.date}>
                                  {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </time>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
                                    aria-label="Delete entry"
                                    onClick={() => setDeleteConfirmId(event.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
                                    aria-label="Edit entry"
                                    onClick={() => setEditEntryId(event.id)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-lg px-2 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                                    onClick={() => setExpandedId(null)}
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                              <section className="space-y-1">
                                <Text size="sm" className="text-neutral-500 uppercase tracking-[0.2em]">
                                  Amount
                                </Text>
                                <p className="text-lg font-semibold tabular-nums text-[#39FF14]">
                                  {amountDisplay ?? '—'}
                                </p>
                              </section>
                              <section className="space-y-1">
                                <Text size="sm" className="text-neutral-500 uppercase tracking-[0.2em]">
                                  Abundance
                                </Text>
                                <p className="inline-flex items-center gap-2 text-base font-semibold text-white">
                                  {event.value_type === 'money' ? (
                                    <DollarSign className="h-5 w-5 text-[#39FF14]" />
                                  ) : (
                                    <Heart className="h-5 w-5 text-[#BF00FF]" />
                                  )}
                                  {event.value_type === 'money' ? 'Money' : 'Value'}
                                </p>
                              </section>
                              <section className="space-y-1">
                                <Text size="sm" className="text-neutral-500 uppercase tracking-[0.2em]">
                                  Kind
                                </Text>
                                <p className="inline-flex items-center gap-2 text-base font-semibold text-white">
                                  {entryLabel ? (
                                    <>
                                      <EntryIcon className="h-5 w-5 text-neutral-400" />
                                      {entryLabel}
                                    </>
                                  ) : (
                                    '—'
                                  )}
                                </p>
                              </section>
                              <section className="space-y-1">
                                <Text size="sm" className="text-neutral-500 uppercase tracking-[0.2em]">
                                  Note
                                </Text>
                                <p className="text-sm leading-relaxed text-neutral-300 whitespace-pre-wrap">
                                  {event.note?.trim() || '—'}
                                </p>
                              </section>
                              {eventVisionCategories.length > 0 && (
                                <section className="space-y-2">
                                  <Text size="sm" className="text-neutral-500 uppercase tracking-[0.2em]">
                                    Categories
                                  </Text>
                                  <div className="flex flex-wrap gap-1.5">
                                    {eventVisionCategories.map((catKey) => {
                                      const VisionIcon = getVisionIcon(catKey)
                                      return (
                                        <span
                                          key={catKey}
                                          className="inline-flex items-center gap-1.5 rounded-full border border-[#1F1F1F] bg-[#161616] px-2 py-1 text-xs text-neutral-300"
                                        >
                                          <VisionIcon className="h-3.5 w-3.5" />
                                          {getVisionLabel(catKey)}
                                        </span>
                                      )
                                    })}
                                  </div>
                                </section>
                              )}
                              {event.image_url && (
                                <section className="space-y-2">
                                  <Text size="sm" className="text-neutral-500 uppercase tracking-[0.2em]">
                                    Image
                                  </Text>
                                  <div className="flex justify-start">
                                    <button
                                      type="button"
                                      className="max-w-[min(100%,20rem)] overflow-hidden rounded-lg border border-[#1F1F1F] transition-colors hover:border-[#39FF14]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/50"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setLightboxUrl(event.image_url)
                                      }}
                                      aria-label="View full image"
                                    >
                                      <img
                                        src={event.image_url}
                                        alt=""
                                        className="block h-auto w-full object-contain"
                                        loading="lazy"
                                      />
                                    </button>
                                  </div>
                                </section>
                              )}
                              {event.audio_recordings && event.audio_recordings.length > 0 && (
                                <section className="space-y-2">
                                  <Text size="sm" className="text-neutral-500 uppercase tracking-[0.2em]">
                                    Recordings
                                  </Text>
                                  <SavedRecordings
                                    recordings={
                                      (event.audio_recordings ?? []) as React.ComponentProps<
                                        typeof SavedRecordings
                                      >['recordings']
                                    }
                                    onDelete={() => {}}
                                  />
                                </section>
                              )}
                            </div>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-[#333] bg-[#0c0c0c]">
                    {filteredRecentEvents.map((event) => {
                      const eventVisionCategories = event.vision_category
                        ? event.vision_category.split(',').map((s) => s.trim()).filter(Boolean)
                        : []
                      const isExpanded = expandedId === event.id
                      const amountDisplay =
                        event.amount != null && Number(event.amount) > 0
                          ? formatCurrency(Number(event.amount))
                          : '—'
                      const { label: entryLabel, icon: EntryIcon } = getEntryCategoryDisplay(event.entry_category)
                      return (
                        <div
                          key={event.id}
                          id={`abundance-entry-${event.id}`}
                          className="border-b border-[#1f1f1f] last:border-b-0"
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 hover:bg-white/[0.03] md:gap-3 md:px-3.5 md:py-2.5 ${
                              isExpanded ? 'bg-white/[0.04]' : ''
                            }`}
                            onClick={() => setExpandedId(isExpanded ? null : event.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setExpandedId(isExpanded ? null : event.id)
                              }
                            }}
                          >
                            {!isExpanded ? (
                              <>
                                <time
                                  className="w-[3.25rem] shrink-0 text-[11px] text-neutral-500 tabular-nums md:w-[4.5rem]"
                                  dateTime={event.date}
                                >
                                  {formatEntryDate(event.date)}
                                </time>
                                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                                  <span
                                    className={`inline-flex shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                      event.value_type === 'money'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                        : 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300'
                                    }`}
                                  >
                                    {event.value_type === 'money' ? 'Money' : 'Value'}
                                  </span>
                                  {event.entry_category && (
                                    <span className="inline-flex max-w-[8rem] items-center truncate rounded border border-neutral-600 bg-neutral-900/90 px-1.5 py-0.5 text-[10px] font-medium text-neutral-300 md:max-w-[12rem]">
                                      {getEntryCategoryDisplay(event.entry_category).label}
                                    </span>
                                  )}
                                  {eventVisionCategories.slice(0, 2).map((catKey) => (
                                    <span
                                      key={catKey}
                                      className="hidden max-w-[5rem] truncate rounded border border-neutral-700 bg-neutral-900/50 px-1.5 py-0.5 text-[10px] text-neutral-500 sm:inline md:max-w-[8rem]"
                                    >
                                      {getVisionLabel(catKey)}
                                    </span>
                                  ))}
                                  {eventVisionCategories.length > 2 && (
                                    <span className="text-[10px] text-neutral-600">
                                      +{eventVisionCategories.length - 2}
                                    </span>
                                  )}
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span className="text-right text-sm font-semibold tabular-nums text-[#39FF14]">
                                    {amountDisplay}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className="text-sm font-medium text-white">
                                  {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10"
                                    aria-label="Delete entry"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setDeleteConfirmId(event.id)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white"
                                    aria-label="Edit entry"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditEntryId(event.id)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          {isExpanded && (
                            <div
                              className="border-t border-[#252525] bg-[#0a0a0a] px-3 pb-3 pt-2 md:px-3.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="space-y-3 text-sm">
                                <div className="flex flex-wrap justify-between gap-2">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Amount</p>
                                    <p className="font-semibold tabular-nums text-[#39FF14]">{amountDisplay}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Type</p>
                                    <p className="inline-flex items-center justify-end gap-1 font-medium text-white">
                                      {event.value_type === 'money' ? (
                                        <DollarSign className="h-4 w-4 text-[#39FF14]" />
                                      ) : (
                                        <Heart className="h-4 w-4 text-[#BF00FF]" />
                                      )}
                                      {event.value_type === 'money' ? 'Money' : 'Value'}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Kind</p>
                                  <p className="inline-flex items-center gap-2 font-medium text-white">
                                    {entryLabel ? (
                                      <>
                                        <EntryIcon className="h-4 w-4 text-neutral-400" />
                                        {entryLabel}
                                      </>
                                    ) : (
                                      '—'
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Note</p>
                                  <p className="leading-relaxed text-neutral-300 whitespace-pre-wrap">
                                    {event.note?.trim() || '—'}
                                  </p>
                                </div>
                                {eventVisionCategories.length > 0 && (
                                  <div>
                                    <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                                      Categories
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {eventVisionCategories.map((catKey) => {
                                        const VisionIcon = getVisionIcon(catKey)
                                        return (
                                          <span
                                            key={catKey}
                                            className="inline-flex items-center gap-1 rounded border border-neutral-700 bg-neutral-900/60 px-2 py-0.5 text-xs text-neutral-300"
                                          >
                                            <VisionIcon className="h-3 w-3" />
                                            {getVisionLabel(catKey)}
                                          </span>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}
                                {event.image_url && (
                                  <div>
                                    <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                                      Image
                                    </p>
                                    <div className="flex justify-start">
                                      <button
                                        type="button"
                                        className="max-w-[min(100%,20rem)] overflow-hidden rounded-lg border border-neutral-800 transition-colors hover:border-[#39FF14]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/50"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setLightboxUrl(event.image_url)
                                        }}
                                        aria-label="View full image"
                                      >
                                        <img
                                          src={event.image_url}
                                          alt=""
                                          className="block h-auto w-full object-contain"
                                          loading="lazy"
                                        />
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {event.audio_recordings && event.audio_recordings.length > 0 && (
                                  <div>
                                    <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                                      Recordings
                                    </p>
                                    <SavedRecordings
                                      recordings={
                                        (event.audio_recordings ?? []) as React.ComponentProps<
                                          typeof SavedRecordings
                                        >['recordings']
                                      }
                                      onDelete={() => {}}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
        <DeleteConfirmationDialog
          isOpen={deleteConfirmId !== null}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => void confirmDeleteEntry()}
          title="Delete abundance moment?"
          message="This cannot be undone."
          isDeleting={deleting}
          loadingText="Deleting..."
        />

        <AbundanceEditModal
          isOpen={editEntryId !== null}
          eventId={editEntryId}
          onClose={() => setEditEntryId(null)}
          onSuccess={() => void refetchAbundance()}
        />

        <ImageLightbox
          images={lightboxUrl ? [{ url: lightboxUrl, alt: 'Abundance moment' }] : []}
          currentIndex={0}
          isOpen={lightboxUrl !== null}
          onClose={() => setLightboxUrl(null)}
          showCopyButton={false}
          showNavigation={false}
          showThumbnails={false}
          showCounter={false}
        />
      </Stack>
    </Container>
  )
}
