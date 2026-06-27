import type { Metadata } from 'next'
import React from 'react'
import { LifeVisionStudioProvider } from '@/components/life-vision-studio/LifeVisionStudioContext'
import { LifeVisionAreaBar } from '@/components/life-vision-studio/LifeVisionAreaBar'

export const metadata: Metadata = {
  title: {
    template: '%s | Life Vision',
    default: 'Life Vision',
  },
}

export default function LifeVisionLayout({ children }: { children: React.ReactNode }) {
  return (
    <LifeVisionStudioProvider>
      <LifeVisionAreaBar />
      <main
        className="flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </LifeVisionStudioProvider>
  )
}
