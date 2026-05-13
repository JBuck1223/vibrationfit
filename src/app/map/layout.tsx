'use client'

import React from 'react'
import { MapStudioProvider } from '@/components/map-studio/MapStudioContext'
import { MapAreaBar } from '@/components/map-studio/MapAreaBar'

export default function MapStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <MapStudioProvider>
      <MapAreaBar />
      <main
        className="flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </MapStudioProvider>
  )
}
