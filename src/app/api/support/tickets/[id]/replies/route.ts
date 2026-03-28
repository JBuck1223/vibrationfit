// API route for support ticket replies
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { sendAndLogEmail } from '@/lib/email/send'
import { generatePersonalMessageEmail } from '@/lib/email/templates/personal-message'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params

    const auth = await verifyAdminAccess()
    const isAdmin = !('error' in auth)

    if ('error' in auth && auth.status === 401) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const adminClient = createAdminClient()

    if (!isAdmin) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { data: ticket, error: ticketError } = await adminClient
        .from('support_tickets')
        .select('user_id')
        .eq('id', ticketId)
        .single()

      if (ticketError || !ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      }

      if (ticket.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { data: replies, error } = await adminClient
      .from('support_ticket_replies')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching replies:', error)
      return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 })
    }

    const formattedReplies = (replies || []).map(reply => ({
      id: reply.id,
      ticket_id: reply.ticket_id,
      admin_id: reply.user_id,
      reply: reply.message,
      is_internal: reply.is_staff,
      attachments: reply.attachments || [],
      created_at: reply.created_at,
      admin: { email: 'Admin' },
    }))

    return NextResponse.json({ replies: formattedReplies })
  } catch (error: unknown) {
    console.error('Error in replies GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params
    const auth = await verifyAdminAccess()
    const isAdmin = !('error' in auth)

    if ('error' in auth && auth.status === 401) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    let user
    if (!('error' in auth)) {
      user = auth.user
    } else {
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      user = data.user
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Get ticket details
    const { data: ticket, error: ticketError } = await adminClient
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      console.error('Error fetching ticket:', ticketError)
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Must be admin or ticket owner
    if (!isAdmin && ticket.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { reply, is_internal, attachments } = body

    if (!reply || !reply.trim()) {
      return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 400 })
    }

    const insertData: Record<string, unknown> = {
      ticket_id: ticketId,
      user_id: user.id,
      message: reply,
      is_staff: isAdmin,
    }
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      insertData.attachments = attachments
    }

    const { data: newReply, error: replyError } = await adminClient
      .from('support_ticket_replies')
      .insert(insertData)
      .select()
      .single()

    if (replyError) {
      console.error('Error inserting reply:', replyError)
      return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 })
    }

    // Send email notification to customer (only for admin replies that aren't internal)
    if (isAdmin && !is_internal) {
      try {
        const customerEmail = ticket.guest_email
        const appUrl = 'https://vibrationfit.com'
        const ticketUrl = `${appUrl}/support/tickets/${ticketId}`

        if (customerEmail) {
          const emailContent = await generatePersonalMessageEmail({
            recipientName: undefined,
            senderName: 'Vibration Fit Support Team',
            messageBody: `We've added a new response to your support ticket ${ticket.ticket_number}: "${ticket.subject}"\n\nView your ticket and reply here:\n${ticketUrl}`,
            closingLine: 'Best regards,',
          })

          await sendAndLogEmail({
            to: customerEmail,
            subject: `Re: ${ticket.subject} [${ticket.ticket_number}]`,
            htmlBody: emailContent.htmlBody,
            textBody: emailContent.textBody,
            replyTo: 'team@vibrationfit.com',
            context: { userId: ticket.user_id, isReply: true },
          })
        }
      } catch (emailError) {
        console.error('Error sending reply notification email:', emailError)
      }
    }

    const formattedReply = {
      id: newReply.id,
      ticket_id: newReply.ticket_id,
      admin_id: newReply.user_id,
      reply: newReply.message,
      is_internal: newReply.is_staff,
      attachments: newReply.attachments || [],
      created_at: newReply.created_at,
      admin: { email: user.email },
    }

    return NextResponse.json({ reply: formattedReply })
  } catch (error: unknown) {
    console.error('Error in replies POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { replyId, message, attachments } = body

    if (!replyId) {
      return NextResponse.json({ error: 'replyId is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const updateData: Record<string, unknown> = {}
    if (message !== undefined) updateData.message = message
    if (attachments !== undefined) updateData.attachments = attachments

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: updated, error } = await adminClient
      .from('support_ticket_replies')
      .update(updateData)
      .eq('id', replyId)
      .eq('ticket_id', ticketId)
      .select()
      .single()

    if (error || !updated) {
      console.error('Error updating reply:', error)
      return NextResponse.json({ error: 'Failed to update reply' }, { status: 500 })
    }

    return NextResponse.json({
      reply: {
        id: updated.id,
        ticket_id: updated.ticket_id,
        admin_id: updated.user_id,
        reply: updated.message,
        is_internal: updated.is_staff,
        attachments: updated.attachments || [],
        created_at: updated.created_at,
      },
    })
  } catch (error: unknown) {
    console.error('Error in replies PATCH API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
