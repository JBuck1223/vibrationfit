'use client'

import React from 'react'
import { VisionBoardStudioProvider } from '@/components/vision-board-studio/VisionBoardStudioContext'
import { VisionBoardAreaBar } from '@/components/vision-board-studio/VisionBoardAreaBar'

export default function VisionBoardLayout({ children }: { children: React.ReactNode }) {
  return (
    <VisionBoardStudioProvider>
      <VisionBoardAreaBar />
      <main
        className="flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </VisionBoardStudioProvider>
  )
}
