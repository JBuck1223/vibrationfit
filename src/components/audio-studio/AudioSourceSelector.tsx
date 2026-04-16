'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Target, BookOpen, ChevronDown, Check, Search } from 'lucide-react'
import { Card } from '@/lib/design-system/components'
import { useAudioStudio } from './AudioStudioContext'
import type { AudioSourceType } from './AudioStudioContext'
import type { VisionData } from './AudioStudioContext'
import type { Story } from '@/lib/stories/types'

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
  const [entityDropdownOpen, setEntityDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const entityRef = useRef<HTMLDivElement>(null)

  const closeEntity = useCallback(() => { setEntityDropdownOpen(false); setSearchQuery('') }, [])
  useClickOutside(entityRef, closeEntity, entityDropdownOpen)

  const sourceTypes = allowedSourceTypes
    ? DEFAULT_SOURCE_TYPES.filter(st => allowedSourceTypes.includes(st.type))
    : DEFAULT_SOURCE_TYPES

  const filteredVisions = filterVisions
    ? allVisions.filter(filterVisions)
    : allVisions

  const filteredStories = (() => {
    let stories = filterStories ? allStories.filter(filterStories) : allStories
    if (searchQuery.trim()) {
      stories = stories.filter(s =>
        (s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return stories
  })()

  // Auto-select from URL params or context when data loads
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

    // Auto-select if only one option
    if (type === 'life_vision' && filteredVisions.length === 1) {
      const vision = filteredVisions[0]
      setSelectedEntityId(vision.id)
      onSourceSelected({ sourceType: 'life_vision', sourceId: vision.id, vision })
    }
  }

  function handleEntitySelect(id: string) {
    setSelectedEntityId(id)
    setEntityDropdownOpen(false)
    setSearchQuery('')

    if (selectedType === 'life_vision') {
      const vision = allVisions.find(v => v.id === id)
      if (vision) onSourceSelected({ sourceType: 'life_vision', sourceId: id, vision })
    } else if (selectedType === 'story') {
      const story = allStories.find(s => s.id === id)
      if (story) onSourceSelected({ sourceType: 'story', sourceId: id, story })
    }
  }

  const isLoading = visionLoading || allStoriesLoading

  return (
    <Card variant="glass" className="p-4 md:p-6">
      <div className="flex flex-col items-center text-center mb-4">
        <h3 className="text-lg font-semibold text-white">Select Source</h3>
        <p className="text-sm text-neutral-400">Choose what content to use for your audio.</p>
      </div>

      {/* Source Type Cards */}
      <div className={`grid gap-3 mb-4 ${sourceTypes.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'}`}>
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
        <div className="max-w-2xl mx-auto">
          {selectedType === 'life_vision' && (
            <VisionSelector
              visions={filteredVisions}
              selectedId={selectedEntityId}
              onSelect={handleEntitySelect}
              loading={visionLoading}
            />
          )}
          {selectedType === 'story' && (
            <div className="relative" ref={entityRef}>
              <button
                type="button"
                onClick={() => setEntityDropdownOpen(prev => !prev)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-900/80 border border-neutral-700/50 hover:border-neutral-600 transition-colors flex items-center gap-3 text-left"
              >
                <BookOpen className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span className="text-sm text-white font-medium flex-1 truncate">
                  {selectedEntityId
                    ? allStories.find(s => s.id === selectedEntityId)?.title || 'Selected Story'
                    : 'Select a story...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${entityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {entityDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-[#1A1A1A] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
                  {filteredStories.length > 3 && (
                    <div className="p-2 border-b border-neutral-700/50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search stories..."
                          className="w-full pl-9 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#39FF14]/50"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  )}
                  <div className="py-1 max-h-64 overflow-y-auto">
                    {isLoading ? (
                      <div className="px-4 py-3 text-center">
                        <p className="text-sm text-neutral-500">Loading stories...</p>
                      </div>
                    ) : filteredStories.length === 0 ? (
                      <div className="px-4 py-3 text-center">
                        <p className="text-sm text-neutral-500">
                          {searchQuery.trim() ? `No results for "${searchQuery}"` : 'No stories available'}
                        </p>
                      </div>
                    ) : (
                      filteredStories.map(story => {
                        const isSelected = story.id === selectedEntityId
                        return (
                          <button
                            key={story.id}
                            type="button"
                            onClick={() => handleEntitySelect(story.id)}
                            className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                              isSelected ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {story.title || 'Untitled Story'}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {story.word_count ? `${story.word_count.toLocaleString()} words` : ''}
                                {story.word_count ? ' · ' : ''}
                                {new Date(story.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function VisionSelector({
  visions,
  selectedId,
  onSelect,
  loading,
}: {
  visions: VisionData[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading: boolean
}) {
  if (loading) {
    return <p className="text-sm text-neutral-500 text-center">Loading visions...</p>
  }
  if (visions.length === 0) {
    return <p className="text-sm text-neutral-500 text-center">No published visions found.</p>
  }
  if (visions.length === 1) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary-500/10 border border-primary-500/30">
        <Target className="w-4 h-4 text-purple-400" />
        <span className="text-sm text-white font-medium">
          Version {visions[0].version_number}
        </span>
        {visions[0].is_active && (
          <span className="text-[10px] font-semibold text-[#39FF14] bg-[#39FF14]/10 px-1.5 py-0.5 rounded">Active</span>
        )}
        <Check className="w-4 h-4 text-primary-500" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {visions.map(v => {
        const isSelected = v.id === selectedId
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
              isSelected
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-neutral-700/50 bg-neutral-900/40 hover:border-neutral-600'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">V{v.version_number}</p>
              <p className="text-[10px] text-neutral-500">
                {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            {v.is_active && (
              <span className="text-[10px] font-semibold text-[#39FF14] bg-[#39FF14]/10 px-1.5 py-0.5 rounded flex-shrink-0">Active</span>
            )}
            {isSelected && <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
