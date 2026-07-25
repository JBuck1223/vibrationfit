'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * App-wide TanStack Query provider.
 *
 * Defaults are tuned for "self-healing" freshness:
 * - staleTime 30s: queries refetch on remount/focus once older than 30s
 * - refetchOnWindowFocus: returning to the tab re-syncs visible data
 *
 * Precise, instant invalidation is handled by RealtimeInvalidationBridge,
 * which invalidates keys when the underlying Postgres tables change.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
