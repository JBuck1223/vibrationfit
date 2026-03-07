import { createHash } from 'crypto'

const META_PIXEL_ID = process.env.META_PIXEL_ID
const META_ACCESS_TOKEN = process.env.META_CONVERSIONS_API_TOKEN
const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID
const GA4_API_SECRET = process.env.GA4_API_SECRET
const TIKTOK_PIXEL_ID = process.env.TIKTOK_PIXEL_ID
const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN

type ServerEvent = 'lead' | 'purchase'

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
  // Attribution click IDs
  fbclid?: string | null
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

// ─── Meta Conversions API ────────────────────────────────────────────────────

const META_EVENT_MAP: Record<ServerEvent, string> = {
  lead: 'Lead',
  purchase: 'Purchase',
}

async function sendMetaConversion(event: ServerEvent, data: ServerConversionData) {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) return

  const userData: Record<string, unknown> = {}
  if (data.email) userData.em = [sha256(data.email)]
  if (data.phone) userData.ph = [sha256(data.phone)]
  if (data.firstName) userData.fn = [sha256(data.firstName)]
  if (data.lastName) userData.ln = [sha256(data.lastName)]
  if (data.ip) userData.client_ip_address = data.ip
  if (data.userAgent) userData.client_user_agent = data.userAgent
  if (data.fbclid) userData.fbc = `fb.1.${Date.now()}.${data.fbclid}`
  if (data.fbp) userData.fbp = data.fbp
  if (data.visitorId) userData.external_id = [sha256(data.visitorId)]

  const customData: Record<string, unknown> = {}
  if (data.value != null) customData.value = data.value
  if (data.currency) customData.currency = data.currency
  if (data.contentName) customData.content_name = data.contentName
  if (data.orderId) customData.order_id = data.orderId

  const payload = {
    data: [
      {
        event_name: META_EVENT_MAP[event],
        event_time: Math.floor(Date.now() / 1000),
        event_id: data.eventId || undefined,
        event_source_url: data.eventSourceUrl || undefined,
        action_source: 'website',
        user_data: userData,
        custom_data: customData,
      },
    ],
  }

  const url = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[Meta CAPI] Error:', res.status, body)
  }
}

// ─── GA4 Measurement Protocol ────────────────────────────────────────────────

const GA4_EVENT_MAP: Record<ServerEvent, string> = {
  lead: 'generate_lead',
  purchase: 'purchase',
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
  ])

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[Server Conversion] Platform call failed:', result.reason)
    }
  }
}
