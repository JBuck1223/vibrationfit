// /src/app/api/support/tickets/route.ts
// Support ticket creation API (public + authenticated)

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { sendAndLogEmail } from '@/lib/email/send'
import { generateSupportTicketCreatedEmail } from '@/lib/email/templates/support-ticket-created'
import { triggerEvent } from '@/lib/messaging/events'
import { createAdminNotification, notifyAdminSMS } from '@/lib/admin/notifications'
import { sendNotification } from '@/lib/notifications/config'
import { OUTBOUND_URL } from '@/lib/urls'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'support-tickets', 10)
  if (limited) return limited

  try {
    const body = await request.json()
    const supabase = await createClient()

    // Try to get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check if this is an admin creating on behalf of a member
    const auth = await verifyAdminAccess()
    const isAdmin = !('error' in auth)
    const isOnBehalf = isAdmin && body.on_behalf_of_user_id

    // Validate required fields (relaxed for admin-created tickets)
    if (!isAdmin && (!body.subject || !body.description)) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      )
    }

    // If no user, require email
    if (!user && !body.guest_email && !isOnBehalf) {
      return NextResponse.json(
        { error: 'Email is required for non-logged-in users' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS for ticket creation
    const adminClient = createAdminClient()

    let ticketUserId = user?.id || null
    let email = user?.email || body.guest_email

    // Admin creating on behalf of a member — look up the member's info
    if (isOnBehalf) {
      const { data: memberAuth } = await adminClient.auth.admin.getUserById(body.on_behalf_of_user_id)
      if (!memberAuth?.user) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 })
      }
      ticketUserId = body.on_behalf_of_user_id
      email = memberAuth.user.email || body.guest_email || email
    }
    
    const { data: ticket, error } = await adminClient
      .from('support_tickets')
      .insert({
        user_id: ticketUserId,
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
      const ticketUrl = `${OUTBOUND_URL}/support/tickets/${ticket.id}`

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
        context: { userId: ticketUserId || undefined, guestEmail: !ticketUserId ? email : undefined },
      })
    } catch (emailError: unknown) {
      console.error('Failed to send confirmation email:', emailError)
    }

    triggerEvent('support.ticket_created', {
      email: email || undefined,
      userId: ticketUserId || undefined,
    }).catch((err) => console.error('triggerEvent error:', err))

    // Skip admin self-notification when admin creates the ticket.
    // Use after() so Vercel keeps the isolate alive until SMS finishes.
    if (!isOnBehalf) {
      const isCoaching = body.category === 'coaching'
      const ticketSubject = body.subject as string
      const ticketPriority = (body.priority as string) || 'normal'
      const ticketCategory = body.category as string | undefined
      const ticketId = ticket.id as string
      const notifyEmail = email || undefined

      after(() =>
        Promise.all([
          createAdminNotification({
            type: 'support_ticket',
            title: isCoaching
              ? `Coaching Request: ${ticketSubject}`
              : `New Support Ticket: ${ticketSubject}`,
            body: notifyEmail,
            metadata: {
              ticketId,
              subject: ticketSubject,
              priority: ticketPriority,
              category: ticketCategory,
            },
            link: '/admin/crm/support/board',
          }),
          isCoaching
            ? notifyAdminSMS(
                `Coaching Request from ${notifyEmail || 'Unknown'}: "${ticketSubject}"`
              )
            : sendNotification({
                slug: 'support_ticket_created',
                variables: {
                  subject: ticketSubject,
                  email: notifyEmail || 'Unknown',
                  priority: ticketPriority,
                  ticketId,
                },
              }),
        ]).catch((err) => {
          console.error('[support/tickets] admin notification / SMS:', err)
        })
      )
    }

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
      .select('*, user_accounts(full_name, email), support_ticket_replies(attachments)')
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
