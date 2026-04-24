'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Library, PenLine, Target, Image, FileText, BookOpen, Clock, ChevronDown, Check, Lightbulb, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar } from '@/lib/design-system/components'
import { useStoryStudio } from './StoryStudioContext'
import type { Story } from '@/lib/stories/types'

const TABS = [
  { label: 'All Stories', path: '/story', icon: Library },
  { label: 'Create', path: '/story/new', icon: PenLine },
]

const SOURCE_FILTERS = [
  { label: 'All Types', value: 'all', icon: Library },
  { label: 'Life Vision', value: 'life_vision', icon: Target },
  { label: 'Vision Board', value: 'vision_board_item', icon: Image },
  { label: 'Journal', value: 'journal_entry', icon: BookOpen },
  { label: 'Custom', value: 'custom', icon: Lightbulb },
]

const ENTITY_ICONS: Record<string, React.ElementType> = {
  life_vision: Target,
  vision_board_item: Image,
  journal_entry: BookOpen,
  custom: Lightbulb,
  goal: BookOpen,
  schedule_block: Clock,
}

function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    function handler(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [active, ref, onClose])
}

function StoryContextBar({ currentStoryId, stories }: { currentStoryId: string; stories: Story[] }) {
  const router = useRouter()

  const [filterOpen, setFilterOpen] = useState(false)
  const [storyOpen, setStoryOpen] = useState(false)
  const [storySearch, setStorySearch] = useState('')
  const filterRef = useRef<HTMLDivElement>(null)
  const storyRef = useRef<HTMLDivElement>(null)

  const currentStory = stories.find(s => s.id === currentStoryId)
  const [activeFilter, setActiveFilter] = useState(currentStory?.entity_type || 'all')

  useEffect(() => {
    if (currentStory) setActiveFilter(currentStory.entity_type)
  }, [currentStory])

  const closeFilter = useCallback(() => setFilterOpen(false), [])
  const closeStory = useCallback(() => { setStoryOpen(false); setStorySearch('') }, [])
  useClickOutside(filterRef, closeFilter, filterOpen)
  useClickOutside(storyRef, closeStory, storyOpen)

  const filteredByType = activeFilter === 'all'
    ? stories
    : stories.filter(s => s.entity_type === activeFilter)

  const filteredStories = storySearch.trim()
    ? filteredByType.filter(s => (s.title || '').toLowerCase().includes(storySearch.toLowerCase()))
    : filteredByType

  const activeFilterObj = SOURCE_FILTERS.find(f => f.value === activeFilter) || SOURCE_FILTERS[0]
  const FilterIcon = activeFilterObj.icon

  const currentStoryMatchesFilter = activeFilter === 'all' || currentStory?.entity_type === activeFilter
  const displayedStory = currentStoryMatchesFilter ? currentStory : null

  const handleSelectFilter = (value: string) => {
    setActiveFilter(value)
    setFilterOpen(false)
    setStorySearch('')
  }

  const handleSelectStory = (storyId: string) => {
    setStoryOpen(false)
    setStorySearch('')
    if (storyId !== currentStoryId) {
      router.push(`/story/${storyId}`)
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full md:flex-row md:items-center md:max-w-2xl md:mx-auto">
      {/* Source type dropdown */}
      <div className="relative md:flex-1 md:min-w-0" ref={filterRef}>
        <button
          type="button"
          onClick={() => { setFilterOpen(prev => !prev); setStoryOpen(false) }}
          className="w-full px-3 py-2 md:py-1.5 rounded-xl md:rounded-lg bg-neutral-900/80 md:bg-black/40 border border-neutral-700/50 hover:border-neutral-600 active:bg-neutral-800 transition-colors flex items-center gap-2.5 text-left"
        >
          <FilterIcon className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#39FF14] flex-shrink-0" />
          <span className="text-xs md:text-xs text-white font-medium whitespace-nowrap flex-1">
            {activeFilterObj.label}
          </span>
          <span className="text-[10px] text-neutral-500 flex-shrink-0">
            {filteredByType.length}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 md:w-3 md:h-3 text-neutral-400 transition-transform flex-shrink-0 ${filterOpen ? 'rotate-180' : ''}`} />
        </button>

        {filterOpen && (
          <div className="absolute z-50 right-0 left-0 mt-1.5 py-1 bg-[#1A1A1A] border border-neutral-700 rounded-xl shadow-2xl">
            {SOURCE_FILTERS.map(filter => {
              const Icon = filter.icon
              const isActive = activeFilter === filter.value
              const count = filter.value === 'all' ? stories.length : stories.filter(s => s.entity_type === filter.value).length
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => handleSelectFilter(filter.value)}
                  className={`w-full px-3.5 py-2.5 md:px-3 md:py-2 flex items-center gap-2.5 text-left transition-colors ${
                    isActive ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800 active:bg-neutral-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 md:w-3.5 md:h-3.5 flex-shrink-0 ${isActive ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                  <span className={`text-sm md:text-xs font-medium flex-1 ${isActive ? 'text-white' : 'text-neutral-300'}`}>
                    {filter.label}
                  </span>
                  <span className="text-xs md:text-[10px] text-neutral-500">{count}</span>
                  {isActive && <Check className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#39FF14] flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Story selector dropdown */}
      <div className="relative md:flex-1 md:min-w-0" ref={storyRef}>
        <button
          type="button"
          onClick={() => { setStoryOpen(prev => !prev); setFilterOpen(false) }}
          className="w-full px-3 py-2 md:py-1.5 rounded-xl md:rounded-lg bg-neutral-900/80 md:bg-black/40 border border-neutral-700/50 hover:border-neutral-600 active:bg-neutral-800 transition-colors flex items-center gap-2.5 text-left"
        >
          {displayedStory && (() => {
            const Icon = ENTITY_ICONS[displayedStory.entity_type] || FileText
            return <Icon className="w-4 h-4 md:w-3.5 md:h-3.5 text-neutral-400 flex-shrink-0" />
          })()}
          <span className={`text-xs md:text-xs font-medium truncate flex-1 ${displayedStory ? 'text-white' : 'text-neutral-500'}`}>
            {displayedStory?.title || 'Select a story...'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 md:w-3 md:h-3 text-neutral-400 transition-transform flex-shrink-0 ${storyOpen ? 'rotate-180' : ''}`} />
        </button>

        {storyOpen && (
          <div className="absolute z-50 right-0 left-0 mt-1.5 bg-[#1A1A1A] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
            {filteredByType.length > 3 && (
              <div className="p-2 border-b border-neutral-700/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                  <input
                    type="text"
                    value={storySearch}
                    onChange={(e) => setStorySearch(e.target.value)}
                    placeholder="Search stories..."
                    className="w-full pl-9 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#39FF14]/50"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
            <div className="py-1 max-h-64 overflow-y-auto">
              {filteredStories.length === 0 ? (
                <div className="px-4 py-3 text-center">
                  <p className="text-sm md:text-xs text-neutral-500">
                    {storySearch.trim() ? `No results for "${storySearch}"` : 'No stories in this category'}
                  </p>
                </div>
              ) : (
                filteredStories.map(story => {
                  const isSelected = story.id === currentStoryId
                  const Icon = ENTITY_ICONS[story.entity_type] || FileText
                  const wordCount = story.word_count || 0
                  return (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => handleSelectStory(story.id)}
                      className={`w-full px-3.5 py-2.5 md:px-3 md:py-2 flex items-center gap-2.5 text-left transition-colors ${
                        isSelected ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800 active:bg-neutral-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 md:w-3.5 md:h-3.5 flex-shrink-0 ${isSelected ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm md:text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                          {story.title || 'Untitled Story'}
                        </p>
                        <p className="text-xs md:text-[10px] text-neutral-500">
                          {wordCount > 0 ? `${wordCount.toLocaleString()} words · ` : ''}
                          {new Date(story.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#39FF14] flex-shrink-0" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function StoryAreaBar() {
  const pathname = usePathname()
  const { stories } = useStoryStudio()

  const isStoryList = pathname === '/story' || pathname === '/story/'
  const isStoryDetail = !isStoryList && pathname !== '/story/new' && /^\/story\/[^/]+$/.test(pathname)

  let contextBar: React.ReactNode = undefined
  if (isStoryDetail) {
    const storyId = pathname.split('/').pop() || ''
    contextBar = <StoryContextBar currentStoryId={storyId} stories={stories} />
  }

  return (
    <AreaBar
      area={{ name: 'My Stories', icon: Library }}
      tabs={TABS}
      contextBar={contextBar}
      variant="default"
    />
  )
}
