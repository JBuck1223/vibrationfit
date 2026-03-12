import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

const COOKIE_OPTS = {
  path: '/',
  httpOnly: false,
  sameSite: 'lax' as const,
  maxAge: 60 * 60, // 1 hour
}

export async function POST(request: NextRequest) {
  const result = await verifyAdminAccess()
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const { userId } = await request.json()
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  // Look up the target user's name and email
  const adminClient = createAdminClient()
  const { data: { user: targetUser } } = await adminClient.auth.admin.getUserById(userId)
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { data: account } = await adminClient
    .from('user_accounts')
    .select('first_name, last_name, email')
    .eq('id', userId)
    .maybeSingle()

  const displayName = account
    ? [account.first_name, account.last_name].filter(Boolean).join(' ') || account.email
    : targetUser.email ?? userId

  const response = NextResponse.json({ ok: true, displayName })
  response.cookies.set('vf-impersonate-uid', userId, COOKIE_OPTS)
  response.cookies.set('vf-impersonate-email', targetUser.email ?? '', COOKIE_OPTS)
  response.cookies.set('vf-impersonate-name', displayName, COOKIE_OPTS)

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('vf-impersonate-uid')
  response.cookies.delete('vf-impersonate-email')
  response.cookies.delete('vf-impersonate-name')
  return response
}
