'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { initTracking, trackPageView, getVisitorId, getSessionId } from '@/lib/tracking/client'

interface TrackingContext {
  visitorId: string | null
  sessionId: string | null
  ready: boolean
}

const TrackingCtx = createContext<TrackingContext>({
  visitorId: null,
  sessionId: null,
  ready: false,
})

export function useTracking() {
  return useContext(TrackingCtx)
}

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const [ctx, setCtx] = useState<TrackingContext>({
    visitorId: null,
    sessionId: null,
    ready: false,
  })
  const pathname = usePathname()
  const initialised = useRef(false)
  const prevPathname = useRef<string | null>(null)

  useEffect(() => {
    if (initialised.current) return
    initialised.current = true

    initTracking().then(({ visitorId, sessionId }) => {
      setCtx({ visitorId, sessionId, ready: true })
    })
  }, [])

  useEffect(() => {
    if (!ctx.ready) return
    if (prevPathname.current === pathname) return
    if (prevPathname.current === null) {
      prevPathname.current = pathname
      return
    }
    prevPathname.current = pathname
    trackPageView(pathname, document.title)
  }, [pathname, ctx.ready])

  return <TrackingCtx.Provider value={ctx}>{children}</TrackingCtx.Provider>
}
