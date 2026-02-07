// Get unified conversation thread for a lead
// Combines: SMS messages, emails
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isUserAdmin } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Get lead details
    const { data: lead, error: leadError } = await adminClient
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Fetch SMS and emails in parallel
    const [{ data: smsMessages }, { data: emails }] = await Promise.all([
      adminClient
        .from('sms_messages')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: true }),
      // Use separate .eq() calls instead of string interpolation in .or() to prevent filter injection
      lead.email
        ? adminClient
            .from('email_messages')
            .select('*')
            .or(`from_email.eq."${lead.email}",to_email.eq."${lead.email}"`)
            .order('created_at', { ascending: true })
        : Promise.resolve({ data: [] }),
    ])

    // Combine and sort all messages
    const allMessages: Array<{
      type: string
      id: string
      content: string
      htmlContent?: string
      subject?: string
      direction: string
      timestamp: string
      metadata: Record<string, unknown>
    }> = []

    // Add SMS messages
    smsMessages?.forEach((sms) => {
      allMessages.push({
        type: 'sms',
        id: sms.id,
        content: sms.body,
        direction: sms.direction,
        timestamp: sms.created_at,
        metadata: {
          from: sms.from_number,
          to: sms.to_number,
          status: sms.status,
        },
      })
    })

    // Add emails
    emails?.forEach((email) => {
      allMessages.push({
        type: 'email',
        id: email.id,
        content: email.body_text,
        htmlContent: email.body_html,
        subject: email.subject,
        direction: email.direction,
        timestamp: email.created_at,
        metadata: {
          from: email.from_email,
          to: email.to_email,
          status: email.status,
        },
      })
    })

    // Sort by timestamp
    allMessages.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    return NextResponse.json({
      conversation: allMessages,
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching lead conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
