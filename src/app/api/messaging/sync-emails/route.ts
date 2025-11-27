// Sync inbound emails from Google Workspace via IMAP
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncInboundEmails } from '@/lib/messaging/imap-sync'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin =
      user.email === 'buckinghambliss@gmail.com' ||
      user.email === 'admin@vibrationfit.com' ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('🔄 Starting email sync...')
    const result = await syncInboundEmails()

    return NextResponse.json({
      success: result.success,
      newMessages: result.newMessages,
      errors: result.errors,
    })
  } catch (error: any) {
    console.error('❌ Error syncing emails:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync emails' },
      { status: 500 }
    )
  }
}


