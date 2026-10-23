import { createHash } from 'crypto'

// Server + browser pixel IDs must be the same pixel for Meta dedup to work.
// Fall back to the public var so a single env entry configures both sides.
const META_PIXEL_ID = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID
const META_ACCESS_TOKEN = process.env.META_CONVERSIONS_API_TOKEN
const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID
const GA4_API_SECRET = process.env.GA4_API_SECRET
const TIKTOK_PIXEL_ID = process.env.TIKTOK_PIXEL_ID || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN
const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
const GOOGLE_ADS_CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID
const GOOGLE_ADS_CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET
const GOOGLE_ADS_REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN
// Account IDs are digits only -- strip the dashes Google shows in the UI
const GOOGLE_ADS_CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID?.replace(/-/g, '')
const GOOGLE_ADS_LOGIN_CUSTOMER_ID = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, '')
const GOOGLE_ADS_API_VERSION = process.env.GOOGLE_ADS_API_VERSION || 'v24'

type ServerEvent = 'lead' | 'purchase' | 'initiate_checkout'

export interface ServerConversionData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  value?: number
  currency?: string
  contentName?: string
  orderId?: string
  eventId?: string
  eventSourceUrl?: string
  // Attribution click IDs / Meta browser identifiers
  fbclid?: string | null
  fbc?: string | null
  fbp?: string | null
  gclid?: string | null
  ttclid?: string | null
  // Request context for user matching
  ip?: string | null
  userAgent?: string | null
  visitorId?: string | null
}

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function buildMetaUserData(data: {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  ip?: string | null
  userAgent?: string | null
  fbc?: string | null
  fbclid?: string | null
  fbp?: string | null
  visitorId?: string | null
}): Record<string, unknown> {
  const userData: Record<string, unknown> = {}
  if (data.email) userData.em = [sha256(data.email)]
  if (data.phone) userData.ph = [sha256(data.phone)]
  if (data.firstName) userData.fn = [sha256(data.firstName)]
  if (data.lastName) userData.ln = [sha256(data.lastName)]
  if (data.ip) userData.client_ip_address = data.ip
  if (data.userAgent) userData.client_user_agent = data.userAgent
  // Prefer the real _fbc cookie; fall back to constructing from fbclid
  if (data.fbc) userData.fbc = data.fbc
  else if (data.fbclid) userData.fbc = `fb.1.${Date.now()}.${data.fbclid}`
  if (data.fbp) userData.fbp = data.fbp
  if (data.visitorId) userData.external_id = [sha256(data.visitorId)]
  return userData
}

async function postMetaEvents(events: Record<string, unknown>[]) {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) return

  const url = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: events }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[Meta CAPI] Error:', res.status, body)
  }
}

// ─── Meta Conversions API ────────────────────────────────────────────────────

const META_EVENT_MAP: Record<ServerEvent, string> = {
  lead: 'Lead',
  purchase: 'Purchase',
  initiate_checkout: 'InitiateCheckout',
}

async function sendMetaConversion(event: ServerEvent, data: ServerConversionData) {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) return

  const customData: Record<string, unknown> = {}
  if (data.value != null) customData.value = data.value
  if (data.currency) customData.currency = data.currency
  if (data.contentName) customData.content_name = data.contentName
  if (data.orderId) customData.order_id = data.orderId

  await postMetaEvents([
    {
      event_name: META_EVENT_MAP[event],
      event_time: Math.floor(Date.now() / 1000),
      event_id: data.eventId || undefined,
      event_source_url: data.eventSourceUrl || undefined,
      action_source: 'website',
      user_data: buildMetaUserData(data),
      custom_data: customData,
    },
  ])
}

// ─── GA4 Measurement Protocol ────────────────────────────────────────────────

const GA4_EVENT_MAP: Record<ServerEvent, string> = {
  lead: 'generate_lead',
  purchase: 'purchase',
  initiate_checkout: 'begin_checkout',
}

async function sendGA4Conversion(event: ServerEvent, data: ServerConversionData) {
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) return

  const clientId = data.visitorId || 'server-' + Date.now()

  const eventParams: Record<string, unknown> = {}
  if (data.value != null) eventParams.value = data.value
  if (data.currency) eventParams.currency = data.currency
  if (data.orderId) eventParams.transaction_id = data.orderId
  if (data.contentName) eventParams.item_name = data.contentName

  const payload = {
    client_id: clientId,
    events: [
      {
        name: GA4_EVENT_MAP[event],
        params: eventParams,
      },
    ],
  }

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[GA4 MP] Error:', res.status, body)
  }
}

// ─── TikTok Events API ──────────────────────────────────────────────────────

const TIKTOK_EVENT_MAP: Record<ServerEvent, string> = {
  lead: 'SubmitForm',
  purchase: 'CompletePayment',
  initiate_checkout: 'InitiateCheckout',
}

async function sendTikTokConversion(event: ServerEvent, data: ServerConversionData) {
  if (!TIKTOK_PIXEL_ID || !TIKTOK_ACCESS_TOKEN) return

  const user: Record<string, unknown> = {}
  if (data.email) user.email = sha256(data.email)
  if (data.phone) user.phone = sha256(data.phone)
  if (data.ip) user.ip = data.ip
  if (data.userAgent) user.user_agent = data.userAgent
  if (data.ttclid) user.ttclid = data.ttclid
  if (data.visitorId) user.external_id = sha256(data.visitorId)

  const properties: Record<string, unknown> = {}
  if (data.value != null) properties.value = data.value
  if (data.currency) properties.currency = data.currency
  if (data.contentName) properties.content_name = data.contentName
  if (data.orderId) properties.order_id = data.orderId

  const payload = {
    event_source: 'web',
    event_source_id: TIKTOK_PIXEL_ID,
    data: [
      {
        event: TIKTOK_EVENT_MAP[event],
        event_id: data.eventId || undefined,
        event_time: Math.floor(Date.now() / 1000),
        user: { ...user },
        properties: { ...properties },
        page: data.eventSourceUrl ? { url: data.eventSourceUrl } : undefined,
      },
    ],
  }

  const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': TIKTOK_ACCESS_TOKEN,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[TikTok Events API] Error:', res.status, body)
  }
}

// ─── Google Ads Offline Click Conversions ───────────────────────────────────

// Conversion action IDs (numeric, from the action's URL in Google Ads). Must be
// "Import > Clicks" actions, separate from the website-tag actions the browser fires.
const GOOGLE_ADS_CONVERSION_ACTIONS: Partial<Record<ServerEvent, string | undefined>> = {
  lead: process.env.GOOGLE_ADS_LEAD_CONVERSION_ACTION_ID,
  purchase: process.env.GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID,
}

let googleAdsAccessToken: { token: string; expiresAt: number } | null = null

async function getGoogleAdsAccessToken(): Promise<string | null> {
  if (googleAdsAccessToken && googleAdsAccessToken.expiresAt > Date.now() + 60_000) {
    return googleAdsAccessToken.token
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_ADS_CLIENT_ID!,
      client_secret: GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[Google Ads] OAuth error:', res.status, body)
    return null
  }

  const json = (await res.json()) as { access_token: string; expires_in: number }
  googleAdsAccessToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return json.access_token
}

/** Google Ads wants "yyyy-mm-dd hh:mm:ss+00:00". */
function googleAdsDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '+00:00')
}

async function sendGoogleAdsConversion(event: ServerEvent, data: ServerConversionData) {
  const conversionActionId = GOOGLE_ADS_CONVERSION_ACTIONS[event]
  if (
    !data.gclid ||
    !conversionActionId ||
    !GOOGLE_ADS_DEVELOPER_TOKEN ||
    !GOOGLE_ADS_CLIENT_ID ||
    !GOOGLE_ADS_CLIENT_SECRET ||
    !GOOGLE_ADS_REFRESH_TOKEN ||
    !GOOGLE_ADS_CUSTOMER_ID
  ) {
    return
  }

  const accessToken = await getGoogleAdsAccessToken()
  if (!accessToken) return

  const conversion: Record<string, unknown> = {
    gclid: data.gclid,
    conversionAction: `customers/${GOOGLE_ADS_CUSTOMER_ID}/conversionActions/${conversionActionId}`,
    conversionDateTime: googleAdsDateTime(new Date()),
  }
  if (data.value != null) {
    conversion.conversionValue = data.value
    conversion.currencyCode = (data.currency || 'USD').toUpperCase()
  }
  // The dedup event ID (payment intent id / lead id) is what the browser sends
  // as transaction_id, and Google dedups repeat uploads on it -- so the Stripe
  // checkout.session + payment_intent webhooks count once
  const orderId = data.eventId || data.orderId
  if (orderId) conversion.orderId = orderId
  if (data.email) conversion.userIdentifiers = [{ hashedEmail: sha256(data.email) }]

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
  }
  if (GOOGLE_ADS_LOGIN_CUSTOMER_ID) headers['login-customer-id'] = GOOGLE_ADS_LOGIN_CUSTOMER_ID

  const res = await fetch(
    `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${GOOGLE_ADS_CUSTOMER_ID}:uploadClickConversions`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ conversions: [conversion], partialFailure: true }),
    }
  )

  const body = await res.text()
  if (!res.ok) {
    console.error('[Google Ads] Upload error:', res.status, body)
    return
  }
  // With partialFailure, rejected rows (expired gclid, duplicate order ID...)
  // come back as a 200 with partialFailureError set
  if (body.includes('partialFailureError')) {
    console.error('[Google Ads] Conversion rejected:', body)
  }
}

// ─── Unified Entry Point ─────────────────────────────────────────────────────

/**
 * Send a server-side conversion event to all configured platforms.
 * Each platform call is independent -- one failure won't block others.
 * Runs fire-and-forget by default; await the returned promise if you need confirmation.
 */
export async function sendServerConversion(event: ServerEvent, data: ServerConversionData): Promise<void> {
  const results = await Promise.allSettled([
    sendMetaConversion(event, data),
    sendGA4Conversion(event, data),
    sendTikTokConversion(event, data),
    sendGoogleAdsConversion(event, data),
  ])

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[Server Conversion] Platform call failed:', result.reason)
    }
  }
}

// ─── Engagement Events (video milestones + page engagement) ─────────────────

export type EngagementEventName =
  | 'page_engagement'
  | 'video_start'
  | 'video_milestone'
  | 'video_complete'

export interface ServerEngagementData {
  eventName: EngagementEventName
  /** Dedup ID -- must match the eventID the browser pixel fired */
  eventId: string
  eventSourceUrl?: string
  videoId?: string | null
  milestonePercent?: 25 | 50 | 75 | 95 | null
  watchTimeSeconds?: number | null
  dwellSeconds?: number | null
  scrollDepthPercent?: number | null
  // User matching
  fbc?: string | null
  fbclid?: string | null
  fbp?: string | null
  ip?: string | null
  userAgent?: string | null
  visitorId?: string | null
}

/**
 * Meta custom event names. Milestones get DISTINCT names (VideoWatched25...95)
 * so each can drive its own Custom Audience for retargeting tiers.
 */
export function metaEngagementEventName(data: ServerEngagementData): string {
  switch (data.eventName) {
    case 'page_engagement':
      return 'PageEngaged'
    case 'video_start':
      return 'VideoStarted'
    case 'video_complete':
      return 'VideoCompleted'
    case 'video_milestone':
      return `VideoWatched${data.milestonePercent}`
  }
}

async function sendMetaEngagement(data: ServerEngagementData) {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) return

  const customData: Record<string, unknown> = {}
  if (data.videoId) customData.video_id = data.videoId
  if (data.milestonePercent != null) customData.milestone_percent = data.milestonePercent
  if (data.watchTimeSeconds != null) customData.watch_time_seconds = data.watchTimeSeconds
  if (data.dwellSeconds != null) customData.dwell_seconds = data.dwellSeconds
  if (data.scrollDepthPercent != null) customData.scroll_depth_percent = data.scrollDepthPercent

  await postMetaEvents([
    {
      event_name: metaEngagementEventName(data),
      event_time: Math.floor(Date.now() / 1000),
      event_id: data.eventId,
      event_source_url: data.eventSourceUrl || undefined,
      action_source: 'website',
      user_data: buildMetaUserData(data),
      custom_data: customData,
    },
  ])
}

const GA4_ENGAGEMENT_MAP: Record<EngagementEventName, string> = {
  page_engagement: 'page_engaged',
  video_start: 'video_start',
  video_milestone: 'video_progress',
  video_complete: 'video_complete',
}

async function sendGA4Engagement(data: ServerEngagementData) {
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) return

  const params: Record<string, unknown> = {}
  if (data.videoId) params.video_id = data.videoId
  if (data.milestonePercent != null) params.percent = data.milestonePercent
  if (data.watchTimeSeconds != null) params.watch_time = data.watchTimeSeconds
  if (data.dwellSeconds != null) params.dwell_seconds = data.dwellSeconds
  if (data.scrollDepthPercent != null) params.scroll_depth = data.scrollDepthPercent

  const payload = {
    client_id: data.visitorId || 'server-' + Date.now(),
    events: [{ name: GA4_ENGAGEMENT_MAP[data.eventName], params }],
  }

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[GA4 MP] Engagement error:', res.status, body)
  }
}

/**
 * Send a server-side engagement event (video milestone / page engagement) to
 * Meta CAPI + GA4. The eventId must match the browser pixel's eventID so Meta
 * deduplicates -- browser event drives real-time optimization, server event
 * guarantees delivery through ad blockers and iOS.
 */
export async function sendServerEngagement(data: ServerEngagementData): Promise<void> {
  const results = await Promise.allSettled([
    sendMetaEngagement(data),
    sendGA4Engagement(data),
  ])

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[Server Engagement] Platform call failed:', result.reason)
    }
  }
}
