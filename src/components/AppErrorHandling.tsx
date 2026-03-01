'use client'

import React from 'react'
import { ErrorBoundaryWithReport } from '@/components/ErrorBoundaryWithReport'
import { GlobalErrorCapture } from '@/components/GlobalErrorCapture'

/**
 * Wraps the app with React error boundary (catches render/commit errors and shows
 * reportable details) and global error capture (catches uncaught errors and
 * unhandled promise rejections, shows a dismissable banner and logs with
 * [VibrationFit Global Error] prefix).
 * When the page freezes or breaks, check console for these prefixes to see why.
 */
export function AppErrorHandling({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ErrorBoundaryWithReport>
        {children}
      </ErrorBoundaryWithReport>
      <GlobalErrorCapture />
    </>
  )
}
