'use client'

import React from 'react'
import { AudioStudioProvider } from '@/components/audio-studio/AudioStudioContext'
import { AudioStudioHeader } from '@/components/audio-studio/AudioStudioHeader'
import { AudioStudioPlayer } from '@/components/audio-studio/AudioStudioPlayer'

export default function AudioStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <AudioStudioProvider>
      <div className="min-h-screen flex flex-col bg-black">
        <AudioStudioHeader />
        <main className="flex-1 pb-24">
          {children}
        </main>
        <AudioStudioPlayer />
      </div>
    </AudioStudioProvider>
  )
}
