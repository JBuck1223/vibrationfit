// Sync inbound emails from Google Workspace via IMAP
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { syncInboundEmails } from '@/lib/messaging/imap-sync'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
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












