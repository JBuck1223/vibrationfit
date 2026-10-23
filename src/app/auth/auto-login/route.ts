import { NextRequest, NextResponse } from 'next/server'

/**
 * Retired. This used to sign the browser in straight after the old Stripe
 * "combined" checkout by generating a magic link for the email in the URL,
 * which let anyone sign in as anyone. Checkout now runs through PayPal and
 * never lands here, so the route only sends people to sign in normally.
 */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/auth/login', request.url))
}
