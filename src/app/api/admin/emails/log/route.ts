// API to fetch sent email log
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const isAdmin =
      user.email === 'buckinghambliss@gmail.com' ||
      user.email === 'admin@vibrationfit.com' ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    const { data: emails, error } = await adminClient
      .from('email_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('❌ Error fetching email log:', error)
      return NextResponse.json({ error: 'Failed to fetch email log' }, { status: 500 })
    }

    return NextResponse.json({ emails: emails || [] })
  } catch (error: any) {
    console.error('❌ Error in email log API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}




