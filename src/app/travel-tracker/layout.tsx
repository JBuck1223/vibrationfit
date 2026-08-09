import { Metadata } from 'next'
import React from 'react'
import { TravelAreaBar } from '@/components/travel/TravelAreaBar'

export const metadata: Metadata = {
  title: 'Travel Tracker',
}

export default function TravelTrackerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <TravelAreaBar />
      <main
        className="flex-1 px-4 pb-3 pt-6 md:px-0 md:pb-3 md:pt-8 lg:pt-6"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </>
  )
}
