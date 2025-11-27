// /src/app/api/support/tickets/[id]/replies/route.ts

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic'
// Ticket replies API

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/aws-ses'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Check permissions
    const isAdmin =
      user.email === 'buckinghambliss@gmail.com' ||
      user.email === 'admin@vibrationfit.com' ||
      user.user_metadata?.is_admin === true

    // Get ticket
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const isOwner = user.id === ticket.user_id

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create reply
    const { data: reply, error } = await supabase
      .from('support_ticket_replies')
      .insert({
        ticket_id: params.id,
        user_id: user.id,
        is_staff: isAdmin,
        message: body.message,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating reply:', error)
      return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 })
    }

    // Update ticket status if needed
    if (ticket.status === 'waiting_reply' && !isAdmin) {
      await supabase
        .from('support_tickets')
        .update({ status: 'in_progress' })
        .eq('id', params.id)
    }

    // Send email notification
    try {
      const recipientEmail = isAdmin
        ? ticket.user_id
          ? (await supabase.auth.admin.getUserById(ticket.user_id)).data.user?.email
          : ticket.guest_email
        : 'buckinghambliss@gmail.com' // Notify admin

      if (recipientEmail) {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          'https://vibrationfit.com'

        await sendEmail({
          to: recipientEmail,
          subject: `New Reply on Ticket ${ticket.ticket_number}`,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #199D67;">New Reply on Your Ticket</h2>
              <p style="color: #333;">
                Ticket: <strong>${ticket.ticket_number}</strong> - ${ticket.subject}
              </p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #333;">${body.message}</p>
              </div>
              <div style="margin: 30px 0;">
                <a href="${appUrl}/dashboard/support/${ticket.id}" style="background-color: #199D67; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; display: inline-block;">
                  View Ticket
                </a>
              </div>
            </div>
          `,
          textBody: `New reply on ticket ${ticket.ticket_number}\n\n${body.message}\n\nView ticket: ${appUrl}/dashboard/support/${ticket.id}`,
        })
      }
    } catch (emailError) {
      console.error('❌ Failed to send email notification:', emailError)
    }

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Error in create reply API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

