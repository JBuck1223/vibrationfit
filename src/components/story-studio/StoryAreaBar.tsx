'use client'

import { BookOpen, Library, PenLine, Headphones } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar } from '@/components/area-studio'
import type { AreaBarPill } from '@/components/area-studio'
import { useStoryStudio } from './StoryStudioContext'

const TABS = [
  { label: 'My Stories', path: '/story', icon: Library },
  { label: 'Create', path: '/story/new', icon: PenLine },
  { label: 'Audio Studio', path: '/audio', icon: Headphones },
]

const MY_STORIES_PILLS: AreaBarPill[] = [
  { label: 'All', value: 'all' },
  { label: 'Life Vision', value: 'life_vision' },
  { label: 'Vision Board', value: 'vision_board_item' },
  { label: 'Journal', value: 'journal_entry' },
  { label: 'Custom', value: 'custom' },
]

export function StoryAreaBar() {
  const pathname = usePathname()
  const { activePill, setActivePill } = useStoryStudio()

  const isStoryList = pathname === '/story' || pathname === '/story/'
  const pills = isStoryList ? MY_STORIES_PILLS : undefined

  return (
    <AreaBar
      area={{ name: 'Story Studio', icon: BookOpen }}
      tabs={TABS}
      pills={pills}
      activePill={activePill}
      onPillChange={setActivePill}
    />
  )
}
