// Get unified conversation thread for a support ticket
// Combines: ticket replies, emails, SMS messages
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

    // Get ticket details
    const { data: ticket, error: ticketError } = await adminClient
      .from('support_tickets')
      .select('*, user_id, guest_email')
      .eq('id', id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const userId = ticket.user_id
    const guestEmail = ticket.guest_email

    // Get user's email if we have a user_id
    let userEmail = guestEmail
    if (userId) {
      const { data: authUser } = await adminClient.auth.admin.getUserById(userId)
      userEmail = authUser?.user?.email || guestEmail
    }

    // Fetch ticket replies, emails, and SMS in parallel
    const repliesPromise = adminClient
      .from('support_ticket_replies')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    // Build email query with quoted values to prevent filter injection
    let emailPromise
    if (userEmail) {
      if (userId) {
        emailPromise = adminClient
          .from('email_messages')
          .select('*')
          .or(`from_email.eq."${userEmail}",to_email.eq."${userEmail}",user_id.eq.${userId}`)
          .order('created_at', { ascending: true })
      } else {
        emailPromise = adminClient
          .from('email_messages')
          .select('*')
          .or(`from_email.eq."${userEmail}",to_email.eq."${userEmail}"`)
          .order('created_at', { ascending: true })
      }
    } else if (userId) {
      emailPromise = adminClient
        .from('email_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
    } else {
      emailPromise = Promise.resolve({ data: [] as Array<Record<string, unknown>> })
    }

    const smsPromise = userId
      ? adminClient
          .from('sms_messages')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> })

    const [{ data: replies }, { data: emails }, { data: smsData }] = await Promise.all([
      repliesPromise,
      emailPromise,
      smsPromise,
    ])

    const smsMessages = smsData || []

    // Combine and sort all messages by timestamp
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

    // Add ticket replies
    replies?.forEach((reply) => {
      allMessages.push({
        type: 'reply',
        id: reply.id,
        content: reply.message,
        direction: reply.is_staff ? 'outbound' : 'inbound',
        timestamp: reply.created_at,
        metadata: {
          userId: reply.user_id,
          isStaff: reply.is_staff,
        },
      })
    })

    // Add emails
    emails?.forEach((email: Record<string, unknown>) => {
      allMessages.push({
        type: 'email',
        id: email.id as string,
        content: email.body_text as string,
        htmlContent: email.body_html as string | undefined,
        subject: email.subject as string | undefined,
        direction: email.direction as string,
        timestamp: email.created_at as string,
        metadata: {
          from: email.from_email,
          to: email.to_email,
          status: email.status,
        },
      })
    })

    // Add SMS messages
    smsMessages.forEach((sms: Record<string, unknown>) => {
      allMessages.push({
        type: 'sms',
        id: sms.id as string,
        content: sms.body as string,
        direction: sms.direction as string,
        timestamp: sms.created_at as string,
        metadata: {
          from: sms.from_number,
          to: sms.to_number,
          status: sms.status,
        },
      })
    })

    // Sort by timestamp
    allMessages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    return NextResponse.json({
      conversation: allMessages,
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        created_at: ticket.created_at,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
