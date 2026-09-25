// Browser-safe client token for the PayPal JS SDK v6.
//
// The checkout and add-card forms call this before loading the SDK. The token
// is short-lived and bound to this site's domain, so the client id and secret
// never leave the server.

import { NextRequest, NextResponse } from 'next/server'
import { createBrowserClientToken, isPayPalConfigured, PAYPAL_CONFIG } from '@/lib/paypal/client'

const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i

export async function GET(request: NextRequest) {
  if (!isPayPalConfigured()) {
    return NextResponse.json({ error: 'PayPal not configured' }, { status: 500 })
  }

  try {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
    const hostname = host.split(':')[0]
    // PayPal rejects localhost, so local dev gets an unbound token
    const domains = hostname && !LOCAL_HOSTS.test(host) ? [hostname] : []

    const { clientToken, expiresIn } = await createBrowserClientToken(domains)

    return NextResponse.json(
      { clientToken, expiresIn, environment: PAYPAL_CONFIG.environment },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[paypal client-token] failed:', error)
    return NextResponse.json({ error: 'Payment system is unavailable. Please try again.' }, { status: 502 })
  }
}
