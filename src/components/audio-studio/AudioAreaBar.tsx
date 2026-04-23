'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Headphones, Wand2, ListMusic, Library,
  Target, BookOpen, Music2, ChevronDown, Check, Search,
  Image, Lightbulb, Clock, FileText, AudioLines, Mic, Music,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar } from '@/components/area-studio'
import { useAudioStudio } from './AudioStudioContext'

const TABS = [
  { label: 'Listen', path: '/audio', icon: Headphones },
  { label: 'Create', path: '/audio/create', icon: Wand2 },
]

const CREATE_AREA_ROUTES = ['/audio/create', '/audio/generate', '/audio/mix', '/audio/record', '/audio/queue']

const SECONDARY_TABS = [
  { label: 'Generate', path: '/audio/generate', icon: AudioLines },
  { label: 'Record', path: '/audio/record', icon: Mic },
  { label: 'Mix', path: '/audio/mix', icon: Music },
  { label: 'Queue', path: '/audio/queue', icon: Clock },
]

const CREATE_TOOL_SUBTEXT: Record<string, string> = {
  '/audio/generate':
    'Choose a source and voice to create VIVA narration of your Life Vision or Story.',
  '/audio/record':
    'Read your Life Vision or Story aloud and create a personal voice recording.',
  '/audio/mix':
    'Add background music and binaural beats to your existing voice tracks.',
  '/audio/queue':
    'Track the progress of your audio generation and mixing jobs.',
}

const CONTENT_TYPES = [
  { value: 'life-vision', label: 'Life Vision', icon: Target },
  { value: 'stories', label: 'Stories', icon: Library },
  { value: 'music', label: 'Music', icon: Music2 },
]

const LISTEN_CONTENT_SUBTEXT: Record<string, string> = {
  'life-vision': 'Play your Life Vision audio sets and voice recordings.',
  'stories': 'Play narrated audio from your completed stories.',
  'music': 'Stream VibrationFit original music on your favorite platform.',
}

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

const SEGMENT_BASE =
  'flex min-w-0 flex-1 items-center justify-center gap-1.5 px-1.5 py-2 sm:px-2 sm:py-1.5 text-[11px] sm:text-xs font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40'

function ListenFilterBar() {
  const {
    listenContentType, setListenContentType,
    listenStoryFilter, setListenStoryFilter,
    vision, allVisions, switchVision,
    storiesWithAudio,
  } = useAudioStudio()

  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const secondaryRef = useRef<HTMLDivElement>(null)
  const closeSecondary = useCallback(() => setSecondaryOpen(false), [])
  useClickOutside(secondaryRef, closeSecondary, secondaryOpen)

  const closeAll = () => { setSecondaryOpen(false) }

  const activeContentObj = CONTENT_TYPES.find(c => c.value === listenContentType) || CONTENT_TYPES[0]

  const currentVisionLabel = vision
    ? `Version ${vision.version_number}`
    : 'Select Vision'

  const activeSourceObj = SOURCE_FILTERS.find(f => f.value === listenStoryFilter) || SOURCE_FILTERS[0]
  const ActiveSourceIcon = activeSourceObj.icon

  const filteredByType = listenStoryFilter === 'all'
    ? storiesWithAudio
    : storiesWithAudio.filter(s => s.entity_type === listenStoryFilter)

  const activeListenSubtext =
    LISTEN_CONTENT_SUBTEXT[listenContentType] ?? LISTEN_CONTENT_SUBTEXT['life-vision']

  const showListenSecondary =
    (listenContentType === 'life-vision' && allVisions.length > 1) || listenContentType === 'stories'

  return (
    <div className="w-full sm:max-w-2xl sm:mx-auto">
      <div
        className="w-full rounded-2xl bg-zinc-950/90 ring-1 ring-inset ring-white/[0.08]"
        role="region"
        aria-label="Listen content"
      >
        <nav
          className="grid w-full grid-cols-3 border-b border-white/[0.06] p-0.5 sm:p-1"
          aria-label="What to play"
        >
          {CONTENT_TYPES.map(ct => {
            const isActive = listenContentType === ct.value
            const ContentIcon = ct.icon
            return (
              <button
                key={ct.value}
                type="button"
                onClick={() => {
                  setListenContentType(ct.value)
                  closeAll()
                }}
                className={`min-w-0 ${SEGMENT_BASE} ${
                  isActive
                    ? 'max-sm:rounded-full sm:rounded-xl bg-zinc-800/95 text-primary-400 shadow-sm'
                    : 'rounded-xl text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
                }`}
                aria-pressed={isActive}
                title={ct.label}
              >
                <ContentIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
                <span className="sr-only sm:not-sr-only sm:inline sm:min-w-0 sm:truncate">
                  {ct.label}
                </span>
              </button>
            )
          })}
        </nav>
        <div className="bg-zinc-950/40 px-3 py-2.5 sm:py-3">
          <p className="text-center text-sm font-semibold text-white sm:hidden">
            {activeContentObj.label}
          </p>
          <p className="mt-1 text-center text-[12px] leading-relaxed text-balance text-zinc-400 sm:mt-0 sm:text-[13px] sm:leading-normal">
            {activeListenSubtext}
          </p>
        </div>

        {showListenSecondary && (
          <div className="border-t border-white/[0.08] bg-zinc-950/60 px-3 py-2.5 sm:py-3">
            {listenContentType === 'life-vision' && allVisions.length > 1 && (
              <div className="relative z-20 w-full" ref={secondaryRef}>
                <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-3">
                  <p className="text-center text-[10px] font-medium uppercase tracking-wide text-zinc-500 md:shrink-0 md:whitespace-nowrap md:py-0.5 md:text-left">
                    Vision version
                  </p>
                  <div className="relative min-w-0 w-full md:flex-1">
                    <button
                      type="button"
                      onClick={() => { setSecondaryOpen(prev => !prev) }}
                      className={`${BTN} w-full md:min-w-0`}
                    >
                      <span className="text-xs text-white font-medium flex-1 truncate">{currentVisionLabel}</span>
                      {vision?.is_active && (
                        <span className="text-[10px] font-semibold text-[#39FF14] bg-[#39FF14]/10 px-1.5 py-0.5 rounded flex-shrink-0">Active</span>
                      )}
                      <ChevronDown className={`w-3.5 h-3.5 md:w-3 md:h-3 text-neutral-400 transition-transform flex-shrink-0 ${secondaryOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {secondaryOpen && (
                      <div className="absolute left-0 right-0 top-full z-[100] mt-1.5 max-h-64 min-w-0 w-full overflow-y-auto rounded-xl border border-neutral-700 bg-[#1A1A1A] py-1 shadow-2xl">
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
                            <p
                              className={`text-sm md:text-xs ${
                                isSelected ? 'text-white' : 'text-neutral-300'
                              }`}
                            >
                              <span className="font-medium">Version {v.version_number}</span>
                              <span className="whitespace-nowrap text-[10px] font-normal text-neutral-500">
                                {' \u00B7 '}
                                {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
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
                </div>
              </div>
            )}

            {listenContentType === 'stories' && (
              <div className="relative z-20 w-full" ref={secondaryRef}>
                <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-3">
                  <p className="text-center text-[10px] font-medium uppercase tracking-wide text-zinc-500 md:shrink-0 md:whitespace-nowrap md:py-0.5 md:text-left">
                    Story type
                  </p>
                  <div className="relative min-w-0 w-full md:flex-1">
                    <button
                      type="button"
                      onClick={() => { setSecondaryOpen(prev => !prev) }}
                      className={`${BTN} w-full md:min-w-0`}
                    >
                      <ActiveSourceIcon className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#39FF14] flex-shrink-0" />
                      <span className="text-xs text-white font-medium flex-1">{activeSourceObj.label}</span>
                      <span className="text-[10px] text-neutral-500 flex-shrink-0">{filteredByType.length}</span>
                      <ChevronDown className={`w-3.5 h-3.5 md:w-3 md:h-3 text-neutral-400 transition-transform flex-shrink-0 ${secondaryOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {secondaryOpen && (
                      <div className="absolute left-0 right-0 top-full z-[100] mt-1.5 min-w-0 w-full rounded-xl border border-neutral-700 bg-[#1A1A1A] py-1 shadow-2xl">
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
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function CreateSecondaryNav() {
  const pathname = usePathname()
  const { activeBatchCount } = useAudioStudio()
  const activeCreateTool = SECONDARY_TABS.find(
    t => pathname === t.path || pathname.startsWith(t.path + '/')
  )
  const createToolSubtext = activeCreateTool
    ? CREATE_TOOL_SUBTEXT[activeCreateTool.path] ?? null
    : null

  const segmentLinks = SECONDARY_TABS.map(tab => {
    const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/')
    const TabIcon = tab.icon
    const isQueue = tab.path === '/audio/queue'
    return (
      <Link
        key={tab.path}
        href={tab.path}
        title={tab.label}
        className={`${SEGMENT_BASE} ${
          isActive
            ? 'max-sm:rounded-full sm:rounded-xl bg-zinc-800/95 text-primary-400 shadow-sm'
            : 'rounded-xl text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        <TabIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
        <span className="sr-only sm:not-sr-only sm:inline sm:min-w-0 sm:truncate">
          {tab.label}
        </span>
        {isQueue && activeBatchCount > 0 && (
          <span
            className="flex h-3.5 min-w-[0.95rem] shrink-0 items-center justify-center rounded-full bg-primary-500 px-0.5 text-[9px] font-bold text-black"
            aria-label={`${activeBatchCount} in queue`}
          >
            {activeBatchCount}
          </span>
        )}
      </Link>
    )
  })

  const tabRow = (
    <nav
      className="flex w-full p-0.5 sm:p-1 rounded-2xl bg-zinc-950/90 ring-1 ring-inset ring-white/[0.08] sm:max-w-2xl sm:mx-auto"
      aria-label="Create tools"
    >
      {segmentLinks}
    </nav>
  )

  if (!activeCreateTool || !createToolSubtext) {
    return <div className="w-full sm:px-0">{tabRow}</div>
  }

  // Single card: segment bar + title (mobile) + hint share one rounded-2xl shell; tab labels are sr-only under sm.
  return (
    <div
      className="w-full overflow-hidden rounded-2xl bg-zinc-950/90 ring-1 ring-inset ring-white/[0.08] sm:max-w-2xl sm:mx-auto"
      role="region"
      aria-label="What to do on this page"
    >
      <nav
        className="flex w-full border-b border-white/[0.06] p-0.5 sm:p-1"
        aria-label="Create tools"
      >
        {segmentLinks}
      </nav>
      <div className="bg-zinc-950/40 px-3 py-2.5 sm:py-3">
        <p className="text-center text-sm font-semibold text-white sm:hidden">
          {activeCreateTool.label}
        </p>
        <p className="mt-1 text-center text-[12px] leading-relaxed text-balance text-zinc-400 sm:mt-0 sm:text-[13px] sm:leading-normal">
          {createToolSubtext}
        </p>
      </div>
    </div>
  )
}

export function AudioAreaBar() {
  const pathname = usePathname()

  const isListen = pathname === '/audio' || pathname === '/audio/'
  const isCreateArea = CREATE_AREA_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))

  let contextBar: React.ReactNode = undefined
  if (isListen) {
    contextBar = <ListenFilterBar />
  } else if (isCreateArea) {
    contextBar = <CreateSecondaryNav />
  }

  const isOnSecondaryPage = SECONDARY_TABS.some(t => pathname === t.path || pathname.startsWith(t.path + '/'))

  return (
    <AreaBar
      area={{ name: 'Audio Studio', icon: Headphones }}
      tabs={TABS}
      contextBar={contextBar}
      keepTabActive={!isOnSecondaryPage}
      activeParentPath={isOnSecondaryPage ? '/audio/create' : undefined}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
