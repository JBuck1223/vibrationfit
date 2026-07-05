import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({})) as { is_active?: boolean }

  if (body.is_active === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('meta_accounts')
    .update({ is_active: body.is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, platform, ig_user_id, username, token_expires_at, is_active, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }

  return NextResponse.json({ account: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from('meta_accounts').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
