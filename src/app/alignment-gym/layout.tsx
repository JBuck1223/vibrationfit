'use client'

import React from 'react'
import { Video } from 'lucide-react'
import { AreaBar } from '@/lib/design-system/components'
import type { AreaBarTab } from '@/lib/design-system/components'
import { useInShell } from '@/lib/app-shell/shell-context'

const TABS: AreaBarTab[] = [
  { label: 'Sessions', path: '/alignment-gym', icon: Video },
]

export default function AlignmentGymLayout({ children }: { children: React.ReactNode }) {
  // In the app shell the top bar already names the area; no second bar.
  const inShell = useInShell()
  return (
    <>
      {!inShell && <AreaBar
        area={{ name: 'The Alignment Gym', icon: Video }}
        tabs={TABS}
        contextText="Weekly live group coaching to keep you aligned with your Life Vision."
        variant="default"
        appLikePrimaryTabs
      />}
      <main
        className="flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0 [[data-app-shell]_&]:pt-0"
        data-studio-glass
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </>
  )
}
