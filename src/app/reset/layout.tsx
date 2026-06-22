'use client'

import React, { Suspense } from 'react'
import { ResetStudioProvider, ResetAreaBar } from '@/components/reset-studio'

export default function ResetStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <ResetStudioProvider>
      <Suspense fallback={null}>
        <ResetAreaBar />
      </Suspense>
      <main
        className="flex-1 min-w-0 overflow-x-hidden pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </ResetStudioProvider>
  )
}
