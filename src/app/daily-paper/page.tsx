'use client'

import React, { useMemo, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
  CategoryGrid,
  DeleteConfirmationDialog,
  ImageLightbox,
} from '@/lib/design-system/components'
import { useAreaStats } from '@/hooks/useAreaStats'
import { OptimizedImage } from '@/components/OptimizedImage'
import { FileText, Sparkles, Plus, Filter, HelpCircle, Flame, Shield, ChevronDown, ChevronRight, Search, X, Edit, Trash2, Paperclip } from 'lucide-react'
import { DailyPaperEntry, useDailyPaperEntries } from '@/hooks/useDailyPaper'
import { createClient } from '@/lib/supabase/client'
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
  const searchParams = useSearchParams()
  const { stats: practiceStats } = useAreaStats('daily-paper')
  const { entries, isLoading, isRefreshing, error, refresh } = useDailyPaperEntries()
  const [showFilters, setShowFilters] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])
  const [statsExpanded, setStatsExpanded] = useState(false)
  const [freezeOpen, setFreezeOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
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

  useEffect(() => {
    const expandParam = searchParams.get('expand')
    if (expandParam && entries.length > 0) {
      setExpandedId(expandParam)
      router.replace('/daily-paper', { scroll: false })
      setTimeout(() => {
        document.getElementById(`entry-${expandParam}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [searchParams, entries.length, router])

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

  const handleDelete = async (entryId: string) => {
    setDeleting(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { router.push('/auth/login'); return }
      const { error: delError } = await supabase
        .from('daily_papers')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id)
      if (delError) { console.error('Delete failed:', delError); return }
      setExpandedId(null)
      void refresh()
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
      setDeleteConfirmId(null)
    }
  }

  const filteredEntries = useMemo(() => {
    let result = entries

    if (dateFilter !== 'all') {
      const days = dateFilter === '7' ? 7 : 30
      const threshold = new Date()
      threshold.setDate(threshold.getDate() - days)
      result = result.filter((entry) => {
        const d = new Date(`${entry.entry_date}T00:00:00`)
        return d >= threshold
      })
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((entry) =>
        [entry.gratitude, entry.task_one, entry.task_two, entry.task_three, entry.fun_plan]
          .filter(Boolean)
          .some((text) => text.toLowerCase().includes(q))
      )
    }

    return result
  }, [entries, dateFilter, searchQuery])

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

        {/* Action Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-start gap-2">
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
              <button
                onClick={() => {
                  setSearchOpen((prev) => {
                    if (!prev) setTimeout(() => searchInputRef.current?.focus(), 50)
                    else setSearchQuery('')
                    return !prev
                  })
                }}
                className={`p-3 rounded-full transition-all ${
                  searchOpen
                    ? 'bg-[#39FF14] text-black shadow-lg'
                    : 'bg-[#1F1F1F] text-neutral-400 hover:text-white hover:bg-[#2A2A2A]'
                }`}
                aria-label="Search entries"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="relative animate-in slide-in-from-top-2 duration-200">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entries..."
                className="w-full rounded-xl bg-[#1A1A1A] border border-white/[0.08] pl-10 pr-10 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-[#39FF14]/30 focus:ring-1 focus:ring-[#39FF14]/20 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
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
              <CategoryGrid
                categories={VISION_CATEGORIES.filter((category) => category.key !== 'forward' && category.key !== 'conclusion')}
                selectedCategories={selectedCategories.includes('all') ? VISION_CATEGORIES.filter(c => c.key !== 'forward' && c.key !== 'conclusion').map(c => c.key) : selectedCategories}
                onCategoryClick={(key) => {
                  if (selectedCategories.includes(key)) {
                    setSelectedCategories((prev) => prev.filter((cat) => cat !== key))
                  } else {
                    setSelectedCategories((prev) => {
                      const filtered = prev.filter((cat) => cat !== 'all')
                      return [...filtered, key]
                    })
                  }
                }}
                fillWidth
              />
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
        ) : (
          /* List View */
          <div className="rounded-2xl border border-white/[0.06] bg-[#111] overflow-hidden divide-y divide-white/[0.06]">
            {filteredEntries.map((entry) => {
              const showImage = isImageEntry(entry)
              const isExpanded = expandedId === entry.id
              const dateObj = new Date(entry.entry_date + 'T00:00:00')
              const dayNum = dateObj.getDate()
              const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
              const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
              const tasks = [entry.task_one, entry.task_two, entry.task_three].filter(
                (t) => t && t.trim().length > 0,
              )
              const isImageAttachment =
                entry.attachment_content_type?.startsWith('image/') || looksLikeImageUrl(entry.attachment_url)
              const attachmentSection = (entry.metadata as { attachmentSection?: string } | null)?.attachmentSection
              const isEvidence = attachmentSection === 'evidence'

              return (
                <div
                  key={entry.id}
                  id={`entry-${entry.id}`}
                  className="scroll-mt-8 cursor-pointer hover:bg-white/[0.03] transition-colors group"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className="px-4 py-3.5 md:px-5 md:py-4">
                    {!isExpanded ? (
                      /* Collapsed: date + preview text */
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-11 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-neutral-500 leading-none">{weekday}</p>
                          <p className="text-xl font-semibold text-white leading-tight">{dayNum}</p>
                          <p className="text-[10px] uppercase tracking-wider text-neutral-500 leading-none">{monthStr}</p>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-neutral-300 leading-relaxed whitespace-pre-line line-clamp-2 md:line-clamp-1">
                            {truncate(entry.gratitude, 140)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          {showImage && (
                            <div className="w-11 h-11 md:w-12 md:h-12 rounded-lg overflow-hidden bg-neutral-800">
                              <OptimizedImage
                                src={entry.attachment_url!}
                                alt=""
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                                sizes="48px"
                              />
                            </div>
                          )}
                          <ChevronDown className="w-4 h-4 text-neutral-600 flex-shrink-0 group-hover:text-neutral-400 transition-all duration-200" />
                        </div>
                      </div>
                    ) : (
                      /* Expanded: inline date + full content below */
                      <div className="animate-in fade-in duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-medium text-white">
                            {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDeleteConfirmId(entry.id) }}
                              className="text-red-500 hover:text-red-400 transition-colors"
                              aria-label="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); router.push(`/daily-paper/${entry.id}/edit`) }}
                              className="text-neutral-500 hover:text-white transition-colors"
                              aria-label="Edit entry"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <ChevronDown className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-all duration-200 rotate-180 flex-shrink-0" />
                          </div>
                        </div>

                        <div className="space-y-5">
                        <section className="space-y-2">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Gratitude</p>
                          <p className="text-[13px] text-neutral-300 leading-relaxed whitespace-pre-line">
                            {entry.gratitude || '\u2014'}
                          </p>
                        </section>
                        {tasks.length > 0 && (
                          <section className="space-y-2">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Aligned Actions</p>
                            <div className="space-y-1.5">
                              {tasks.map((task, index) => (
                                <div key={index} className="flex gap-2 rounded-xl border border-[#1F1F1F] bg-[#161616] px-3 py-2.5 text-sm">
                                  <span className="text-neutral-500 shrink-0">{index + 1}.</span>
                                  <span className="text-neutral-200 whitespace-pre-line">{task}</span>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {entry.fun_plan && entry.fun_plan.trim() && (
                          <section className="space-y-2">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Fun Promise</p>
                            <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line">
                              {entry.fun_plan}
                            </p>
                          </section>
                        )}

                        {entry.attachment_url && (
                          <section className="space-y-2">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                              {isEvidence ? 'Evidence' : 'Attachment'}
                            </p>
                            {isImageAttachment ? (
                              <div
                                className="w-40 md:w-56 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); setLightboxUrl(entry.attachment_url) }}
                              >
                                <OptimizedImage
                                  src={entry.attachment_url}
                                  alt={isEvidence ? 'Evidence' : 'Attachment'}
                                  width={400}
                                  height={300}
                                  className="w-full h-auto rounded-lg border border-neutral-700 hover:border-primary-500/50 object-cover transition-colors"
                                  quality={80}
                                  sizes="224px"
                                />
                              </div>
                            ) : (
                              <a
                                href={entry.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-[#1F1F1F] bg-[#161616] px-3 py-2.5 text-sm text-primary-500 hover:border-primary-500/30 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Paperclip className="w-4 h-4" />
                                Open {isEvidence ? 'file' : 'attachment'}
                              </a>
                            )}
                          </section>
                        )}

                      </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <DeleteConfirmationDialog
          isOpen={deleteConfirmId !== null}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => { if (deleteConfirmId) void handleDelete(deleteConfirmId) }}
          itemName="this Daily Paper entry"
          itemType="Daily Paper"
          isLoading={deleting}
          loadingText="Deleting..."
        />

        <ImageLightbox
          images={lightboxUrl ? [{ url: lightboxUrl, alt: 'Daily Paper attachment' }] : []}
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

