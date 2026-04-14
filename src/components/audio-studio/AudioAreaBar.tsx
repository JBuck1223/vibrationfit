'use client'

import { Headphones, Heart, Wand2, Compass, BookOpen } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar } from '@/components/area-studio'
import type { AreaBarPill, ContextOption } from '@/components/area-studio'
import { useAudioStudio } from './AudioStudioContext'

const TABS = [
  { label: 'Activate', path: '/audio/ritual', icon: Heart },
  { label: 'Create', path: '/audio/create', icon: Wand2 },
  { label: 'Explore', path: '/audio/explore', icon: Compass },
  { label: 'Stories', path: '/story', icon: BookOpen },
]

const ACTIVATE_CREATE_PILLS: AreaBarPill[] = [
  { label: 'Life Vision', value: 'life-vision' },
  { label: 'Focus Stories', value: 'focus-stories' },
  { label: 'Music', value: 'music' },
]

export function AudioAreaBar() {
  const pathname = usePathname()
  const { vision, allVisions, switchVision, activePill, setActivePill } = useAudioStudio()

  const isExplore = pathname.startsWith('/audio/explore')
  const pills = isExplore ? undefined : ACTIVATE_CREATE_PILLS

  const contextSelector = allVisions.length > 0 && vision
    ? {
        label: 'Select Vision',
        options: allVisions.map((v): ContextOption => ({
          id: v.id,
          label: v.is_active ? 'Active Vision' : `Version ${v.version_number}`,
          sublabel: new Date(v.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          badge: `V${v.version_number}`,
          isActive: v.is_active,
        })),
        selectedId: vision.id,
        onSelect: switchVision,
      }
    : undefined

  return (
    <AreaBar
      area={{ name: 'Audio Studio', icon: Headphones }}
      tabs={TABS}
      pills={pills}
      activePill={activePill}
      onPillChange={setActivePill}
      contextSelector={contextSelector}
    />
  )
}
