'use client'

import React, { Suspense } from 'react'
import { AudioStudioProvider } from '@/components/audio-studio/AudioStudioContext'
import { AudioAreaBar } from '@/components/audio-studio/AudioAreaBar'

export default function AudioStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AudioStudioProvider>
        <div className="min-h-screen flex flex-col bg-black">
          <AudioAreaBar />
          <main className="flex-1 pb-20">
            {children}
          </main>
        </div>
      </AudioStudioProvider>
    </Suspense>
  )
}
