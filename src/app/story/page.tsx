'use client'

import { useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  FileText,
  Image,
  Target,
  Volume2,
  Mic,
  Clock,
  ChevronRight,
  Filter,
  Search,
  X,
  BookOpen,
  Lightbulb,
} from 'lucide-react'
import {
  Container,
  Stack,
  Card,
  Button,
  Spinner,
  Text,
} from '@/lib/design-system/components'
import { useStoryStudio } from '@/components/story-studio'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

const ENTITY_TYPE_META: Record<string, { label: string; badgeColor: string; icon: React.ElementType }> = {
  life_vision: { label: 'Life Vision', badgeColor: 'text-purple-400 bg-purple-500/20 border-purple-500/30', icon: Target },
  vision_board_item: { label: 'Vision Board', badgeColor: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30', icon: Image },
  journal_entry: { label: 'Journal', badgeColor: 'text-teal-400 bg-teal-500/20 border-teal-500/30', icon: BookOpen },
  custom: { label: 'Custom', badgeColor: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', icon: Lightbulb },
  goal: { label: 'Goal', badgeColor: 'text-green-400 bg-green-500/20 border-green-500/30', icon: BookOpen },
  schedule_block: { label: 'Schedule', badgeColor: 'text-orange-400 bg-orange-500/20 border-orange-500/30', icon: Clock },
}

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Life Vision', value: 'life_vision' },
  { label: 'Vision Board', value: 'vision_board_item' },
  { label: 'Journal', value: 'journal_entry' },
  { label: 'Custom', value: 'custom' },
]

export default function StoryHubPage() {
  const router = useRouter()
  const { stories, loading, activePill, setActivePill } = useStoryStudio()

  const [showFilters, setShowFilters] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    let result = activePill === 'all' ? stories : stories.filter(s => s.entity_type === activePill)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s =>
        [s.title, s.content].filter(Boolean).some(text => text!.toLowerCase().includes(q))
      )
    }

    return result
  }, [stories, activePill, searchQuery])

  if (loading) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl" className="pt-6">
      <Stack gap="lg">
        {/* Action Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-start gap-2">
              <button
                onClick={() => router.push('/story/new')}
                className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-[#39FF14]/30 transition-all duration-200"
                aria-label="New Story"
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
                  setSearchOpen(prev => {
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
                aria-label="Search stories"
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
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search stories..."
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

        {/* Filter Panel */}
        {showFilters && (
          <div className="animate-in slide-in-from-top duration-300">
            <Card variant="elevated" className="p-4">
              <div className="flex items-center justify-center mb-4 gap-3">
                <h3 className="text-lg font-semibold text-white">Source Type</h3>
                {activePill !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActivePill('all')}
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {FILTER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setActivePill(opt.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activePill === opt.value
                        ? 'bg-[#39FF14]/20 text-white border border-[#39FF14]/30'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:text-white hover:border-neutral-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Stories List */}
        {filtered.length === 0 ? (
          <Card className="p-8 md:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-neutral-500" />
            </div>
            <Text className="text-neutral-400 mb-6">
              {searchQuery.trim()
                ? 'No stories match your search.'
                : activePill === 'all'
                  ? 'No stories yet. Create your first immersive narrative.'
                  : `No ${FILTER_OPTIONS.find(o => o.value === activePill)?.label || ''} stories yet.`}
            </Text>
            {searchQuery.trim() ? (
              <Button
                onClick={() => { setSearchQuery(''); setActivePill('all') }}
                variant="primary"
              >
                Clear Search
              </Button>
            ) : (
              <Button asChild variant="primary">
                <Link href="/story/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Story
                </Link>
              </Button>
            )}
          </Card>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-[#111] overflow-hidden divide-y divide-white/[0.06]">
            {filtered.map(story => {
              const meta = ENTITY_TYPE_META[story.entity_type] || ENTITY_TYPE_META.custom
              const hasAiAudio = !!story.audio_set_id
              const hasRecording = !!story.user_audio_url
              const storyCategories: string[] = story.metadata?.selected_categories || []
              const wordCount = story.word_count || 0
              const readTime = Math.max(1, Math.ceil(wordCount / 200))
              const dateObj = new Date(story.created_at)
              const dayNum = dateObj.getDate()
              const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
              const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' })

              return (
                <Link
                  key={story.id}
                  href={`/story/${story.id}`}
                  className="block cursor-pointer hover:bg-white/[0.03] transition-colors group"
                >
                  <div className="px-4 py-3.5 md:px-5 md:py-4">
                    <div className="flex items-center gap-4">
                      {/* Date column */}
                      <div className="flex-shrink-0 w-11 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 leading-none">{weekday}</p>
                        <p className="text-xl font-semibold text-white leading-tight">{dayNum}</p>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 leading-none">{monthStr}</p>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title + inline badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-0.5 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {story.title || 'Untitled Story'}
                          </p>
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ${meta.badgeColor}`}>
                            <meta.icon className="w-3 h-3" />
                            {meta.label}
                          </span>
                          {storyCategories.length > 0 && storyCategories.map(key => {
                            const cat = VISION_CATEGORIES.find(c => c.key === key)
                            if (!cat) return null
                            return (
                              <span key={key} className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border border-neutral-600/50 text-neutral-300 bg-neutral-800/50 font-medium flex-shrink-0">
                                {cat.label}
                              </span>
                            )
                          })}
                          {story.status !== 'completed' && (
                            <span className={`text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                              story.status === 'generating'
                                ? 'text-yellow-400 bg-yellow-500/20'
                                : 'text-neutral-400 bg-neutral-700/50'
                            }`}>
                              {story.status === 'generating' ? 'Generating' : 'Draft'}
                            </span>
                          )}
                        </div>
                        {story.content && (
                          <p className="hidden md:line-clamp-1 text-[13px] text-neutral-300 leading-relaxed mb-1.5">
                            {story.content}
                          </p>
                        )}
                        {/* Stats row */}
                        <div className="flex items-center gap-2.5">
                          {wordCount > 0 && (
                            <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {wordCount.toLocaleString()} words
                            </span>
                          )}
                          <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {readTime} min read
                          </span>
                          {hasAiAudio && (
                            <span className="text-[11px] text-purple-400 flex items-center gap-1">
                              <Volume2 className="w-3 h-3" />
                              Audio
                            </span>
                          )}
                          {hasRecording && (
                            <span className="text-[11px] text-teal-400 flex items-center gap-1">
                              <Mic className="w-3 h-3" />
                              Recording
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Chevron */}
                      <ChevronRight className="w-4 h-4 text-neutral-600 flex-shrink-0 group-hover:text-neutral-400 transition-colors" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Stack>
    </Container>
  )
}
