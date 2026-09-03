import type { Metadata } from 'next'
import React from 'react'
import { ManifestationsStudioProvider } from '@/components/manifestations-studio/ManifestationsStudioContext'
import { ManifestationsAreaBar } from '@/components/manifestations-studio/ManifestationsAreaBar'

export const metadata: Metadata = {
  title: {
    template: '%s | Manifestations',
    default: 'Manifestations',
  },
}

export default function ManifestationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ManifestationsStudioProvider>
      <ManifestationsAreaBar />
      <main
        className="min-w-0 flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </ManifestationsStudioProvider>
  )
}
