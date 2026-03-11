export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const admin = createAdminClient()

    const { count, error } = await admin
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)

    if (error) {
      console.error('Error fetching unread count:', error)
      return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error('Admin notifications unread-count error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
