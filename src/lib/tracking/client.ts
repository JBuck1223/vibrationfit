'use client'

const VISITOR_COOKIE = 'vf_visitor_id'
const SESSION_COOKIE = 'vf_session_id'
const VISITOR_TTL_DAYS = 365
const SESSION_TTL_MINUTES = 30

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 86400000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export function getVisitorId(): string | null {
  return getCookie(VISITOR_COOKIE)
}

export function getSessionId(): string | null {
  return getCookie(SESSION_COOKIE)
}

function extractUrlParams(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const params: Record<string, string> = {}
  new URLSearchParams(window.location.search).forEach((value, key) => {
    params[key] = value
  })
  return params
}

function getDeviceInfo() {
  if (typeof navigator === 'undefined') return {}
  const ua = navigator.userAgent
  let deviceType = 'desktop'
  if (/Mobi|Android/i.test(ua)) deviceType = 'mobile'
  else if (/Tablet|iPad/i.test(ua)) deviceType = 'tablet'

  let browser = 'unknown'
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = 'Chrome'
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = 'Safari'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Edg\//.test(ua)) browser = 'Edge'

  let os = 'unknown'
  if (/Mac OS X/.test(ua)) os = 'macOS'
  else if (/Windows/.test(ua)) os = 'Windows'
  else if (/Linux/.test(ua)) os = 'Linux'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/iPhone|iPad/.test(ua)) os = 'iOS'

  return { deviceType, browser, os }
}

export interface TrackingIds {
  visitorId: string
  sessionId: string
  isNewVisitor: boolean
  isNewSession: boolean
}

export async function initTracking(): Promise<TrackingIds> {
  let visitorId = getCookie(VISITOR_COOKIE)
  const isNewVisitor = !visitorId
  if (!visitorId) {
    visitorId = crypto.randomUUID()
    setCookie(VISITOR_COOKIE, visitorId, VISITOR_TTL_DAYS)
  }

  let sessionId = getCookie(SESSION_COOKIE)
  const urlParams = extractUrlParams()
  const hasNewAttribution = !!urlParams['utm_source'] || !!urlParams['gclid'] || !!urlParams['fbclid']
  const isNewSession = !sessionId || hasNewAttribution

  if (isNewSession) {
    sessionId = crypto.randomUUID()
  }
  setCookie(SESSION_COOKIE, sessionId!, SESSION_TTL_MINUTES / 1440)

  try {
    await fetch('/api/tracking/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        sessionId,
        isNewVisitor,
        isNewSession,
        landingPage: window.location.pathname,
        referrer: document.referrer || null,
        urlParams,
        device: getDeviceInfo(),
      }),
      keepalive: true,
    })
  } catch {
    // Tracking failures should never block the user
  }

  return { visitorId, sessionId: sessionId!, isNewVisitor, isNewSession }
}

export async function trackPageView(pagePath: string, pageTitle?: string) {
  const visitorId = getVisitorId()
  const sessionId = getSessionId()
  if (!visitorId || !sessionId) return

  try {
    await fetch('/api/tracking/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId, sessionId, pagePath, pageTitle }),
      keepalive: true,
    })
  } catch {
    // silent
  }
}
