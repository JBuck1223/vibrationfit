'use client'

import React, { Suspense } from 'react'
import { AudioStudioProvider } from '@/components/audio-studio/AudioStudioContext'
import { AudioAreaBar } from '@/components/audio-studio/AudioAreaBar'

export default function AudioStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AudioStudioProvider>
        <AudioAreaBar />
        <main
          className="flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
          style={{ '--content-px': '1rem' } as React.CSSProperties}
        >
          {children}
        </main>
      </AudioStudioProvider>
    </Suspense>
  )
}
