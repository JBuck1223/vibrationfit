'use client'

import { useEffect } from 'react'

/** Keeps the screen on while `active`, re-acquiring after the tab returns. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      try {
        const next = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void next.release()
          return
        }
        sentinel = next
      } catch {
        // Denied or unsupported here; the session still runs.
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release().catch(() => {})
    }
  }, [active])
}
