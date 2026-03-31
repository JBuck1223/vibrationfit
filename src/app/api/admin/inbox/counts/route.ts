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

    const [
      { count: emailInbound },
      { count: emailOutbound },
      { count: smsInbound },
      { count: smsOutbound },
    ] = await Promise.all([
      adminClient
        .from('email_messages')
        .select('*', { count: 'exact', head: true })
        .eq('direction', 'inbound'),
      adminClient
        .from('email_messages')
        .select('*', { count: 'exact', head: true })
        .eq('direction', 'outbound'),
      adminClient
        .from('sms_messages')
        .select('*', { count: 'exact', head: true })
        .eq('direction', 'inbound'),
      adminClient
        .from('sms_messages')
        .select('*', { count: 'exact', head: true })
        .eq('direction', 'outbound'),
    ])

    return NextResponse.json({
      email: {
        inbound: emailInbound || 0,
        outbound: emailOutbound || 0,
        total: (emailInbound || 0) + (emailOutbound || 0),
      },
      sms: {
        inbound: smsInbound || 0,
        outbound: smsOutbound || 0,
        total: (smsInbound || 0) + (smsOutbound || 0),
      },
      total: {
        inbound: (emailInbound || 0) + (smsInbound || 0),
        outbound: (emailOutbound || 0) + (smsOutbound || 0),
        total: (emailInbound || 0) + (emailOutbound || 0) + (smsInbound || 0) + (smsOutbound || 0),
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching inbox counts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
