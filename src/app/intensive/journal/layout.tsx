'use client'

import React from 'react'
import { JournalStudioProvider } from '@/components/journal-studio/JournalStudioContext'
import { IntensiveJournalAreaBar } from '@/components/intensive-studio/IntensiveJournalAreaBar'

export default function IntensiveJournalLayout({ children }: { children: React.ReactNode }) {
  return (
    <JournalStudioProvider>
      <IntensiveJournalAreaBar />
      <main
        className="min-w-0 flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </JournalStudioProvider>
  )
}
