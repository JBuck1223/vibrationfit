'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Target, BookOpen, ChevronDown, Check, Search, Home, Image, Lightbulb, Library } from 'lucide-react'
import { Card } from '@/lib/design-system/components'
import { useAudioStudio } from './AudioStudioContext'
import type { AudioSourceType } from './AudioStudioContext'
import type { VisionData } from './AudioStudioContext'
import type { Story } from '@/lib/stories/types'

// ─── Shared constants ────────────────────────────────────────────────────────

const ENTITY_TYPE_LABELS: Record<string, string> = {
  life_vision: 'Life Vision',
  vision_board_item: 'Vision Board',
  goal: 'Goal',
  schedule_block: 'Schedule',
  journal_entry: 'Journal',
  custom: 'Custom',
}

const STORY_SOURCE_FILTERS = [
  { value: 'all', label: 'All Types', icon: Library },
  { value: 'life_vision', label: 'Life Vision', icon: Target },
  { value: 'vision_board_item', label: 'Vision Board', icon: Image },
  { value: 'journal_entry', label: 'Journal', icon: BookOpen },
  { value: 'custom', label: 'Custom', icon: Lightbulb },
]

const VISION_TYPE_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'individual', label: 'Individual' },
  { key: 'household', label: 'Household' },
]

// ─── Shared hook ─────────────────────────────────────────────────────────────

function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    function handler(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler) }
  }, [active, ref, onClose])
}

// ─── VisionDropdown ──────────────────────────────────────────────────────────

export interface VisionDropdownProps {
  visions: VisionData[]
  selectedId: string | null
  onSelect: (id: string, vision: VisionData) => void
  loading?: boolean
  placeholder?: string
}

export function VisionDropdown({
  visions,
  selectedId,
  onSelect,
  loading = false,
  placeholder = 'Select a vision...',
}: VisionDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const ref = useRef<HTMLDivElement>(null)

  const close = useCallback(() => { setOpen(false); setSearch(''); setTypeFilter('all') }, [])
  useClickOutside(ref, close, open)

  if (loading) {
    return <p className="text-sm text-neutral-500 text-center py-2">Loading visions...</p>
  }
  if (visions.length === 0) {
    return <p className="text-sm text-neutral-500 text-center py-2">No published visions found.</p>
  }

  const selected = selectedId ? visions.find(v => v.id === selectedId) : null
  const isHousehold = (v: VisionData) => !!v.household_id
  const hasHouseholdVisions = visions.some(isHousehold)

  const filtered = visions.filter(v => {
    if (typeFilter === 'individual' && isHousehold(v)) return false
    if (typeFilter === 'household' && !isHousehold(v)) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const dateStr = new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const typeLabel = isHousehold(v) ? 'household' : 'individual'
      return (
        String(v.version_number).includes(q) ||
        `v${v.version_number}`.includes(q) ||
        dateStr.toLowerCase().includes(q) ||
        typeLabel.includes(q) ||
        (v.is_active && 'active'.includes(q))
      )
    }
    return true
  })

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="w-full px-4 py-3 rounded-xl bg-neutral-900/80 border border-neutral-700/50 hover:border-neutral-600 transition-colors flex items-center gap-3 text-left"
      >
        <Target className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <span className="text-sm text-white font-medium flex-1 truncate">
          {selected ? (
            <span className="flex items-center gap-1.5">
              Version {selected.version_number}
              {isHousehold(selected) && <Home className="w-3.5 h-3.5 text-secondary-500 inline-block" />}
              {selected.is_active && (
                <span className="text-[10px] font-semibold text-[#39FF14] bg-[#39FF14]/10 px-1.5 py-0.5 rounded">Active</span>
              )}
            </span>
          ) : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-[#1A1A1A] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-neutral-700/50">
            <div className="flex items-center gap-2">
              {hasHouseholdVisions && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {VISION_TYPE_CHIPS.map(chip => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setTypeFilter(chip.key) }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                        typeFilter === chip.key
                          ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30'
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      {chip.key === 'household' && <Home className="w-3 h-3 inline-block mr-1 -mt-0.5" />}
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#39FF14]/50"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-center">
                <p className="text-sm text-neutral-500">
                  {(search.trim() || typeFilter !== 'all') ? 'No visions match your filters' : 'No visions available'}
                </p>
              </div>
            ) : (
              filtered.map(v => {
                const isSel = v.id === selectedId
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => { onSelect(v.id, v); close() }}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                      isSel ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                        Version {v.version_number}
                        {isHousehold(v) && <Home className="w-3.5 h-3.5 text-secondary-500 flex-shrink-0" />}
                        {v.is_active && (
                          <span className="text-[10px] font-semibold text-[#39FF14] bg-[#39FF14]/10 px-1.5 py-0.5 rounded">Active</span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-500">
                        <span className="text-neutral-400">{isHousehold(v) ? 'Household' : 'Individual'}</span>
                        {' · '}
                        {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    {isSel && <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── StoryDropdown (double dropdown: type left, story right) ─────────────────

export interface StoryDropdownProps {
  stories: Story[]
  selectedId: string | null
  onSelect: (id: string, story: Story) => void
  loading?: boolean
  placeholder?: string
  filterFn?: (story: Story) => boolean
}

const DROPDOWN_BTN = 'w-full px-3.5 py-2.5 rounded-xl bg-neutral-900/80 border border-neutral-700/50 hover:border-neutral-600 transition-colors flex items-center gap-2.5 text-left'

export function StoryDropdown({
  stories,
  selectedId,
  onSelect,
  loading = false,
  placeholder = 'Select a story...',
  filterFn,
}: StoryDropdownProps) {
  const [typeOpen, setTypeOpen] = useState(false)
  const [storyOpen, setStoryOpen] = useState(false)
  const [entityFilter, setEntityFilter] = useState('all')
  const [search, setSearch] = useState('')
  const typeRef = useRef<HTMLDivElement>(null)
  const storyRef = useRef<HTMLDivElement>(null)

  const closeType = useCallback(() => setTypeOpen(false), [])
  const closeStory = useCallback(() => { setStoryOpen(false); setSearch('') }, [])
  useClickOutside(typeRef, closeType, typeOpen)
  useClickOutside(storyRef, closeStory, storyOpen)

  const baseStories = filterFn ? stories.filter(filterFn) : stories
  const selected = selectedId ? stories.find(s => s.id === selectedId) : null

  const filteredByType = entityFilter === 'all'
    ? baseStories
    : baseStories.filter(s => s.entity_type === entityFilter)

  const filtered = search.trim()
    ? filteredByType.filter(s => {
        const q = search.toLowerCase()
        const title = (s.title || '').toLowerCase()
        const dateStr = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase()
        return title.includes(q) || dateStr.includes(q)
      })
    : filteredByType

  const activeTypeObj = STORY_SOURCE_FILTERS.find(f => f.value === entityFilter) || STORY_SOURCE_FILTERS[0]
  const ActiveTypeIcon = activeTypeObj.icon

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {/* Left: Source type dropdown */}
      <div className="relative" ref={typeRef}>
        <button
          type="button"
          onClick={() => { setTypeOpen(prev => !prev); setStoryOpen(false) }}
          className={DROPDOWN_BTN}
        >
          <ActiveTypeIcon className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
          <span className="text-sm text-white font-medium flex-1 truncate">{activeTypeObj.label}</span>
          <span className="text-[10px] text-neutral-500 flex-shrink-0">{filteredByType.length}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform flex-shrink-0 ${typeOpen ? 'rotate-180' : ''}`} />
        </button>

        {typeOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 py-1 bg-[#1A1A1A] border border-neutral-700 rounded-xl shadow-2xl">
            {STORY_SOURCE_FILTERS.map(filter => {
              const Icon = filter.icon
              const isActive = entityFilter === filter.value
              const count = filter.value === 'all' ? baseStories.length : baseStories.filter(s => s.entity_type === filter.value).length
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => { setEntityFilter(filter.value); setTypeOpen(false) }}
                  className={`w-full px-3.5 py-2.5 flex items-center gap-2.5 text-left transition-colors ${isActive ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800'}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                  <span className={`text-sm font-medium flex-1 ${isActive ? 'text-white' : 'text-neutral-300'}`}>{filter.label}</span>
                  <span className="text-[10px] text-neutral-500 flex-shrink-0">{count}</span>
                  {isActive && <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Right: Story selector dropdown */}
      <div className="relative min-w-0" ref={storyRef}>
        <button
          type="button"
          onClick={() => { setStoryOpen(prev => !prev); setTypeOpen(false) }}
          className={DROPDOWN_BTN}
        >
          <BookOpen className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span className="text-sm text-white font-medium flex-1 truncate">
            {selected?.title || placeholder}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform flex-shrink-0 ${storyOpen ? 'rotate-180' : ''}`} />
        </button>

        {storyOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 bg-[#1A1A1A] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-2 border-b border-neutral-700/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search stories..."
                  className="w-full pl-9 pr-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#39FF14]/50"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="py-1 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-3 text-center">
                  <p className="text-sm text-neutral-500">Loading stories...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-3 text-center">
                  <p className="text-sm text-neutral-500">
                    {(search.trim() || entityFilter !== 'all') ? 'No stories match your filters' : 'No stories available'}
                  </p>
                </div>
              ) : (
                filtered.map(story => {
                  const isSel = story.id === selectedId
                  return (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => { onSelect(story.id, story); closeStory() }}
                      className={`w-full px-3.5 py-2.5 flex items-center gap-2.5 text-left transition-colors ${
                        isSel ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {story.title || 'Untitled Story'}
                        </p>
                        <p className="text-xs text-neutral-500">
                          <span className="text-neutral-400">{ENTITY_TYPE_LABELS[story.entity_type] || story.entity_type}</span>
                          {story.word_count ? ` · ${story.word_count.toLocaleString()} words` : ''}
                          {' · '}
                          {new Date(story.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      {isSel && <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />}
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

// ─── AudioSourceSelector (composite) ─────────────────────────────────────────

interface SourceTypeOption {
  type: AudioSourceType
  label: string
  description: string
  icon: React.ElementType
  color: string
}

const DEFAULT_SOURCE_TYPES: SourceTypeOption[] = [
  {
    type: 'life_vision',
    label: 'Life Vision',
    description: 'Use your life vision sections as audio source.',
    icon: Target,
    color: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  },
  {
    type: 'story',
    label: 'Story',
    description: 'Use a completed story as audio source.',
    icon: BookOpen,
    color: 'text-teal-400 bg-teal-500/20 border-teal-500/30',
  },
]

export interface AudioSourceSelection {
  sourceType: AudioSourceType
  sourceId: string
  vision?: VisionData
  story?: Story
}

interface AudioSourceSelectorProps {
  onSourceSelected: (selection: AudioSourceSelection) => void
  allowedSourceTypes?: AudioSourceType[]
  filterStories?: (story: Story) => boolean
  filterVisions?: (vision: VisionData) => boolean
  initialSourceType?: AudioSourceType
  initialSourceId?: string | null
}

export function AudioSourceSelector({
  onSourceSelected,
  allowedSourceTypes,
  filterStories,
  filterVisions,
  initialSourceType,
  initialSourceId,
}: AudioSourceSelectorProps) {
  const {
    allVisions,
    allStories,
    allStoriesLoading,
    visionLoading,
    sourceType: contextSourceType,
    sourceId: contextSourceId,
  } = useAudioStudio()

  const [selectedType, setSelectedType] = useState<AudioSourceType>(
    initialSourceType || contextSourceType || null
  )
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    initialSourceId || contextSourceId || null
  )
  const hasHydratedFromContext = useRef(false)

  useEffect(() => {
    if (hasHydratedFromContext.current) return
    const type = initialSourceType || contextSourceType
    const id = initialSourceId || contextSourceId
    if (type && id) {
      hasHydratedFromContext.current = true
      setSelectedType(type)
      setSelectedEntityId(id)
    }
  }, [initialSourceType, initialSourceId, contextSourceType, contextSourceId])

  const sourceTypes = allowedSourceTypes
    ? DEFAULT_SOURCE_TYPES.filter(st => allowedSourceTypes.includes(st.type))
    : DEFAULT_SOURCE_TYPES

  const filteredVisions = filterVisions ? allVisions.filter(filterVisions) : allVisions

  useEffect(() => {
    if (!selectedType || !selectedEntityId) return

    if (selectedType === 'life_vision' && allVisions.length > 0) {
      const vision = allVisions.find(v => v.id === selectedEntityId)
      if (vision) {
        onSourceSelected({ sourceType: 'life_vision', sourceId: vision.id, vision })
      }
    } else if (selectedType === 'story' && allStories.length > 0) {
      const story = allStories.find(s => s.id === selectedEntityId)
      if (story) {
        onSourceSelected({ sourceType: 'story', sourceId: story.id, story })
      }
    }
  }, [selectedType, selectedEntityId, allVisions.length, allStories.length])

  function handleTypeSelect(type: AudioSourceType) {
    setSelectedType(type)
    setSelectedEntityId(null)
  }

  return (
    <Card variant="glass" className="p-4 md:p-6 relative z-10">
      <div className="flex flex-col items-center text-center mb-4">
        <h3 className="text-lg font-semibold text-white">Select Source</h3>
        <p className="text-sm text-neutral-400">Choose what content to use for your audio.</p>
      </div>

      {/* Source Type Cards */}
      <div
        className={`grid gap-3 mb-4 ${
          sourceTypes.length === 1
            ? 'grid-cols-1 max-w-sm mx-auto'
            : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
        {sourceTypes.map(st => {
          const Icon = st.icon
          const isSelected = selectedType === st.type
          return (
            <button
              key={st.type}
              type="button"
              onClick={() => handleTypeSelect(st.type)}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-neutral-700/50 bg-neutral-900/40 hover:border-neutral-600'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${st.color.split(' ').slice(1).join(' ')}`}>
                <Icon className={`w-5 h-5 ${st.color.split(' ')[0]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{st.label}</p>
                <p className="text-xs text-neutral-400">{st.description}</p>
              </div>
              {isSelected && <Check className="w-5 h-5 text-primary-500 flex-shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* Entity Selector */}
      {selectedType && (
        <div className="mx-auto">
          {selectedType === 'life_vision' && (
            <VisionDropdown
              visions={filteredVisions}
              selectedId={selectedEntityId}
              onSelect={(id, vision) => {
                setSelectedEntityId(id)
                onSourceSelected({ sourceType: 'life_vision', sourceId: id, vision })
              }}
              loading={visionLoading}
            />
          )}
          {selectedType === 'story' && (
            <StoryDropdown
              stories={allStories}
              selectedId={selectedEntityId}
              onSelect={(id, story) => {
                setSelectedEntityId(id)
                onSourceSelected({ sourceType: 'story', sourceId: id, story })
              }}
              loading={allStoriesLoading}
              filterFn={filterStories}
            />
          )}
        </div>
      )}
    </Card>
  )
}
