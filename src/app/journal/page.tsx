'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Button, CategoryCard, PageHero, Container, Stack, Spinner, DeleteConfirmationDialog, ImageLightbox } from '@/lib/design-system'
import { useAreaStats } from '@/hooks/useAreaStats'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import Link from 'next/link'
import { Plus, FileText, ChevronDown, Filter, BookOpen, Flame, Shield, Search, X, Edit, Trash2, ImageOff, Play } from 'lucide-react'
import { useEffect, useState, useRef, useMemo } from 'react'

function JournalImage({ src, alt, className, onClick, loading }: {
  src: string
  alt: string
  className?: string
  onClick?: (e: React.MouseEvent) => void
  loading?: 'lazy' | 'eager'
}) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className={`bg-neutral-800 flex items-center justify-center ${className || ''}`} onClick={onClick}>
        <ImageOff className="w-6 h-6 text-neutral-600" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      loading={loading}
      onError={() => setError(true)}
    />
  )
}

interface JournalEntry {
  id: string
  user_id: string
  date: string
  title: string
  content: string
  categories: string[]
  image_urls: string[]
  thumbnail_urls?: string[]
  audio_recordings: any[]
  created_at: string
  updated_at: string
}

function truncate(text: string, length = 140) {
  if (!text) return ''
  if (text.length <= length) return text
  return `${text.slice(0, length - 1)}…`
}

const isVideo = (url: string) => {
  return /\.(mp4|webm|quicktime)$/i.test(url) || url.includes('video/')
}

const isImageUrl = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
}

export default function JournalPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { stats: practiceStats } = useAreaStats('journal')
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])
  const [totalEntries, setTotalEntries] = useState(0)
  const [statsExpanded, setStatsExpanded] = useState(false)
  const [freezeOpen, setFreezeOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<{ url: string; alt?: string }[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
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
    async function fetchData() {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      if (page === 1) {
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
          .then(({ count }) => setTotalEntries(count ?? 0))
      }

      const limit = 20
      const offset = (page - 1) * limit

      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching entries:', error)
        setLoading(false)
        setLoadingMore(false)
        return
      }

      if (page === 1) {
        setEntries(entries || [])
        setLoading(false)
      } else {
        setEntries(prev => [...prev, ...(entries || [])])
        setLoadingMore(false)
      }

      setHasMore((entries || []).length === limit)
    }

    fetchData()
  }, [router, page])

  useEffect(() => {
    const expandParam = searchParams.get('expand')
    if (expandParam && entries.length > 0) {
      setExpandedId(expandParam)
      router.replace('/journal', { scroll: false })
      setTimeout(() => {
        document.getElementById(`entry-${expandParam}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [searchParams, entries.length, router])

  const handleDelete = async (entryId: string) => {
    if (!user) return
    setDeleting(true)
    const entry = entries.find(e => e.id === entryId)
    try {
      if (entry) {
        const allMediaUrls = [...(entry.image_urls || []), ...(entry.thumbnail_urls || [])]
        if (allMediaUrls.length > 0) {
          try {
            await fetch('/api/journal/delete-media', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ urls: allMediaUrls })
            })
          } catch (mediaError) {
            console.error('Failed to delete media files:', mediaError)
          }
        }
      }

      const supabase = createClient()
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Delete failed:', error)
        return
      }

      setEntries(prev => prev.filter(e => e.id !== entryId))
      setExpandedId(null)
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
      setDeleteConfirmId(null)
    }
  }

  const getEntryDate = (entry: JournalEntry) => {
    if (entry.date) return entry.date
    return entry.created_at.slice(0, 10)
  }

  const filteredEntries = useMemo(() => {
    let result = entries

    const categoryMatch = selectedCategories.includes('all')
    if (!categoryMatch) {
      result = result.filter(entry =>
        selectedCategories.length > 0 && entry.categories && entry.categories.some((cat: string) => selectedCategories.includes(cat))
      )
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(entry =>
        [entry.title, entry.content].filter(Boolean).some(text => text.toLowerCase().includes(q))
      )
    }

    return result
  }, [entries, selectedCategories, searchQuery])

  const openLightbox = (urls: string[], index: number) => {
    setLightboxImages(urls.map(url => ({ url, alt: 'Journal media' })))
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Conscious Creation Journal"
          subtitle="Capture evidence of actualization in real time"
        >
          <div className="flex justify-center">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
            >
              <Link href="/journal/new">
                <Plus className="w-4 h-4 shrink-0" />
                <span>New Entry</span>
              </Link>
            </Button>
          </div>
        </PageHero>

        {/* Journal Stats */}
        <div className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#FFFF00]/[0.04] via-[#111] to-[#111]">
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,0,0.08)_0%,_transparent_50%)] pointer-events-none" />
          <div className="relative p-5 md:p-6">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <BookOpen className="w-4 h-4 text-[#FFFF00]" />
              <h3 className="text-neutral-300 font-medium text-sm tracking-wide uppercase">Journal</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3">
                <p className="text-neutral-500 text-[11px] leading-tight mb-1.5">Reps this Week</p>
                <p className="text-white font-semibold text-lg leading-none">{practiceStats?.countLast7 ?? 0}<span className="font-normal text-neutral-500">/7</span></p>
              </div>

              {[
                {
                  label: 'Reps this Month',
                  value: <>{practiceStats?.countLast30 ?? 0}<span className="font-normal text-neutral-500">/30</span></>,
                },
                {
                  label: 'Total Rep Days',
                  value: (practiceStats?.countAllTime ?? 0).toLocaleString(),
                },
                { label: 'Total Entries', value: totalEntries.toLocaleString() },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3 ${statsExpanded ? '' : 'hidden'} sm:block`}>
                  <p className="text-neutral-500 text-[11px] leading-tight mb-1.5">{stat.label}</p>
                  <p className="text-white font-semibold text-lg leading-none">{stat.value}</p>
                </div>
              ))}
            </div>

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
                onClick={() => router.push('/journal/new')}
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

        {/* Filters */}
        {showFilters && (
          <div id="filters" className="space-y-6 animate-in slide-in-from-top duration-300">
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
                {VISION_CATEGORIES.filter(category => category.key !== 'forward' && category.key !== 'conclusion').map((category) => {
                  const isSelected = selectedCategories.includes(category.key) || selectedCategories.includes('all')
                  return (
                    <CategoryCard
                      key={category.key}
                      category={category}
                      selected={isSelected}
                      onClick={() => {
                        if (selectedCategories.includes(category.key)) {
                          setSelectedCategories(prev => prev.filter(cat => cat !== category.key))
                        } else {
                          setSelectedCategories(prev => {
                            const filtered = prev.filter(cat => cat !== 'all')
                            return [...filtered, category.key]
                          })
                        }
                      }}
                      variant="outlined"
                      selectionStyle="border"
                      iconColor={isSelected ? "#39FF14" : "#FFFFFF"}
                      selectedIconColor="#39FF14"
                      className={isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' : '!bg-transparent !border-[#333]'}
                    />
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Entries */}
        {filteredEntries && filteredEntries.length > 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-[#111] overflow-hidden divide-y divide-white/[0.06]">
            {filteredEntries.map((entry) => {
              const isExpanded = expandedId === entry.id
              const dateStr = getEntryDate(entry)
              const dateObj = new Date(dateStr + 'T00:00:00')
              const dayNum = dateObj.getDate()
              const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
              const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
              const imageUrls = (entry.image_urls || []).filter(url => isImageUrl(url))
              const videoUrls = (entry.image_urls || []).filter(url => isVideo(url))
              const hasMedia = imageUrls.length > 0 || videoUrls.length > 0
              const firstThumb = imageUrls[0] || null

              return (
                <div
                  key={entry.id}
                  id={`entry-${entry.id}`}
                  className="scroll-mt-8 cursor-pointer hover:bg-white/[0.03] transition-colors group"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className="px-4 py-3.5 md:px-5 md:py-4">
                    {!isExpanded ? (
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-11 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-neutral-500 leading-none">{weekday}</p>
                          <p className="text-xl font-semibold text-white leading-tight">{dayNum}</p>
                          <p className="text-[10px] uppercase tracking-wider text-neutral-500 leading-none">{monthStr}</p>
                        </div>

                        <div className="flex-1 min-w-0">
                          {entry.title && (
                            <p className="text-sm font-medium text-white truncate mb-0.5">{entry.title}</p>
                          )}
                          <p className="text-[13px] text-neutral-300 leading-relaxed whitespace-pre-line line-clamp-2 md:line-clamp-1">
                            {truncate(entry.content, 140)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          {firstThumb && (
                            <div className="w-11 h-11 md:w-12 md:h-12 rounded-lg overflow-hidden bg-neutral-800">
                              <JournalImage
                                src={firstThumb}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <ChevronDown className="w-4 h-4 text-neutral-600 flex-shrink-0 group-hover:text-neutral-400 transition-all duration-200" />
                        </div>
                      </div>
                    ) : (
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
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); router.push(`/journal/${entry.id}/edit`) }}
                              className="text-neutral-500 hover:text-white transition-colors"
                              aria-label="Edit entry"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <ChevronDown className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-all duration-200 rotate-180 flex-shrink-0" />
                          </div>
                        </div>

                        <div className="space-y-5">
                          {entry.title && (
                            <h3 className="text-base md:text-lg font-semibold text-white">{entry.title}</h3>
                          )}

                          <section className="space-y-2">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Entry</p>
                            <p className="text-[13px] text-neutral-300 leading-relaxed whitespace-pre-line">
                              {entry.content || '\u2014'}
                            </p>
                          </section>

                          {entry.categories && entry.categories.length > 0 && (
                            <section className="space-y-2">
                              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Categories</p>
                              <div className="flex flex-wrap gap-2">
                                {entry.categories.map((categoryKey: string) => {
                                  const categoryInfo = VISION_CATEGORIES.find(c => c.key === categoryKey)
                                  return (
                                    <span
                                      key={categoryKey}
                                      className="text-xs bg-primary-500/20 text-primary-500 px-2.5 py-1 rounded-full"
                                    >
                                      {categoryInfo ? categoryInfo.label : categoryKey}
                                    </span>
                                  )
                                })}
                              </div>
                            </section>
                          )}

                          {imageUrls.length > 0 && (
                            <section className="space-y-2">
                              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Images</p>
                              <div className="flex gap-2 overflow-x-auto pb-1">
                                {imageUrls.map((url, idx) => (
                                  <div
                                    key={idx}
                                    className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-neutral-800 cursor-pointer border border-neutral-700 hover:border-primary-500/50 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); openLightbox(imageUrls, idx) }}
                                  >
                                    <JournalImage
                                      src={url}
                                      alt={`Image ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}

                          {videoUrls.length > 0 && (
                            <section className="space-y-2">
                              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Videos</p>
                              <div className="space-y-2">
                                {videoUrls.map((url, idx) => (
                                  <div key={idx} className="rounded-lg overflow-hidden border border-neutral-700 max-w-sm" onClick={(e) => e.stopPropagation()}>
                                    <OptimizedVideo
                                      url={url}
                                      context="list"
                                      lazy={true}
                                      className="w-full [&>div]:rounded-lg [&>div]:border-0 [&_video]:object-contain [&_video]:w-full [&_video]:h-auto"
                                    />
                                  </div>
                                ))}
                              </div>
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
        ) : (
          entries.length === 0 ? (
            <Card className="text-center py-16 max-w-2xl mx-auto">
              <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No journal entries yet</h3>
              <p className="text-neutral-400 mb-6">
                Start capturing evidence of your conscious creation journey.
                Log your wins, insights, and moments of alignment.
              </p>
              <Button asChild>
                <Link href="/journal/new">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Entry
                </Link>
              </Button>
            </Card>
          ) : (
            <Card className="text-center py-16 max-w-2xl mx-auto">
              <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No entries match your filters</h3>
              <p className="text-neutral-400 mb-6">
                Try adjusting your category filters to see more entries.
              </p>
              <Button
                onClick={() => { setSelectedCategories(['all']); setSearchQuery('') }}
                variant="primary"
              >
                Clear Filters
              </Button>
            </Card>
          )
        )}

        {/* Load More */}
        {filteredEntries && filteredEntries.length > 0 && hasMore && (
          <div className="flex justify-center py-6 mt-6">
            <Button
              onClick={() => setPage(page + 1)}
              variant="outline"
              size="sm"
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}

        <DeleteConfirmationDialog
          isOpen={deleteConfirmId !== null}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => { if (deleteConfirmId) void handleDelete(deleteConfirmId) }}
          itemName="this journal entry"
          itemType="Journal Entry"
          isLoading={deleting}
          loadingText="Deleting..."
        />

        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
          showCopyButton={false}
          showCounter={true}
        />
      </Stack>
    </Container>
  )
}
