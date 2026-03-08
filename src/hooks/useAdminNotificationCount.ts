'use client'

import { useState, useEffect, useCallback } from 'react'

const POLL_INTERVAL_MS = 30_000

export function useAdminNotificationCount(enabled: boolean = true) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications/unread-count')
      if (res.ok) {
        const data = await res.json()
        setCount(data.count ?? 0)
      }
    } catch {
      // Silently fail -- admin bell badge is non-critical
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [enabled, refresh])

  return { count, refresh }
}
