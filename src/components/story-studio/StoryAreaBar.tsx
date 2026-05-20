'use client'

import { useRouter } from 'next/navigation'
import { Library, PenLine, RefreshCw, Target, Image, BookOpen, Lightbulb, FileText } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar, type AreaBarVersionSelector } from '@/lib/design-system/components'
import { useStoryStudio } from './StoryStudioContext'
import type { Story } from '@/lib/stories/types'
import { useState, useEffect } from 'react'

const TABS = [
  { label: 'All Stories', path: '/story', icon: Library },
  { label: 'Create', path: '/story/new', icon: PenLine },
  { label: 'Update', path: '/story/update', icon: RefreshCw },
]

const SOURCE_FILTERS = [
  { label: 'All Types', value: 'all', icon: Library },
  { label: 'Life Vision', value: 'life_vision', icon: Target },
  { label: 'Vision Board', value: 'vision_board_item', icon: Image },
  { label: 'Journal', value: 'journal_entry', icon: BookOpen },
  { label: 'Custom', value: 'custom', icon: Lightbulb },
]

const ENTITY_ICONS: Record<string, typeof Target> = {
  life_vision: Target,
  vision_board_item: Image,
  journal_entry: BookOpen,
  custom: Lightbulb,
}

export function StoryAreaBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { stories, updateTargetId, setUpdateTargetId } = useStoryStudio()

  const isStoryList = pathname === '/story' || pathname === '/story/'
  const isStoryDetail = !isStoryList && pathname !== '/story/new' && pathname !== '/story/update' && /^\/story\/[^/]+$/.test(pathname)
  const isUpdatePage = pathname === '/story/update' || pathname === '/story/update/'

  const currentStoryId = isStoryDetail ? (pathname.split('/').pop() || '') : ''
  const currentStory = stories.find(s => s.id === currentStoryId)

  const [activeFilter, setActiveFilter] = useState(currentStory?.entity_type || 'all')

  useEffect(() => {
    if (currentStory) setActiveFilter(currentStory.entity_type)
  }, [currentStory])

  // For the update page, select the first completed story by default
  useEffect(() => {
    if (isUpdatePage && !updateTargetId && stories.length > 0) {
      const completed = stories.find(s => s.status === 'completed')
      if (completed) setUpdateTargetId(completed.id)
    }
  }, [isUpdatePage, stories, updateTargetId, setUpdateTargetId])

  const showSelector = isStoryDetail || isUpdatePage

  let versionSelectors: AreaBarVersionSelector[] | undefined

  if (showSelector) {
    const filteredByType = activeFilter === 'all'
      ? stories
      : stories.filter(s => s.entity_type === activeFilter)

    const selectorStoryId = isUpdatePage ? (updateTargetId || '') : currentStoryId
    const selectorStory = stories.find(s => s.id === selectorStoryId)

    versionSelectors = [
      {
        id: 'story-type',
        label: 'Type',
        icon: SOURCE_FILTERS.find(f => f.value === activeFilter)?.icon || Library,
        position: 'contextRow',
        options: SOURCE_FILTERS.map(filter => ({
          id: filter.value,
          label: filter.label,
          icon: filter.icon,
          count: filter.value === 'all'
            ? stories.length
            : stories.filter(s => s.entity_type === filter.value).length,
        })),
        selectedId: activeFilter,
        onSelect: (value: string) => setActiveFilter(value),
      },
      {
        id: 'story-selector',
        label: 'Story',
        icon: selectorStory ? (ENTITY_ICONS[selectorStory.entity_type] || FileText) : FileText,
        position: 'contextRow',
        searchable: true,
        options: filteredByType
          .filter(s => s.status === 'completed')
          .map(story => ({
            id: story.id,
            label: story.title || 'Untitled Story',
            sublabel: `${story.word_count ? `${story.word_count.toLocaleString()} words · ` : ''}${new Date(story.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            icon: ENTITY_ICONS[story.entity_type] || FileText,
            badge: story.pending_content ? 'Pending' : undefined,
            badgeVariant: story.pending_content ? ('draft' as const) : undefined,
          })),
        selectedId: selectorStoryId,
        onSelect: (id: string) => {
          if (isUpdatePage) {
            setUpdateTargetId(id)
          } else if (id !== currentStoryId) {
            router.push(`/story/${id}`)
          }
        },
      },
    ]
  }

  return (
    <AreaBar
      area={{ name: 'My Stories', icon: Library }}
      tabs={TABS}
      versionSelectors={versionSelectors}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
