import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { getIgIdentity, exchangeIgToken, refreshIgToken } from '@/lib/meta/messaging'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('meta_accounts')
    .select('id, platform, ig_user_id, username, token_expires_at, is_active, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to load accounts' }, { status: 500 })
  }

  return NextResponse.json({ accounts: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => ({})) as { access_token?: string }
  const rawToken = (body.access_token || '').trim()

  if (!rawToken) {
    return NextResponse.json({ error: 'An access token is required' }, { status: 400 })
  }

  // Normalize to a long-lived token. Dashboard-generated tokens are already
  // long-lived (exchange fails on them); OAuth tokens are short-lived.
  let accessToken = rawToken
  let expiresAt: Date | null = null
  try {
    const exchanged = await exchangeIgToken(rawToken)
    accessToken = exchanged.accessToken
    expiresAt = exchanged.expiresAt
  } catch {
    try {
      const refreshed = await refreshIgToken(rawToken)
      accessToken = refreshed.accessToken
      expiresAt = refreshed.expiresAt
    } catch {
      // Keep the token as provided; assume the standard 60-day window.
      expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    }
  }

  let identity
  try {
    identity = await getIgIdentity(accessToken)
  } catch (err) {
    return NextResponse.json(
      { error: `Token rejected by Instagram: ${(err as Error).message}` },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('meta_accounts')
    .upsert(
      {
        platform: 'instagram',
        ig_user_id: identity.igUserId,
        username: identity.username,
        access_token: accessToken,
        token_expires_at: expiresAt?.toISOString() || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'ig_user_id' }
    )
    .select('id, platform, ig_user_id, username, token_expires_at, is_active, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save account' }, { status: 500 })
  }

  return NextResponse.json({ account: data })
}
