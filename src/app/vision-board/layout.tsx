'use client'

import React from 'react'
import { VisionBoardStudioProvider } from '@/components/vision-board-studio/VisionBoardStudioContext'
import { VisionBoardAreaBar } from '@/components/vision-board-studio/VisionBoardAreaBar'

export default function VisionBoardLayout({ children }: { children: React.ReactNode }) {
  return (
    <VisionBoardStudioProvider>
      <div className="min-h-screen flex flex-col bg-black">
        <VisionBoardAreaBar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </VisionBoardStudioProvider>
  )
}
