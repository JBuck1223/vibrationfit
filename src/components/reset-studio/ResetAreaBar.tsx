'use client'

import { usePathname } from 'next/navigation'
import { Flame, Eye, PenLine, LayoutGrid } from 'lucide-react'
import { AreaBar, type AreaBarContextNavItem } from '@/lib/design-system/components'
import { getVisionCategoryLabel, getVisionCategoryIcon } from '@/lib/design-system/vision-categories'
import { useResetStudio } from './ResetStudioContext'

const TABS = [
  { label: 'View', path: '/reset', icon: Eye },
  { label: 'Update', path: '/reset/update', icon: PenLine },
]

export function ResetAreaBar() {
  const pathname = usePathname()
  const { reset, focusFilter, setFocusFilter } = useResetStudio()
  const isViewTab = pathname === '/reset' || pathname === '/reset/'
  const isUpdateArea = pathname.startsWith('/reset/update')

  let contextNav: AreaBarContextNavItem[] | undefined
  let contextText: string | undefined

  if (isViewTab) {
    const focusCategories = reset?.focus_categories ?? []
    if (focusCategories.length > 0) {
      contextNav = [
        {
          label: 'All',
          onClick: () => setFocusFilter('all'),
          icon: LayoutGrid,
          isActive: focusFilter === 'all',
        },
        ...focusCategories.map((key) => ({
          label: getVisionCategoryLabel(key as any),
          onClick: () => setFocusFilter(key),
          icon: getVisionCategoryIcon(key as any),
          isActive: focusFilter === key,
        })),
      ]
    }
    contextText = 'Rise. Recommit to the life you choose.'
  } else if (isUpdateArea) {
    contextText = 'Choose what to recommit to and your focus areas.'
  }

  return (
    <AreaBar
      area={{ name: 'Reset', icon: Flame }}
      tabs={TABS}
      contextNav={contextNav}
      contextText={contextText}
      variant="default"
      appLikePrimaryTabs
      keepTabActive={isViewTab || isUpdateArea}
    />
  )
}
