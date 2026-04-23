'use client'

import React from 'react'
import { JournalStudioProvider } from '@/components/journal-studio/JournalStudioContext'
import { JournalAreaBar } from '@/components/journal-studio/JournalAreaBar'

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return (
    <JournalStudioProvider>
      <div className="min-h-screen flex flex-col bg-black">
        <JournalAreaBar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </JournalStudioProvider>
  )
}
