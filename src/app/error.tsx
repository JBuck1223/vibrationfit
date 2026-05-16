'use client'

import { useEffect } from 'react'

/**
 * Root error UI must stay minimal: avoid importing the design system here so this
 * bundle still loads if another client module fails (prevents cascading 404/hydration issues).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[App error boundary]', error.message, error.digest ?? '', error.stack)
  }, [error])

  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center bg-black px-4 py-16 text-white"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#333] bg-[#141414] p-8 text-center">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-3 text-sm text-neutral-400">{error.message || 'An unexpected error occurred.'}</p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-neutral-600">Reference: {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[#39FF14] px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
