import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') || '50', 10) || 50,
    200
  )

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('meta_messages')
    .select('*, rule:meta_automation_rules(keyword), account:meta_accounts(username)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }

  return NextResponse.json({ messages: data || [] })
}
