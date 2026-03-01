'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

const LOG_PREFIX = '[VibrationFit Global Error]'

/** Last captured error for debugging (e.g. in console or copy-paste) */
let lastGlobalError: { message: string; stack?: string; type: string } | null = null

export function getLastGlobalError() {
  return lastGlobalError
}

export function GlobalErrorCapture() {
  const [banner, setBanner] = useState<{
    message: string
    detail?: string
    type: 'error' | 'rejection'
  } | null>(null)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const message = event.message || 'Unknown error'
      const detail = event.error?.stack ?? event.filename ? `${event.filename}:${event.lineno}` : undefined
      lastGlobalError = { message, stack: event.error?.stack, type: 'error' }
      console.error(LOG_PREFIX, 'Uncaught error:', message, detail || '', event.error)
      setBanner({ message, detail, type: 'error' })
      return false
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason
      const message = err?.message ?? (typeof err === 'string' ? err : 'Unhandled promise rejection')
      const detail = err?.stack
      lastGlobalError = { message, stack: err?.stack, type: 'rejection' }
      console.error(LOG_PREFIX, 'Unhandled rejection:', message, detail || '', err)
      setBanner({ message, detail, type: 'rejection' })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  if (!banner) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[99998] max-w-lg mx-auto rounded-xl border-2 border-red-500/40 bg-red-500/15 p-4 shadow-xl"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-200">
            Something went wrong. Check the browser console for details.
          </p>
          <p className="mt-1 text-xs text-neutral-400 truncate" title={banner.message}>
            {banner.message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBanner(null)}
          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
