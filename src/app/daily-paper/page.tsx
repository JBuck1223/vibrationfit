'use client'

import React, { useMemo, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Container,
  Card,
  Button,
  Stack,
  Inline,
  Badge,
  Text,
  PageHero,
  EmptyState,
  CategoryCard,
} from '@/lib/design-system/components'
import { useAreaStats } from '@/hooks/useAreaStats'
import { OptimizedImage } from '@/components/OptimizedImage'
import { FileText, Sparkles, Plus, Filter, Grid, List, HelpCircle, Eye, Flame, Shield, ChevronDown, ImageIcon, Paperclip } from 'lucide-react'
import { DailyPaperEntry, useDailyPaperEntries } from '@/hooks/useDailyPaper'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

const PREVIEW_LENGTH = 200

function truncate(text: string, length = PREVIEW_LENGTH) {
  if (!text) return ''
  if (text.length <= length) return text
  return `${text.slice(0, length - 1)}…`
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function looksLikeImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  if (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(url)) return true
  if (url.includes('media.vibrationfit.com') && (url.includes('/generated/') || url.includes('/journal/'))) return true
  return false
}

function isImageEntry(entry: DailyPaperEntry): boolean {
  if (!entry.attachment_url) return false
  return entry.attachment_content_type?.startsWith('image/') === true || looksLikeImageUrl(entry.attachment_url)
}

function getAttachmentSection(entry: DailyPaperEntry): 'evidence' | 'optional' | null {
  if (!entry.attachment_url) return null
  return (entry.metadata as { attachmentSection?: string } | null)?.attachmentSection as 'evidence' | 'optional' | null ?? null
}

function calculateCurrentStreak(entries: DailyPaperEntry[]) {
  if (entries.length === 0) return 0

  const recordedDays = new Set(entries.map((entry) => entry.entry_date))
  const cursor = new Date()

  let streak = 0
  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if (!recordedDays.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function countEntriesInLastDays(entries: DailyPaperEntry[], days: number) {
  if (entries.length === 0) return 0

  const today = new Date()
  const threshold = new Date()
  threshold.setDate(today.getDate() - (days - 1))

  return entries.filter((entry) => {
    const entryDate = new Date(`${entry.entry_date}T00:00:00`)
    return entryDate >= threshold && entryDate <= today
  }).length
}

type DateFilter = 'all' | '7' | '30'

export default function DailyPaperIndexPage() {
  const router = useRouter()
  const { stats: practiceStats } = useAreaStats('daily-paper')
  const { entries, isLoading, isRefreshing, error, refresh } = useDailyPaperEntries()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])
  const [statsExpanded, setStatsExpanded] = useState(false)
  const [freezeOpen, setFreezeOpen] = useState(false)
  const freezeRef = useRef<HTMLDivElement>(null)

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

  const metrics = useMemo(() => {
    const total = entries.length
    const thisWeek = countEntriesInLastDays(entries, 7)
    const streak = calculateCurrentStreak(entries)
    const mostRecent = entries[0] ?? null
    return { total, thisWeek, streak, mostRecent }
  }, [entries])

  const handleRefresh = () => {
    void refresh()
  }

  const filteredEntries = useMemo(() => {
    if (dateFilter === 'all') return entries
    const days = dateFilter === '7' ? 7 : 30
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - days)
    return entries.filter((entry) => {
      const d = new Date(`${entry.entry_date}T00:00:00`)
      return d >= threshold
    })
  }, [entries, dateFilter])

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Daily Paper"
          subtitle="Capture gratitude, align three actions, and mark a fun moment. Your archive keeps the story tight and easy to review."
        >
          {metrics.mostRecent && (
            <p className="text-xs md:text-sm text-neutral-500 text-center">
              Last entry · {formatDateLabel(metrics.mostRecent.entry_date)}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            <Button
              asChild
              variant="primary"
              size="sm"
              className="flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
            >
              <Link href="/daily-paper/new">
                <Plus className="w-4 h-4 shrink-0" />
                <span>New Entry</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
            >
              <Link href="/daily-paper/resources" className="flex items-center justify-center gap-1 md:gap-2">
                <HelpCircle className="w-4 h-4 shrink-0" />
                Resources
              </Link>
            </Button>
          </div>
        </PageHero>

        {/* Daily Paper Stats */}
        <div className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#FFFF00]/[0.04] via-[#111] to-[#111]">
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,0,0.08)_0%,_transparent_50%)] pointer-events-none" />
          <div className="relative p-5 md:p-6">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <FileText className="w-4 h-4 text-[#FFFF00]" />
              <h3 className="text-neutral-300 font-medium text-sm tracking-wide uppercase">Daily Paper</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Current Streak */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3">
                <p className="text-neutral-500 text-[11px] leading-tight mb-1.5">Current Streak</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-semibold text-lg leading-none flex items-center gap-1.5">
                    {(practiceStats?.currentStreak ?? 0) >= 1 && <Flame className="w-4 h-4 text-orange-400" />}
                    {practiceStats?.currentStreak ?? 0}
                    <span className="font-normal text-neutral-500">{(practiceStats?.currentStreak ?? 0) === 1 ? 'day' : 'days'}</span>
                  </p>
                  {(practiceStats?.streakFreezeAvailable || practiceStats?.streakFreezeUsedThisWeek) && (
                    <div className="relative ml-auto flex items-center" ref={freezeRef}>
                      <button type="button" className="flex items-center" onClick={() => setFreezeOpen(prev => !prev)}>
                        <Shield className={`w-3.5 h-3.5 cursor-help ${practiceStats?.streakFreezeUsedThisWeek ? 'text-blue-500/40' : 'text-blue-400'}`} />
                      </button>
                      <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 rounded-xl bg-neutral-900 border border-blue-500/20 p-3 shadow-xl transition-all duration-200 z-[100] ${freezeOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                        <p className="text-sm font-semibold text-blue-400 mb-1">
                          Streak Freeze <span className="font-normal text-blue-400/70">({practiceStats?.streakFreezeUsedThisWeek ? 'Used this week' : 'Available'})</span>
                        </p>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          {practiceStats?.streakFreezeUsedThisWeek
                            ? 'Your streak was saved this week. You get 1 free grace day per week for each habit.'
                            : 'You get 1 free grace day per week. If you miss a day, your streak stays alive so one off-day doesn\'t wipe out your progress.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reps this Week - always visible */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3">
                <p className="text-neutral-500 text-[11px] leading-tight mb-1.5">Reps this Week</p>
                <p className="text-white font-semibold text-lg leading-none">{practiceStats?.countLast7 ?? 0}<span className="font-normal text-neutral-500">/7</span></p>
              </div>

              {/* Remaining stats: always visible on sm+, toggled on mobile */}
              {[
                {
                  label: 'Reps this Month',
                  value: <>{practiceStats?.countLast30 ?? 0}<span className="font-normal text-neutral-500">/30</span></>,
                },
                {
                  label: 'Total Rep Days',
                  value: (practiceStats?.countAllTime ?? 0).toLocaleString(),
                },
                { label: 'Total Papers', value: metrics.total.toLocaleString() },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3 ${statsExpanded ? '' : 'hidden'} sm:block`}>
                  <p className="text-neutral-500 text-[11px] leading-tight mb-1.5">{stat.label}</p>
                  <p className="text-white font-semibold text-lg leading-none">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setStatsExpanded(prev => !prev)}
              className="flex items-center justify-center gap-1.5 w-full mt-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-300 transition-colors sm:hidden"
            >
              {statsExpanded ? 'Show less' : 'View all stats'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${statsExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Action Bar - same layout as journal */}
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-start">
            <button
              onClick={() => router.push('/daily-paper/new')}
              className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-[#39FF14]/30 transition-all duration-200"
              aria-label="Add Entry"
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
          <div className="space-y-6 animate-in slide-in-from-top duration-300">
            <Card variant="elevated" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Date range</h3>
              </div>
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
            </Card>

            <Card variant="elevated" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Categories</h3>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (selectedCategories.includes('all')) {
                      setSelectedCategories([])
                    } else {
                      setSelectedCategories(['all'])
                    }
                  }}
                >
                  {selectedCategories.includes('all') ? 'Deselect All' : 'Select All'}
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
            </Card>
          </div>
        )}

        {error && (
          <Card variant="outlined" className="border-[#D03739]/40 bg-[#D03739]/10">
            <Stack gap="sm">
              <Text size="sm" className="text-[#FFB4B4] font-semibold">
                We couldn&apos;t load your Daily Papers.
              </Text>
              <Inline gap="sm" className="justify-between items-center">
                <p className="text-xs text-[#FFB4B4]/80">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Try again
                </Button>
              </Inline>
            </Stack>
          </Card>
        )}

        {isLoading ? (
          <Card variant="outlined" className="border-[#333] bg-[#111111]">
            <Inline gap="sm" className="items-center text-neutral-300">
              <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
              <span>Loading your archive…</span>
            </Inline>
          </Card>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Daily Papers yet"
            description="Start with gratitude, set three aligned actions, and add one fun promise."
            action={{
              label: "Add Entry",
              href: "/daily-paper/new",
              icon: Plus,
            }}
            secondaryAction={{
              label: "Resources",
              href: "/daily-paper/resources",
              variant: "outline",
              icon: HelpCircle,
            }}
          />
        ) : filteredEntries.length === 0 ? (
          <Card className="text-center py-16 max-w-2xl mx-auto">
            <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No entries match your filter</h3>
            <p className="text-neutral-400 mb-6">Try a different date range.</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setDateFilter('all')
                setSelectedCategories(['all'])
              }}
            >
              Show all
            </Button>
          </Card>
        ) : viewMode === 'grid' ? (
          /* Grid View - same layout as journal */
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
            {filteredEntries.map((entry) => {
              const tasks = [entry.task_one, entry.task_two, entry.task_three].filter(
                (t) => t && t.trim().length > 0,
              )
              const hasAttachment = Boolean(entry.attachment_url)
              const showImage = isImageEntry(entry)
              const section = getAttachmentSection(entry)
              return (
                <Card
                  key={entry.id}
                  id={`entry-${entry.id}`}
                  className="hover:border-primary-500/50 transition-all duration-200 hover:-translate-y-1 scroll-mt-8 cursor-pointer break-inside-avoid mb-4"
                  onClick={() => router.push(`/daily-paper/${entry.id}`)}
                >
                  <div className="space-y-2 md:space-y-3">
                    {/* Date - Right Aligned with Banner (like journal) */}
                    <div className="relative -mt-1">
                      <div className="flex justify-end">
                        <div className="relative inline-block">
                          <div className="absolute inset-y-0 left-0 right-0 bg-primary-500/10 rounded" />
                          <div className="relative text-sm md:text-base text-primary-500/80 font-medium text-right uppercase tracking-wider px-2 py-1">
                            {new Date(`${entry.entry_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Media Preview */}
                    {showImage && (
                      <div className="relative w-full rounded-lg overflow-hidden border border-neutral-700">
                        <OptimizedImage
                          src={entry.attachment_url!}
                          alt="Daily Paper"
                          width={800}
                          height={600}
                          className="w-full h-auto object-contain rounded-lg"
                          quality={75}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}

                    {/* Gratitude - black card */}
                    <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4 md:p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">Gratitude</p>
                      <p className="text-sm text-neutral-400 line-clamp-3 whitespace-pre-line">
                        {truncate(entry.gratitude)}
                      </p>
                    </div>

                    {/* Info bar - Actions list only */}
                    {tasks.length > 0 && (
                      <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4 md:p-5">
                        <div className="flex flex-col gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-2">Actions</p>
                            <ul className="space-y-1.5 text-sm text-neutral-200">
                              {tasks.map((task, index) => (
                                <li key={index} className="flex gap-2">
                                  <span className="text-neutral-500 shrink-0">{index + 1}.</span>
                                  <span className="line-clamp-2">{task}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fun - black card */}
                    {entry.fun_plan && entry.fun_plan.trim() && (
                      <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4 md:p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">Fun:</p>
                        <p className="text-sm text-neutral-400 line-clamp-2 whitespace-pre-line">
                          {truncate(entry.fun_plan, 100)}
                        </p>
                      </div>
                    )}

                    {hasAttachment && (
                      <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/daily-paper/${entry.id}`}
                          className="text-sm text-primary-500 hover:underline inline-flex items-center gap-1.5"
                        >
                          {section === 'evidence' ? (
                            <>
                              <ImageIcon className="w-3.5 h-3.5" />
                              View Image
                            </>
                          ) : (
                            <>
                              <Paperclip className="w-3.5 h-3.5" />
                              View Attachment
                            </>
                          )}
                        </Link>
                      </div>
                    )}

                    {/* View button - like journal */}
                    <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="w-full"
                      >
                        <Link href={`/daily-paper/${entry.id}`}>
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
          /* List View - same structure as journal list */
          <div className="space-y-3 md:space-y-4">
            {filteredEntries.map((entry) => {
              const hasAttachment = Boolean(entry.attachment_url)
              const showImage = isImageEntry(entry)
              const section = getAttachmentSection(entry)
              return (
                <Card
                  key={entry.id}
                  id={`entry-${entry.id}`}
                  className="hover:border-primary-500/50 transition-all duration-200 hover:-translate-y-1 scroll-mt-8 cursor-pointer"
                  onClick={() => router.push(`/daily-paper/${entry.id}`)}
                >
                  <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-stretch">
                    {/* Image column - hidden on mobile */}
                    <div className="hidden md:block relative flex-shrink-0 w-full aspect-square max-w-[180px] md:w-[160px] md:max-w-none md:aspect-square md:h-auto min-h-0 rounded-lg overflow-hidden bg-neutral-800">
                      {showImage ? (
                        <div className="absolute inset-0">
                          <OptimizedImage
                            src={entry.attachment_url!}
                            alt="Daily Paper"
                            width={320}
                            height={320}
                            className="w-full h-full object-cover"
                            sizes="160px"
                          />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FileText className="w-8 h-8 md:w-6 md:h-6 text-neutral-600" />
                        </div>
                      )}
                    </div>

                    {/* Entry details */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Mobile: Date - right-aligned with banner */}
                      <div className="relative -mt-1 md:hidden">
                        <div className="flex justify-end">
                          <div className="relative inline-block">
                            <div className="absolute inset-y-0 left-0 right-0 bg-primary-500/10 rounded" />
                            <div className="relative text-sm text-primary-500/80 font-medium text-right uppercase tracking-wider px-2 py-1">
                              {new Date(entry.entry_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop: Entry date above Gratitude */}
                      <div className="hidden md:block">
                        <div className="flex justify-end">
                          <div className="relative inline-block">
                            <div className="absolute inset-y-0 left-0 right-0 bg-primary-500/10 rounded" />
                            <div className="relative text-sm text-primary-500/80 font-medium text-right uppercase tracking-wider px-2 py-1">
                              {new Date(entry.entry_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Gratitude + excerpt */}
                      <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4 md:p-5 space-y-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Gratitude</p>
                        <p className="text-sm text-neutral-400 line-clamp-3 md:line-clamp-none md:text-neutral-300 whitespace-pre-line">
                          {truncate(entry.gratitude)}
                        </p>
                      </div>
                      {hasAttachment && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/daily-paper/${entry.id}`}
                            className="text-sm text-primary-500 hover:underline inline-flex items-center gap-1.5"
                          >
                            {section === 'evidence' ? (
                              <>
                                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                                View Image
                              </>
                            ) : (
                              <>
                                <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                View Attachment
                              </>
                            )}
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* View Entry - right side */}
                    <div className="flex-shrink-0 w-full md:w-auto flex items-center" onClick={(e) => e.stopPropagation()}>
                      <Button asChild variant="ghost" size="sm" className="w-full md:w-auto">
                        <Link href={`/daily-paper/${entry.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Entry
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Stack>
    </Container>
  )
}

