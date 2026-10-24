import React from 'react'
import { DashboardAreaBar } from '@/components/dashboard/DashboardAreaBar'

export default function TrackingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardAreaBar />
      <main
        className="min-w-0 flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0 [[data-app-shell]_&]:pt-0"
        data-studio-glass
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </>
  )
}
