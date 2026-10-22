import { Metadata } from 'next'
import React from 'react'
import { AbundanceAreaBar } from '@/components/abundance-tracker/AbundanceAreaBar'
import { AbundanceHeader } from '@/components/app-shell/abundance/AbundanceHeader'

export const metadata: Metadata = {
  title: 'Abundance Tracker',
}

export default function AbundanceTrackerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AbundanceAreaBar />
      <main
        className="flex-1 px-4 pb-3 pt-6 md:px-0 md:pb-3 md:pt-8 lg:pt-6 [[data-app-shell]_&]:pt-0"
        data-studio-glass
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        <AbundanceHeader />
        {children}
      </main>
    </>
  )
}

