'use client'

import React from 'react'
import { LifeVisionStudioProvider } from '@/components/life-vision-studio/LifeVisionStudioContext'
import { LifeVisionAreaBar } from '@/components/life-vision-studio/LifeVisionAreaBar'

export default function LifeVisionLayout({ children }: { children: React.ReactNode }) {
  return (
    <LifeVisionStudioProvider>
      <div className="min-h-screen flex flex-col bg-black">
        <LifeVisionAreaBar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </LifeVisionStudioProvider>
  )
}
