'use client'

import { getVisitorId, getSessionId } from './client'
import { trackVideoMilestone, trackVideoLifecycle, trackPageEngaged } from './pixels'

/**
 * Client-side engagement reporting.
 *
 * Every event: (1) fires the browser pixel with an eventID, and (2) beacons
 * the same payload + eventId to /api/tracking/events, which records it in
 * engagement_events and mirrors it to Meta CAPI / GA4 server-side. Meta
 * deduplicates on the shared ID, so signal survives ad blockers and iOS
 * without double counting.
 */

interface EventPayload {
  eventName: 'page_engagement' | 'video_start' | 'video_milestone' | 'video_complete'
  eventId: string
  pagePath?: string
  videoId?: string
  milestonePercent?: 25 | 50 | 75 | 95
  watchTimeSeconds?: number
  dwellSeconds?: number
  scrollDepthPercent?: number
  engaged?: boolean
}

function sendEvent(payload: EventPayload, useBeacon = false) {
  if (typeof window === 'undefined') return

  const body = JSON.stringify({
    ...payload,
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    pagePath: payload.pagePath ?? window.location.pathname,
  })

  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon('/api/tracking/events', new Blob([body], { type: 'application/json' }))
    return
  }

  fetch('/api/tracking/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // silent -- tracking must never break the page
  })
}

// One video_start per video per page load
const startedVideos = new Set<string>()

export function reportVideoStart(videoId: string) {
  if (startedVideos.has(videoId)) return
  startedVideos.add(videoId)

  const eventId = crypto.randomUUID()
  trackVideoLifecycle(videoId, 'start', eventId)
  sendEvent({ eventName: 'video_start', eventId, videoId })
}

export function reportVideoMilestone(
  videoId: string,
  milestone: 25 | 50 | 75 | 95,
  watchTimeSeconds: number
) {
  const eventId = crypto.randomUUID()
  trackVideoMilestone(videoId, milestone, watchTimeSeconds, eventId)
  sendEvent({
    eventName: 'video_milestone',
    eventId,
    videoId,
    milestonePercent: milestone,
    watchTimeSeconds,
  })
}

export function reportVideoComplete(videoId: string) {
  const eventId = crypto.randomUUID()
  trackVideoLifecycle(videoId, 'complete', eventId)
  sendEvent({ eventName: 'video_complete', eventId, videoId })
}

/**
 * Fired by PageEngagementTracker when the visitor crosses the engagement
 * threshold. Browser pixel + server mirror share the eventId.
 */
export function reportPageEngaged(
  eventId: string,
  pagePath: string,
  dwellSeconds: number,
  scrollDepthPercent: number
) {
  trackPageEngaged(
    { page_path: pagePath, dwell_seconds: dwellSeconds, scroll_depth_percent: scrollDepthPercent },
    eventId
  )
  sendEvent({
    eventName: 'page_engagement',
    eventId,
    pagePath,
    dwellSeconds,
    scrollDepthPercent,
    engaged: true,
  })
}

/**
 * Final measurement beacon on page exit. If the threshold event already fired
 * (same eventId), the server just updates dwell/scroll on the existing row.
 * If not (a bounce), it records a non-engaged row -- no pixel event fires.
 */
export function reportPageExit(
  eventId: string,
  pagePath: string,
  dwellSeconds: number,
  scrollDepthPercent: number,
  wasEngaged: boolean
) {
  sendEvent(
    {
      eventName: 'page_engagement',
      eventId,
      pagePath,
      dwellSeconds,
      scrollDepthPercent,
      engaged: wasEngaged,
    },
    true
  )
}
