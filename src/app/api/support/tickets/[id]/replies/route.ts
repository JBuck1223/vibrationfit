// API route for support ticket replies
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/aws-ses'
import { generatePersonalMessageEmail } from '@/lib/email/templates/personal-message'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params
    console.log('🔍 Fetching replies for ticket:', ticketId)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('❌ No user authenticated')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.email)

    const adminClient = createAdminClient()

    const { data: replies, error } = await adminClient
      .from('support_ticket_replies')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ Database error fetching replies:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch replies', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Found replies:', replies?.length || 0)

    // Map to frontend format
    const formattedReplies = (replies || []).map(reply => ({
      id: reply.id,
      ticket_id: reply.ticket_id,
      admin_id: reply.user_id,
      reply: reply.message,
      is_internal: reply.is_staff,
      created_at: reply.created_at,
      admin: { email: 'Admin' }, // Will show as "Admin" for now
    }))

    return NextResponse.json({ replies: formattedReplies })
  } catch (error: any) {
    console.error('❌ Error in replies GET API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const isAdmin =
      user.email === 'buckinghambliss@gmail.com' ||
      user.email === 'admin@vibrationfit.com' ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const body = await request.json()
    const { reply, is_internal } = body

    if (!reply || !reply.trim()) {
      return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 400 })
    }

    // Get ticket details
    const { data: ticket, error: ticketError } = await adminClient
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      console.error('❌ Error fetching ticket:', ticketError)
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Insert reply
    const { data: newReply, error: replyError } = await adminClient
      .from('support_ticket_replies')
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        message: reply,
        is_staff: is_internal || false,
      })
      .select()
      .single()

    if (replyError) {
      console.error('❌ Error inserting reply:', replyError)
      return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 })
    }

    // Send email notification to customer (only if not internal)
    if (!is_internal) {
      try {
        const customerEmail = ticket.guest_email

        if (customerEmail) {
          console.log('📤 Sending reply notification to:', customerEmail)

          const emailContent = generatePersonalMessageEmail({
            recipientName: undefined,
            senderName: 'VibrationFit Support Team',
            messageBody: `Thank you for contacting us. We've added a response to your support ticket ${ticket.ticket_number}:\n\n${reply}\n\nYou can view your ticket and reply at: ${process.env.NEXT_PUBLIC_APP_URL || 'https://vibrationfit.com'}/dashboard/support/tickets/${ticketId}`,
            closingLine: 'Best regards,',
          })

          await sendEmail({
            to: customerEmail,
            subject: `Re: ${ticket.subject} [${ticket.ticket_number}]`,
            htmlBody: emailContent.htmlBody,
            textBody: emailContent.textBody,
            replyTo: 'team@vibrationfit.com',
          })

          // Log sent email
          await adminClient.from('email_messages').insert({
            user_id: ticket.user_id,
            from_email: process.env.AWS_SES_FROM_EMAIL || 'team@vibrationfit.com',
            to_email: customerEmail,
            subject: `Re: ${ticket.subject} [${ticket.ticket_number}]`,
            body_text: emailContent.textBody,
            body_html: emailContent.htmlBody,
            direction: 'outbound',
            status: 'sent',
          })

          console.log('✅ Reply notification email sent to:', customerEmail)
        } else {
          console.log('⚠️ No email address found for ticket - skipping email notification')
        }
      } catch (emailError) {
        console.error('❌ Error sending reply notification email:', emailError)
        // Don't fail the request if email fails
      }
    } else {
      console.log('📝 Internal note - no email sent')
    }

    // Format response to match frontend expectations
    const formattedReply = {
      id: newReply.id,
      ticket_id: newReply.ticket_id,
      admin_id: newReply.user_id,
      reply: newReply.message,
      is_internal: newReply.is_staff,
      created_at: newReply.created_at,
      admin: { email: user.email },
    }

    return NextResponse.json({ reply: formattedReply })
  } catch (error: any) {
    console.error('❌ Error in replies POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
