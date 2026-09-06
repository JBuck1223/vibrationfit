'use client'

import { DailyPaperAreaBar } from '@/components/daily-paper-studio/DailyPaperAreaBar'
import { StudioLifeActivationBanner } from '@/components/life-activation/StudioLifeActivationBanner'

export function DailyPaperShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DailyPaperAreaBar />
      <main
        className="flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        <StudioLifeActivationBanner />
        {children}
      </main>
    </>
  )
}
