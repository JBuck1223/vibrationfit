// /src/app/api/messaging/webhook/twilio/route.ts
// Webhook endpoint to receive inbound SMS from Twilio

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { handleOptOut } from '@/lib/messaging'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyAdminSMS } from '@/lib/admin/notifications'

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (phone.startsWith('+')) return digits.startsWith('1') ? `+${digits}` : phone
  return `+${digits}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const body = formData.get('Body') as string
    const messageSid = formData.get('MessageSid') as string

    console.log('Inbound SMS received:', {
      from,
      to,
      body: body?.substring(0, 50),
      sid: messageSid,
    })

    // Handle opt-out keywords
    const bodyLower = body?.toLowerCase().trim()
    if (bodyLower === 'stop' || bodyLower === 'unsubscribe' || bodyLower === 'cancel') {
      await handleOptOut(from)
      return new NextResponse('', { status: 200 })
    }

    const adminClient = createAdminClient()
    const normalizedFrom = normalizePhone(from)

    // Find user by phone in user_profiles
    let userId: string | null = null
    let leadId: string | null = null
    let contactName: string | null = null

    const { data: profiles } = await adminClient
      .from('user_profiles')
      .select('user_id, phone, first_name, last_name')
      .not('phone', 'is', null)

    if (profiles) {
      const matched = profiles.find(p => normalizePhone(p.phone || '') === normalizedFrom)
      if (matched) {
        userId = matched.user_id
        contactName = [matched.first_name, matched.last_name].filter(Boolean).join(' ') || null
      }
    }

    // If no user found, try leads
    if (!userId) {
      const { data: leads } = await adminClient
        .from('leads')
        .select('id, phone, converted_to_user_id, first_name, last_name')
        .not('phone', 'is', null)

      if (leads) {
        const matched = leads.find(l => normalizePhone(l.phone || '') === normalizedFrom)
        if (matched) {
          leadId = matched.id
          if (matched.converted_to_user_id) userId = matched.converted_to_user_id
          if (!contactName) {
            contactName = [matched.first_name, matched.last_name].filter(Boolean).join(' ') || null
          }
        }
      }
    }

    // Check for open support ticket
    let ticketId: string | null = null
    if (userId) {
      const { data: ticket } = await adminClient
        .from('support_tickets')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['open', 'in_progress', 'waiting_reply'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (ticket) ticketId = ticket.id
    }

    // Check for duplicate by twilio_sid
    const { data: existing } = await adminClient
      .from('sms_messages')
      .select('id')
      .eq('twilio_sid', messageSid)
      .single()

    if (!existing) {
      const { error: insertError } = await adminClient
        .from('sms_messages')
        .insert({
          user_id: userId,
          lead_id: leadId,
          ticket_id: ticketId,
          direction: 'inbound',
          from_number: from,
          to_number: to,
          body: body || '',
          status: 'received',
          twilio_sid: messageSid,
        })

      if (insertError) {
        console.error('Failed to insert inbound SMS:', insertError)
      } else {
        console.log('Inbound SMS stored:', { messageSid, userId, leadId })

        const sender = contactName || from
        const preview = (body || '').substring(0, 140)
        notifyAdminSMS(`New SMS from ${sender}: "${preview}"`).catch(() => {})
      }
    }

    return new NextResponse('', { status: 200 })
  } catch (error: any) {
    console.error('Error processing Twilio webhook:', error)
    return new NextResponse('', { status: 200 })
  }
}












