'use client'

import React, { Suspense } from 'react'
import { AudioStudioProvider } from '@/components/audio-studio/AudioStudioContext'
import { AudioAreaBar } from '@/components/audio-studio/AudioAreaBar'
import { AudioStudioPlayer } from '@/components/audio-studio/AudioStudioPlayer'

export default function AudioStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AudioStudioProvider>
        <div className="min-h-screen flex flex-col bg-black">
          <AudioAreaBar />
          <main className="flex-1 pb-24">
            {children}
          </main>
          <AudioStudioPlayer />
        </div>
      </AudioStudioProvider>
    </Suspense>
  )
}
