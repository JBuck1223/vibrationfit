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
          <main className="flex-1 pt-6 pb-3 md:pt-12 md:pb-3 lg:pt-8 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </AudioStudioProvider>
    </Suspense>
  )
}
