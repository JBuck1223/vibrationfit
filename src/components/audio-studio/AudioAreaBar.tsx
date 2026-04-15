'use client'

import { Headphones, Wand2, Compass } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar } from '@/components/area-studio'
import type { AreaBarPill, ContextOption } from '@/components/area-studio'
import { useAudioStudio } from './AudioStudioContext'

const TABS = [
  { label: 'Listen', path: '/audio', icon: Headphones },
  { label: 'Create', path: '/audio/create', icon: Wand2 },
  { label: 'Explore', path: '/audio/explore', icon: Compass },
]

const PILLS: AreaBarPill[] = [
  { label: 'Life Vision', value: 'life-vision' },
  { label: 'Focus Stories', value: 'focus-stories' },
  { label: 'Music', value: 'music' },
]

export function AudioAreaBar() {
  const pathname = usePathname()
  const { vision, allVisions, switchVision, activePill, setActivePill } = useAudioStudio()

  const isExplore = pathname.startsWith('/audio/explore')
  const pills = isExplore ? undefined : PILLS

  const showVisionSelector = activePill === 'life-vision'

  const contextSelector = showVisionSelector && allVisions.length > 0 && vision
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
