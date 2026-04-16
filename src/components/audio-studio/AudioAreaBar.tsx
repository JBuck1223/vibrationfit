'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Headphones, Wand2, Compass, ListMusic, Library,
  Target, BookOpen, Music2, ChevronDown, Check,
  Image, Lightbulb, Clock,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar } from '@/components/area-studio'
import { useAudioStudio } from './AudioStudioContext'

const TABS = [
  { label: 'Listen', path: '/audio', icon: Headphones },
  { label: 'Create', path: '/audio/create', icon: Wand2, matchPaths: ['/audio/generate', '/audio/mix', '/audio/record', '/audio/queue'] },
  { label: 'Explore', path: '/audio/explore', icon: Compass },
]

const CREATE_ROUTES = ['/audio/create', '/audio/generate', '/audio/mix', '/audio/record']
const QUEUE_ROUTES = ['/audio/queue']

const CONTENT_TYPES = [
  { value: 'life-vision', label: 'Life Vision', icon: Target },
  { value: 'stories', label: 'Stories', icon: Library },
  { value: 'music', label: 'Music', icon: Music2 },
]

const BTN = 'w-full h-9 md:h-8 px-3 rounded-xl md:rounded-lg bg-neutral-900/80 md:bg-black/40 border border-neutral-700/50 hover:border-neutral-600 active:bg-neutral-800 transition-colors flex items-center gap-2.5 text-left'

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

const SOURCE_FILTERS = [
  { label: 'All Types', value: 'all', icon: Library },
  { label: 'Life Vision', value: 'life_vision', icon: Target },
  { label: 'Vision Board', value: 'vision_board_item', icon: Image },
  { label: 'Journal', value: 'journal_entry', icon: BookOpen },
  { label: 'Custom', value: 'custom', icon: Lightbulb },
]

function ListenFilterBar() {
  const {
    listenContentType, setListenContentType,
    listenStoryFilter, setListenStoryFilter,
    vision, allVisions, switchVision,
    storiesWithAudio,
  } = useAudioStudio()

  const [contentTypeOpen, setContentTypeOpen] = useState(false)
  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const contentTypeRef = useRef<HTMLDivElement>(null)
  const secondaryRef = useRef<HTMLDivElement>(null)

  const closeContentType = useCallback(() => setContentTypeOpen(false), [])
  const closeSecondary = useCallback(() => setSecondaryOpen(false), [])
  useClickOutside(contentTypeRef, closeContentType, contentTypeOpen)
  useClickOutside(secondaryRef, closeSecondary, secondaryOpen)

  const closeAll = () => { setContentTypeOpen(false); setSecondaryOpen(false) }

  const activeContentObj = CONTENT_TYPES.find(c => c.value === listenContentType) || CONTENT_TYPES[0]
  const ActiveContentIcon = activeContentObj.icon

  const currentVisionLabel = vision
    ? `Version ${vision.version_number}`
    : 'Select Vision'

  const activeSourceObj = SOURCE_FILTERS.find(f => f.value === listenStoryFilter) || SOURCE_FILTERS[0]
  const ActiveSourceIcon = activeSourceObj.icon

  const filteredByType = listenStoryFilter === 'all'
    ? storiesWithAudio
    : storiesWithAudio.filter(s => s.entity_type === listenStoryFilter)

  return (
    <div className="flex flex-col gap-2 w-full md:flex-row md:items-center md:max-w-2xl md:mx-auto">
      {/* Content type dropdown */}
      <div className="relative md:flex-1 md:min-w-0" ref={contentTypeRef}>
        <button
          type="button"
          onClick={() => { setContentTypeOpen(prev => !prev); setSecondaryOpen(false) }}
          className={BTN}
        >
          <ActiveContentIcon className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#39FF14] flex-shrink-0" />
          <span className="text-xs text-white font-medium flex-1">{activeContentObj.label}</span>
          <ChevronDown className={`w-3.5 h-3.5 md:w-3 md:h-3 text-neutral-400 transition-transform flex-shrink-0 ${contentTypeOpen ? 'rotate-180' : ''}`} />
        </button>

        {contentTypeOpen && (
          <div className="absolute z-50 right-0 left-0 mt-1.5 py-1 bg-[#1A1A1A] border border-neutral-700 rounded-xl shadow-2xl">
            {CONTENT_TYPES.map(ct => {
              const Icon = ct.icon
              const isActive = listenContentType === ct.value
              return (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => { setListenContentType(ct.value); closeAll() }}
                  className={`w-full px-3.5 py-2.5 md:px-3 md:py-2 flex items-center gap-2.5 text-left transition-colors ${isActive ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800 active:bg-neutral-800'}`}
                >
                  <Icon className={`w-4 h-4 md:w-3.5 md:h-3.5 flex-shrink-0 ${isActive ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                  <span className={`text-sm md:text-xs font-medium flex-1 ${isActive ? 'text-white' : 'text-neutral-300'}`}>{ct.label}</span>
                  {isActive && <Check className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#39FF14] flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Vision version dropdown */}
      {listenContentType === 'life-vision' && allVisions.length > 1 && (
        <div className="relative md:flex-1 md:min-w-0" ref={secondaryRef}>
          <button
            type="button"
            onClick={() => { setSecondaryOpen(prev => !prev); setContentTypeOpen(false) }}
            className={BTN}
          >
            <span className="text-xs text-white font-medium flex-1 truncate">{currentVisionLabel}</span>
            {vision?.is_active && (
              <span className="text-[10px] font-semibold text-[#39FF14] bg-[#39FF14]/10 px-1.5 py-0.5 rounded flex-shrink-0">Active</span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 md:w-3 md:h-3 text-neutral-400 transition-transform flex-shrink-0 ${secondaryOpen ? 'rotate-180' : ''}`} />
          </button>

          {secondaryOpen && (
            <div className="absolute z-50 right-0 left-0 mt-1.5 py-1 bg-[#1A1A1A] border border-neutral-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
              {allVisions.map(v => {
                const isSelected = v.id === vision?.id
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => { switchVision(v.id); setSecondaryOpen(false) }}
                    className={`w-full px-3.5 py-2.5 md:px-3 md:py-2 flex items-center gap-2.5 text-left transition-colors ${isSelected ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800 active:bg-neutral-800'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm md:text-xs font-medium ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                        Version {v.version_number}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    {v.is_active && (
                      <span className="text-[10px] font-semibold text-[#39FF14] bg-[#39FF14]/10 px-1.5 py-0.5 rounded flex-shrink-0">Active</span>
                    )}
                    {isSelected && <Check className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#39FF14] flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Story source type filter (when Stories selected) */}
      {listenContentType === 'stories' && (
        <div className="relative md:flex-1 md:min-w-0" ref={secondaryRef}>
          <button
            type="button"
            onClick={() => { setSecondaryOpen(prev => !prev); setContentTypeOpen(false) }}
            className={BTN}
          >
            <ActiveSourceIcon className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#39FF14] flex-shrink-0" />
            <span className="text-xs text-white font-medium flex-1">{activeSourceObj.label}</span>
            <span className="text-[10px] text-neutral-500 flex-shrink-0">{filteredByType.length}</span>
            <ChevronDown className={`w-3.5 h-3.5 md:w-3 md:h-3 text-neutral-400 transition-transform flex-shrink-0 ${secondaryOpen ? 'rotate-180' : ''}`} />
          </button>

          {secondaryOpen && (
            <div className="absolute z-50 right-0 left-0 mt-1.5 py-1 bg-[#1A1A1A] border border-neutral-700 rounded-xl shadow-2xl">
              {SOURCE_FILTERS.map(filter => {
                const Icon = filter.icon
                const isActive = listenStoryFilter === filter.value
                const count = filter.value === 'all' ? storiesWithAudio.length : storiesWithAudio.filter(s => s.entity_type === filter.value).length
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => { setListenStoryFilter(filter.value); setSecondaryOpen(false) }}
                    className={`w-full px-3.5 py-2.5 md:px-3 md:py-2 flex items-center gap-2.5 text-left transition-colors ${isActive ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800 active:bg-neutral-800'}`}
                  >
                    <Icon className={`w-4 h-4 md:w-3.5 md:h-3.5 flex-shrink-0 ${isActive ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                    <span className={`text-sm md:text-xs font-medium flex-1 ${isActive ? 'text-white' : 'text-neutral-300'}`}>{filter.label}</span>
                    <span className="text-xs md:text-[10px] text-neutral-500">{count}</span>
                    {isActive && <Check className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#39FF14] flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

function CreateQueueToggle() {
  const pathname = usePathname()
  const { activeBatchCount } = useAudioStudio()
  const isQueue = QUEUE_ROUTES.some(r => pathname.startsWith(r))
  const isCreate = !isQueue

  return (
    <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-neutral-900/60 mx-auto">
      <Link
        href="/audio/create"
        className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
          isCreate
            ? 'bg-primary-500/20 text-primary-500'
            : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
        }`}
      >
        <Wand2 className="w-3.5 h-3.5" />
        Create
      </Link>
      <Link
        href="/audio/queue"
        className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
          isQueue
            ? 'bg-primary-500/20 text-primary-500'
            : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
        }`}
      >
        <ListMusic className="w-3.5 h-3.5" />
        Queue
        {activeBatchCount > 0 && (
          <span className="w-4 h-4 flex items-center justify-center rounded-full bg-[#39FF14] text-black text-[9px] font-bold">
            {activeBatchCount}
          </span>
        )}
      </Link>
    </div>
  )
}

export function AudioAreaBar() {
  const pathname = usePathname()

  const isListen = pathname === '/audio' || pathname === '/audio/'
  const isCreateArea = [...CREATE_ROUTES, ...QUEUE_ROUTES].some(r => pathname.startsWith(r))

  let contextBar: React.ReactNode = undefined
  if (isListen) {
    contextBar = <ListenFilterBar />
  } else if (isCreateArea) {
    contextBar = <CreateQueueToggle />
  }

  return (
    <AreaBar
      area={{ name: 'Audio Studio', icon: Headphones }}
      tabs={TABS}
      contextBar={contextBar}
      keepTabActive
      variant="default"
    />
  )
}
