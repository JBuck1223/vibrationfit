'use client'

import React from 'react'
import { StoryStudioProvider } from '@/components/story-studio/StoryStudioContext'
import { StoryAreaBar } from '@/components/story-studio/StoryAreaBar'

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoryStudioProvider>
      <div className="min-h-screen flex flex-col bg-black">
        <StoryAreaBar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </StoryStudioProvider>
  )
}
