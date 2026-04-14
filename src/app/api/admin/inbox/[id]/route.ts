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

    // Reverse lookup: if still no name, match phone/email against user_accounts and leads
    if (!contactName && contactPhone) {
      const { data: userByPhone } = await adminClient
        .from('user_accounts')
        .select('id, full_name, email, phone')
        .eq('phone', contactPhone)
        .limit(1)
        .maybeSingle()

      if (userByPhone) {
        contactName = userByPhone.full_name || userByPhone.email
        contactUserId = userByPhone.id
        if (!contactEmail) contactEmail = userByPhone.email
      } else {
        const { data: leadByPhone } = await adminClient
          .from('leads')
          .select('id, first_name, last_name, email, phone')
          .eq('phone', contactPhone)
          .limit(1)
          .maybeSingle()

        if (leadByPhone) {
          contactName = [leadByPhone.first_name, leadByPhone.last_name].filter(Boolean).join(' ') || leadByPhone.email
          contactLeadId = leadByPhone.id
          if (!contactEmail) contactEmail = leadByPhone.email
        }
      }
    }

    if (!contactName && contactEmail) {
      const { data: userByEmail } = await adminClient
        .from('user_accounts')
        .select('id, full_name, email')
        .eq('email', contactEmail)
        .limit(1)
        .maybeSingle()

      if (userByEmail) {
        contactName = userByEmail.full_name || userByEmail.email
        contactUserId = userByEmail.id
      } else {
        const { data: leadByEmail } = await adminClient
          .from('leads')
          .select('id, first_name, last_name, email')
          .eq('email', contactEmail)
          .limit(1)
          .maybeSingle()

        if (leadByEmail) {
          contactName = [leadByEmail.first_name, leadByEmail.last_name].filter(Boolean).join(' ') || leadByEmail.email
          contactLeadId = leadByEmail.id
        }
      }
    }

    // Fetch thread for this contact -- only the same channel, newest first
    const conversation: any[] = []

    if (channel === 'email') {
      const emailFilters: string[] = []
      if (contactEmail) {
        emailFilters.push(`from_email.eq.${contactEmail}`)
        emailFilters.push(`to_email.eq.${contactEmail}`)
      }
      if (contactUserId) {
        emailFilters.push(`user_id.eq.${contactUserId}`)
      }

      if (emailFilters.length > 0) {
        const { data: emails } = await adminClient
          .from('email_messages')
          .select('*')
          .or(emailFilters.join(','))
          .order('created_at', { ascending: false })

        emails?.forEach((e) => {
          conversation.push({
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
    } else if (channel === 'sms') {
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

      if (smsFilters.length > 0) {
        const { data: smsMessages } = await adminClient
          .from('sms_messages')
          .select('*')
          .or(smsFilters.join(','))
          .order('created_at', { ascending: false })

        smsMessages?.forEach((s) => {
          conversation.push({
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
    }

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
      conversation,
    })
  } catch (error: unknown) {
    console.error('Error fetching inbox message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
