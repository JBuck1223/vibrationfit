'use client'

import {
  Headphones, Wand2,
  Target, Library, Music2, ListMusic,
  AudioLines, Mic, Sliders, Clock,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar, type AreaBarContextNavItem, type AreaBarVersionSelector } from '@/lib/design-system/components'
import { useAudioStudio } from './AudioStudioContext'

const TABS = [
  { label: 'Listen', path: '/audio', icon: Headphones },
  { label: 'Create', path: '/audio/create', icon: Wand2 },
]

const CREATE_AREA_ROUTES = ['/audio/create', '/audio/songwriter', '/audio/generate', '/audio/mix', '/audio/record', '/audio/queue']

const SECONDARY_TABS = [
  { label: 'Generate', path: '/audio/generate', icon: AudioLines },
  { label: 'Record', path: '/audio/record', icon: Mic },
  { label: 'Mix', path: '/audio/mix', icon: Sliders },
  { label: 'Songwriter', path: '/audio/songwriter', icon: Music2 },
  { label: 'Queue', path: '/audio/queue', icon: Clock },
]

const CONTENT_TYPES = [
  { value: 'life-vision', label: 'Life Vision', icon: Target, path: '/audio' },
  { value: 'stories', label: 'Stories', icon: Library, path: '/audio/stories' },
  { value: 'music', label: 'Music', icon: Music2, path: '/audio/music' },
  { value: 'playlists', label: 'Playlists', icon: ListMusic, path: '/audio/playlists' },
  { value: 'songs', label: 'My Songs', icon: Music2, path: '/audio/songs' },
]

const LISTEN_AREA_ROUTES = ['/audio', '/audio/stories', '/audio/songs', '/audio/music', '/audio/playlists']

const LISTEN_CONTENT_SUBTEXT: Record<string, string> = {
  'life-vision': 'Play your Life Vision audio sets and voice recordings.',
  'stories': 'Play narrated audio from your completed stories.',
  'songs': 'Play your VIVA-generated songs.',
  'music': 'Stream Vibration Fit original music on your favorite platform.',
  'playlists': 'Play and manage your custom playlists.',
}

const CREATE_TOOL_SUBTEXT: Record<string, string> = {
  '/audio/songwriter':
    'Create original songs powered by VIVA.',
  '/audio/generate':
    'Generate VIVA narration of your Life Vision or Story.',
  '/audio/record':
    'Read your Life Vision or Story aloud and create a personal voice recording.',
  '/audio/mix':
    'Add background music and binaural beats to your existing voice tracks.',
  '/audio/queue':
    'Track the progress of your audio generation and mixing jobs.',
}

const SOURCE_FILTERS = [
  { label: 'All Types', value: 'all', icon: Library },
  { label: 'Life Vision', value: 'life_vision', icon: Target },
  { label: 'Vision Board', value: 'vision_board_item' },
  { label: 'Journal', value: 'journal_entry' },
  { label: 'Custom', value: 'custom' },
]

export function AudioAreaBar() {
  const pathname = usePathname()
  const {
    listenContentType,
    listenStoryFilter, setListenStoryFilter,
    vision, allVisions, switchVision,
    storiesWithAudio,
    activeBatchCount,
  } = useAudioStudio()

  const isListen = LISTEN_AREA_ROUTES.some(r => pathname === r || pathname === r + '/')
  const isCreateArea = CREATE_AREA_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isOnSecondaryPage = SECONDARY_TABS.some(t => pathname === t.path || pathname.startsWith(t.path + '/'))

  let contextNav: AreaBarContextNavItem[] | undefined
  let contextText: string | undefined
  let versionSelectors: AreaBarVersionSelector[] | undefined

  if (isListen) {
    contextNav = CONTENT_TYPES.map(ct => ({
      label: ct.label,
      icon: ct.icon,
      path: ct.path,
      isActive: listenContentType === ct.value,
    }))

    contextText = LISTEN_CONTENT_SUBTEXT[listenContentType] ?? LISTEN_CONTENT_SUBTEXT['life-vision']

    // Version selectors depend on content type
    if (listenContentType === 'life-vision' && allVisions.length > 1) {
      versionSelectors = [{
        id: 'listen-vision',
        label: 'Vision version',
        position: 'contextRow',
        options: allVisions.map(v => ({
          id: v.id,
          label: `Version ${v.version_number}`,
          sublabel: new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          badge: v.is_active ? 'Active' : undefined,
          isActive: v.is_active,
        })),
        selectedId: vision?.id || '',
        onSelect: (id: string) => switchVision(id),
      }]
    } else if (listenContentType === 'stories') {
      const filteredByType = listenStoryFilter === 'all'
        ? storiesWithAudio
        : storiesWithAudio.filter(s => s.entity_type === listenStoryFilter)

      versionSelectors = [{
        id: 'listen-story-filter',
        label: 'Type',
        icon: SOURCE_FILTERS.find(f => f.value === listenStoryFilter)?.icon || Library,
        position: 'contextRow',
        options: SOURCE_FILTERS.map(filter => ({
          id: filter.value,
          label: filter.label,
          icon: filter.icon,
          count: filter.value === 'all'
            ? storiesWithAudio.length
            : storiesWithAudio.filter(s => s.entity_type === filter.value).length,
        })),
        selectedId: listenStoryFilter,
        onSelect: (value: string) => setListenStoryFilter(value),
      }]
    }
  } else if (isCreateArea) {
    // Context Nav: create tool tabs (links)
    contextNav = SECONDARY_TABS.map(tab => {
      const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/')
      return {
        label: tab.label,
        path: tab.path,
        icon: tab.icon,
        isActive,
        badge: tab.path === '/audio/queue' && activeBatchCount > 0 ? (
          <span
            className="mt-0.5 flex h-3.5 min-w-[0.95rem] shrink-0 items-center justify-center rounded-full bg-primary-500 px-0.5 text-[9px] font-bold text-black sm:ml-0 sm:mt-0"
            aria-label={`${activeBatchCount} in queue`}
          >
            {activeBatchCount}
          </span>
        ) : undefined,
      }
    })

    const activeCreateTool = SECONDARY_TABS.find(
      t => pathname === t.path || pathname.startsWith(t.path + '/')
    )
    if (pathname === '/audio/create' || pathname === '/audio/create/') {
      contextText = 'Choose a creation flow to get started.'
    } else if (activeCreateTool) {
      contextText = CREATE_TOOL_SUBTEXT[activeCreateTool.path]
    }
  }

  const isListenSubPage = isListen && pathname !== '/audio' && pathname !== '/audio/'
  const needsParentHighlight = isOnSecondaryPage || isListenSubPage

  return (
    <AreaBar
      area={{ name: 'Audio Studio', icon: Headphones }}
      tabs={TABS}
      contextNav={contextNav}
      contextText={contextText}
      versionSelectors={versionSelectors}
      keepTabActive={!isOnSecondaryPage}
      activeParentPath={isOnSecondaryPage ? '/audio/create' : isListenSubPage ? '/audio' : undefined}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
