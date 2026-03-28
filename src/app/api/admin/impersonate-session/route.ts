import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { createReturnToken, verifyReturnToken } from '@/lib/impersonation-token'
import { checkIsAdmin } from '@/middleware/admin'

export async function POST(request: NextRequest) {
  const result = await verifyAdminAccess()
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const { userId } = await request.json()
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: { user: targetUser } } = await adminClient.auth.admin.getUserById(userId)
  if (!targetUser?.email) {
    return NextResponse.json({ error: 'Target user not found or has no email' }, { status: 404 })
  }

  const { data: account } = await adminClient
    .from('user_accounts')
    .select('first_name, last_name, email')
    .eq('id', userId)
    .maybeSingle()

  const targetName = account
    ? [account.first_name, account.last_name].filter(Boolean).join(' ') || account.email
    : targetUser.email

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: targetUser.email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error('generateLink failed:', linkError)
    return NextResponse.json({ error: 'Failed to generate session link' }, { status: 500 })
  }

  const adminUser = result.user
  const returnToken = createReturnToken(adminUser.id, adminUser.email!)

  const { data: adminAccount } = await adminClient
    .from('user_accounts')
    .select('first_name, last_name')
    .eq('id', adminUser.id)
    .maybeSingle()

  const adminName = adminAccount
    ? [adminAccount.first_name, adminAccount.last_name].filter(Boolean).join(' ') || adminUser.email
    : adminUser.email

  return NextResponse.json({
    tokenHash: linkData.properties.hashed_token,
    returnToken,
    targetName,
    targetEmail: targetUser.email,
    adminName,
  })
}

export async function PUT(request: NextRequest) {
  const { returnToken } = await request.json()
  if (!returnToken) {
    return NextResponse.json({ error: 'returnToken required' }, { status: 400 })
  }

  const payload = verifyReturnToken(returnToken)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired return token' }, { status: 403 })
  }

  const adminClient = createAdminClient()

  const { data: adminAccount } = await adminClient
    .from('user_accounts')
    .select('role')
    .eq('id', payload.adminUserId)
    .maybeSingle()

  if (!adminAccount || !['admin', 'super_admin'].includes(adminAccount.role)) {
    return NextResponse.json({ error: 'Admin account no longer valid' }, { status: 403 })
  }

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: payload.adminEmail,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error('generateLink for admin return failed:', linkError)
    return NextResponse.json({ error: 'Failed to generate admin session link' }, { status: 500 })
  }

  return NextResponse.json({
    tokenHash: linkData.properties.hashed_token,
  })
}
