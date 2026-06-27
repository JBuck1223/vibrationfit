'use client'

import { useEffect } from 'react'

/**
 * Catches errors in the root layout itself. Must render its own <html>/<body>
 * and avoid importing the design system so it still loads when the app shell fails.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global error boundary]', error.message, error.digest ?? '', error.stack)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            color: '#fff',
            padding: '4rem 1rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '28rem',
              borderRadius: '1rem',
              border: '1px solid #333',
              background: '#141414',
              padding: '2rem',
            }}
          >
            <h1 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Something went wrong</h1>
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#a3a3a3' }}>
              We hit an unexpected snag loading the app. Please try again.
            </p>
            {error.digest ? (
              <p style={{ marginTop: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#525252' }}>
                Reference: {error.digest}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => reset()}
              style={{
                marginTop: '2rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                background: '#39FF14',
                color: '#000',
                padding: '0.625rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
