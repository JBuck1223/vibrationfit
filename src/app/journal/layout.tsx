import type { Metadata } from 'next'
import React from 'react'
import { JournalStudioProvider } from '@/components/journal-studio/JournalStudioContext'
import { JournalAreaBar } from '@/components/journal-studio/JournalAreaBar'

export const metadata: Metadata = {
  title: {
    template: '%s | Journal',
    default: 'Journal',
  },
}

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return (
    <JournalStudioProvider>
      <JournalAreaBar />
      <main
        className="min-w-0 flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </JournalStudioProvider>
  )
}
