'use client'

import React from 'react'
import { Wind } from 'lucide-react'
import { AreaBar } from '@/lib/design-system/components'

export default function MeditationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AreaBar
        area={{ name: 'Meditations', icon: Wind }}
        tabs={[{ label: 'Breathe', path: '/meditations', icon: Wind }]}
        contextText="Pick a rhythm, add sound, and breathe with the wave."
        variant="default"
        appLikePrimaryTabs
      />
      <main
        className="flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </>
  )
}
