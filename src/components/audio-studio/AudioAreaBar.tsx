'use client'

import {
  Headphones, Wand2,
  Target, Library, Music2,
  AudioLines, Mic, Music, Clock,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar, type AreaBarContextNavItem, type AreaBarVersionSelector } from '@/lib/design-system/components'
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
    listenContentType, setListenContentType,
    listenStoryFilter, setListenStoryFilter,
    vision, allVisions, switchVision,
    storiesWithAudio,
    activeBatchCount,
  } = useAudioStudio()

  const isListen = pathname === '/audio' || pathname === '/audio/'
  const isCreateArea = CREATE_AREA_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isOnSecondaryPage = SECONDARY_TABS.some(t => pathname === t.path || pathname.startsWith(t.path + '/'))

  let contextNav: AreaBarContextNavItem[] | undefined
  let contextText: string | undefined
  let versionSelectors: AreaBarVersionSelector[] | undefined

  if (isListen) {
    // Context Nav: content type tabs (buttons, not links)
    contextNav = CONTENT_TYPES.map(ct => ({
      label: ct.label,
      icon: ct.icon,
      isActive: listenContentType === ct.value,
      onClick: () => setListenContentType(ct.value),
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
    if (activeCreateTool) {
      contextText = CREATE_TOOL_SUBTEXT[activeCreateTool.path]
    }
  }

  return (
    <AreaBar
      area={{ name: 'Audio Studio', icon: Headphones }}
      tabs={TABS}
      contextNav={contextNav}
      contextText={contextText}
      versionSelectors={versionSelectors}
      keepTabActive={!isOnSecondaryPage}
      activeParentPath={isOnSecondaryPage ? '/audio/create' : undefined}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
