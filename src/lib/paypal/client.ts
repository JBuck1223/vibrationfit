// PayPal REST API client.
// All products/pricing live in our database — PayPal is only used to capture
// card payments and store vaulted payment tokens. No PayPal products, plans,
// or price IDs are ever created.

const PAYPAL_API_BASE =
  process.env.PAYPAL_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com'

export const PAYPAL_CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID || '',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
  apiBase: PAYPAL_API_BASE,
}

export function isPayPalConfigured(): boolean {
  return Boolean(PAYPAL_CONFIG.clientId && PAYPAL_CONFIG.clientSecret)
}

// ---------------------------------------------------------------------------
// OAuth token (cached in module scope; PayPal tokens live ~9 hours)
// ---------------------------------------------------------------------------

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token
  }

  const auth = Buffer.from(`${PAYPAL_CONFIG.clientId}:${PAYPAL_CONFIG.clientSecret}`).toString('base64')
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal OAuth failed (${res.status}): ${text}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return data.access_token
}

// ---------------------------------------------------------------------------
// Fetch wrapper
// ---------------------------------------------------------------------------

export class PayPalApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, body: unknown, message?: string) {
    super(message || `PayPal API error (${status})`)
    this.name = 'PayPalApiError'
    this.status = status
    this.body = body
  }
}

export async function paypalFetch<T = any>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: unknown
    /** Idempotency key — PayPal dedupes requests with the same id for ~72h */
    requestId?: string
  } = {},
): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${PAYPAL_API_BASE}${path}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.requestId ? { 'PayPal-Request-Id': options.requestId } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  })

  const text = await res.text()
  const json = text ? JSON.parse(text) : null

  if (!res.ok) {
    const detail = json?.details?.[0]
    const message = detail
      ? `${json?.name || 'PAYPAL_ERROR'}: ${detail.issue || ''} ${detail.description || ''}`.trim()
      : json?.message || `PayPal API error (${res.status})`
    throw new PayPalApiError(res.status, json, message)
  }

  return json as T
}
