'use client'

import React from 'react'
import { StoryStudioProvider } from '@/components/story-studio/StoryStudioContext'
import { StoryAreaBar } from '@/components/story-studio/StoryAreaBar'

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoryStudioProvider>
      <StoryAreaBar />
      <main
        className="flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </StoryStudioProvider>
  )
}
