import type { Metadata } from 'next'
import React from 'react'
import { AssessmentAreaBar } from '@/components/assessment-studio/AssessmentAreaBar'

export const metadata: Metadata = {
  title: {
    template: '%s | Assessment',
    default: 'Vibrational Assessment',
  },
}

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AssessmentAreaBar />
      <main
        className="flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </>
  )
}
