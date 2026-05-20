'use client'

import React from 'react'
import { IntensiveStepBar } from '@/components/intensive-studio/IntensiveStepBar'
import { MapStudioProvider } from '@/components/map-studio/MapStudioContext'

export default function IntensiveMapLayout({ children }: { children: React.ReactNode }) {
  return (
    <MapStudioProvider>
      <IntensiveStepBar />
      <main
        className="flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </MapStudioProvider>
  )
}
