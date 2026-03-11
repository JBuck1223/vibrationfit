export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const adminClient = createAdminClient()

    const { data: emails, error } = await adminClient
      .from('email_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching email log:', error)
      return NextResponse.json({ error: 'Failed to fetch email log' }, { status: 500 })
    }

    return NextResponse.json({ emails: emails || [] })
  } catch (error: any) {
    console.error('Error in email log API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
