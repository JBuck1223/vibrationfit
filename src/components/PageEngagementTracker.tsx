'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getPageType } from '@/lib/navigation/page-classifications'
import { reportPageEngaged, reportPageExit } from '@/lib/tracking/engagement'

// A visitor counts as "engaged" once they've actively spent this long on the
// page or scrolled this deep -- whichever comes first.
const DWELL_THRESHOLD_SECONDS = 15
const SCROLL_THRESHOLD_PERCENT = 50

/**
 * Measures dwell time (visible-tab time only) and max scroll depth on PUBLIC
 * marketing pages. Fires the PageEngaged pixel + CAPI event once per page when
 * the threshold is crossed, and beacons final dwell/scroll on exit so
 * page_views.time_on_page_seconds gets real numbers.
 *
 * Member app and admin pages are excluded -- ad platforms only need signals
 * from pages a campaign can land on.
 */
export function PageEngagementTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (getPageType(pathname) !== 'PUBLIC') return

    const eventId = crypto.randomUUID()
    let engaged = false
    let exited = false
    let maxScrollPercent = 0
    let accumulatedMs = 0
    let visibleSince: number | null = document.visibilityState === 'visible' ? Date.now() : null

    const dwellSeconds = () => {
      const live = visibleSince ? Date.now() - visibleSince : 0
      return Math.round((accumulatedMs + live) / 1000)
    }

    const measureScroll = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      if (scrollable <= 0) return
      const percent = Math.min(100, Math.round((window.scrollY / scrollable) * 100))
      if (percent > maxScrollPercent) maxScrollPercent = percent
    }

    const maybeEngage = () => {
      if (engaged || exited) return
      if (dwellSeconds() >= DWELL_THRESHOLD_SECONDS || maxScrollPercent >= SCROLL_THRESHOLD_PERCENT) {
        engaged = true
        reportPageEngaged(eventId, pathname, dwellSeconds(), maxScrollPercent)
      }
    }

    const onScroll = () => {
      measureScroll()
      maybeEngage()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (visibleSince) {
          accumulatedMs += Date.now() - visibleSince
          visibleSince = null
        }
        sendExit()
      } else if (!visibleSince) {
        visibleSince = Date.now()
        exited = false
      }
    }

    const sendExit = () => {
      if (exited) return
      exited = true
      reportPageExit(eventId, pathname, dwellSeconds(), maxScrollPercent, engaged)
    }

    const timer = window.setInterval(maybeEngage, 1000)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', sendExit)
    document.addEventListener('visibilitychange', onVisibilityChange)
    measureScroll()

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', sendExit)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      sendExit()
    }
  }, [pathname])

  return null
}
