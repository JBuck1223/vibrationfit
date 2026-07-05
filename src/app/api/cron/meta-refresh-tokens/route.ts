/**
 * Meta token refresh cron
 *
 * GET /api/cron/meta-refresh-tokens  (Vercel cron — runs daily)
 *
 * Instagram Login long-lived tokens expire after ~60 days. This refreshes
 * the token for every active meta_accounts row whose token expires within
 * the next 15 days (Meta requires tokens to be >24h old to refresh, which
 * is guaranteed by the window).
 *
 * Security: Vercel cron header or CRON_SECRET.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { refreshIgToken } from '@/lib/meta/messaging'

const CRON_SECRET = process.env.CRON_SECRET

function authorize(request: NextRequest): boolean {
  const isVercelCron =
    request.headers.get('x-vercel-cron') === '1' ||
    request.headers.get('user-agent')?.includes('vercel-cron')
  if (isVercelCron) return true

  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true

  if (process.env.NODE_ENV === 'development') return true

  return false
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const cutoff = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()

  const { data: accounts, error } = await admin
    .from('meta_accounts')
    .select('id, username, platform, access_token, token_expires_at')
    .eq('is_active', true)
    .eq('platform', 'instagram')
    .or(`token_expires_at.is.null,token_expires_at.lte.${cutoff}`)

  if (error) {
    return NextResponse.json({ error: 'Failed to load accounts' }, { status: 500 })
  }

  const results: Array<{ username: string | null; ok: boolean; error?: string }> = []

  for (const account of accounts || []) {
    try {
      const refreshed = await refreshIgToken(account.access_token)
      await admin
        .from('meta_accounts')
        .update({
          access_token: refreshed.accessToken,
          token_expires_at: refreshed.expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id)
      results.push({ username: account.username, ok: true })
    } catch (err) {
      console.error(
        `[meta-refresh-tokens] Failed for @${account.username}:`,
        (err as Error).message
      )
      results.push({
        username: account.username,
        ok: false,
        error: (err as Error).message,
      })
    }
  }

  return NextResponse.json({ checked: accounts?.length || 0, results })
}
