// Get unified conversation thread for a support ticket
// Combines: ticket replies, emails, SMS messages
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

    // Check if user is admin
    const isAdmin =
      user.email === 'buckinghambliss@gmail.com' ||
      user.email === 'admin@vibrationfit.com' ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
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

    // Fetch ticket replies
    const { data: replies } = await adminClient
      .from('support_ticket_replies')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    // Fetch emails (by email address OR user_id)
    let emailQuery = adminClient
      .from('email_messages')
      .select('*')
      .order('created_at', { ascending: true })

    if (userEmail) {
      // Search by email address (catches both inbound and outbound)
      if (userId) {
        emailQuery = emailQuery.or(`from_email.eq.${userEmail},to_email.eq.${userEmail},user_id.eq.${userId}`)
      } else {
        emailQuery = emailQuery.or(`from_email.eq.${userEmail},to_email.eq.${userEmail}`)
      }
    } else if (userId) {
      // Fallback to user_id only
      emailQuery = emailQuery.eq('user_id', userId)
    }

    const { data: emails } = await emailQuery

    // Fetch SMS messages (only if user_id exists)
    let smsMessages: any[] = []
    if (userId) {
      const { data: sms } = await adminClient
        .from('sms_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      smsMessages = sms || []
    }

    // Combine and sort all messages by timestamp
    const allMessages: any[] = []

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

    // Add SMS messages
    smsMessages.forEach((sms) => {
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
  } catch (error: any) {
    console.error('❌ Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

