// /src/app/api/support/tickets/route.ts
// Support ticket creation API (public + authenticated)

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { sendAndLogEmail } from '@/lib/email/send'
import { generateSupportTicketCreatedEmail } from '@/lib/email/templates/support-ticket-created'
import { triggerEvent } from '@/lib/messaging/events'
import { createAdminNotification } from '@/lib/admin/notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Try to get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Validate required fields
    if (!body.subject || !body.description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      )
    }

    // If no user, require email
    if (!user && !body.guest_email) {
      return NextResponse.json(
        { error: 'Email is required for non-logged-in users' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS for ticket creation
    const adminClient = createAdminClient()
    
    // Create ticket - ALWAYS populate guest_email for easy replies
    const email = user?.email || body.guest_email
    
    const { data: ticket, error } = await adminClient
      .from('support_tickets')
      .insert({
        user_id: user?.id || null,
        guest_email: email,
        subject: body.subject,
        description: body.description,
        priority: body.priority || 'normal',
        category: body.category || 'other',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating ticket:', error)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    // Send confirmation email using database template
    try {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'https://vibrationfit.com'

      const ticketUrl = `${appUrl}/support/tickets/${ticket.id}`

      const emailData = await generateSupportTicketCreatedEmail({
        ticketNumber: ticket.ticket_number,
        ticketSubject: ticket.subject,
        ticketStatus: ticket.status,
        ticketUrl,
      })

      await sendAndLogEmail({
        to: email,
        subject: emailData.subject,
        htmlBody: emailData.htmlBody,
        textBody: emailData.textBody,
        replyTo: 'team@vibrationfit.com',
        context: { userId: user?.id, guestEmail: !user ? email : undefined },
      })
    } catch (emailError: unknown) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail ticket creation if email fails
    }

    triggerEvent('support.ticket_created', {
      email: ticket.email || user?.email || undefined,
      userId: user?.id || undefined,
      name: ticket.name || undefined,
    }).catch((err) => console.error('triggerEvent error:', err))

    createAdminNotification({
      type: 'support_ticket',
      title: `New Support Ticket: ${body.subject}`,
      body: email || undefined,
      metadata: { ticketId: ticket.id, subject: body.subject, priority: body.priority || 'normal' },
      link: '/admin/crm/support/board',
    }).catch(err => console.error('Admin notification DB error:', err))

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error in create ticket API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    const isAdmin = !('error' in auth)

    if ('error' in auth && auth.status === 401) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const adminClient = createAdminClient()

    let query = adminClient
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      query = query.eq('user_id', user.id)
    }

    const { data: tickets, error } = await query

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    return NextResponse.json({ tickets })
  } catch (error: unknown) {
    console.error('Error in tickets API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
