export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const channel = searchParams.get('channel') || 'email'

    const adminClient = createAdminClient()

    // Fetch the specific message
    let message: any = null
    let contactEmail: string | null = null
    let contactPhone: string | null = null
    let contactUserId: string | null = null
    let contactLeadId: string | null = null

    if (channel === 'email') {
      const { data } = await adminClient
        .from('email_messages')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        message = data
        contactEmail = data.direction === 'inbound' ? data.from_email : data.to_email
        contactUserId = data.user_id
      }
    } else if (channel === 'sms') {
      const { data } = await adminClient
        .from('sms_messages')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        message = data
        contactPhone = data.direction === 'inbound' ? data.from_number : data.to_number
        contactUserId = data.user_id
        contactLeadId = data.lead_id
      }
    }

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Resolve contact info
    let contactName: string | null = null

    if (contactUserId) {
      const { data: user } = await adminClient
        .from('user_accounts')
        .select('id, full_name, email, phone')
        .eq('id', contactUserId)
        .single()

      if (user) {
        contactName = user.full_name || user.email
        if (!contactEmail) contactEmail = user.email
        if (!contactPhone) contactPhone = user.phone
      }
    }

    if (!contactName && contactLeadId) {
      const { data: lead } = await adminClient
        .from('leads')
        .select('id, first_name, last_name, email, phone')
        .eq('id', contactLeadId)
        .single()

      if (lead) {
        contactName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.email
        if (!contactEmail) contactEmail = lead.email
        if (!contactPhone) contactPhone = lead.phone
      }
    }

    // Fetch full conversation thread for this contact
    const allMessages: any[] = []

    // Get all emails for this contact
    if (contactEmail || contactUserId) {
      const emailFilters: string[] = []
      if (contactEmail) {
        emailFilters.push(`from_email.eq.${contactEmail}`)
        emailFilters.push(`to_email.eq.${contactEmail}`)
      }
      if (contactUserId) {
        emailFilters.push(`user_id.eq.${contactUserId}`)
      }

      const { data: emails } = await adminClient
        .from('email_messages')
        .select('*')
        .or(emailFilters.join(','))
        .order('created_at', { ascending: true })

      emails?.forEach((e) => {
        allMessages.push({
          type: 'email' as const,
          id: e.id,
          content: e.body_text || '',
          htmlContent: e.body_html,
          subject: e.subject,
          direction: e.direction,
          timestamp: e.created_at,
          metadata: {
            from: e.from_email,
            to: e.to_email,
            status: e.status,
          },
        })
      })
    }

    // Get all SMS for this contact
    if (contactPhone || contactUserId || contactLeadId) {
      const smsFilters: string[] = []
      if (contactPhone) {
        smsFilters.push(`from_number.eq.${contactPhone}`)
        smsFilters.push(`to_number.eq.${contactPhone}`)
      }
      if (contactUserId) {
        smsFilters.push(`user_id.eq.${contactUserId}`)
      }
      if (contactLeadId) {
        smsFilters.push(`lead_id.eq.${contactLeadId}`)
      }

      const { data: smsMessages } = await adminClient
        .from('sms_messages')
        .select('*')
        .or(smsFilters.join(','))
        .order('created_at', { ascending: true })

      smsMessages?.forEach((s) => {
        allMessages.push({
          type: 'sms' as const,
          id: s.id,
          content: s.body || '',
          direction: s.direction,
          timestamp: s.created_at,
          metadata: {
            from: s.from_number,
            to: s.to_number,
            status: s.status,
          },
        })
      })
    }

    // Sort chronologically
    allMessages.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    return NextResponse.json({
      message,
      channel,
      contact: {
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        userId: contactUserId,
        leadId: contactLeadId,
      },
      conversation: allMessages,
    })
  } catch (error: unknown) {
    console.error('Error fetching inbox message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
