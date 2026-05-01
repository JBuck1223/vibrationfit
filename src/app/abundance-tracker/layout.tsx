import { Metadata } from 'next'
import React from 'react'
import { AbundanceAreaBar } from '@/components/abundance-tracker/AbundanceAreaBar'

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
        className="flex-1 px-4 pb-3 pt-6 md:px-0 md:pb-3 md:pt-8 lg:pt-6"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </>
  )
}

