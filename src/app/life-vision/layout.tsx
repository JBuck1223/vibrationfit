'use client'

import React from 'react'
import { LifeVisionStudioProvider } from '@/components/life-vision-studio/LifeVisionStudioContext'
import { LifeVisionAreaBar } from '@/components/life-vision-studio/LifeVisionAreaBar'

export default function LifeVisionLayout({ children }: { children: React.ReactNode }) {
  return (
    <LifeVisionStudioProvider>
      <div className="min-h-screen flex flex-col bg-black">
        <LifeVisionAreaBar />
        <main className="flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0">
          {children}
        </main>
      </div>
    </LifeVisionStudioProvider>
  )
}
