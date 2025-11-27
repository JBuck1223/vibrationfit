// /src/app/api/support/tickets/route.ts

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/lib/supabase/admin'
// Support ticket creation API (public + authenticated)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/aws-ses'

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

    // Create ticket
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user?.id || null,
        guest_email: !user ? body.guest_email : null,
        subject: body.subject,
        description: body.description,
        priority: body.priority || 'normal',
        category: body.category || 'other',
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating ticket:', error)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    console.log('✅ Ticket created:', ticket.ticket_number)

    // Send confirmation email
    try {
      const email = user?.email || body.guest_email
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'https://vibrationfit.com'

      const ticketUrl = user
        ? `${appUrl}/dashboard/support/${ticket.id}`
        : `${appUrl}/support/ticket/${ticket.id}`

      await sendEmail({
        to: email,
        subject: `Support Ticket Created: ${ticket.ticket_number}`,
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #199D67;">Support Ticket Created</h2>
            <p style="color: #333; line-height: 1.6;">
              Your support ticket <strong>${ticket.ticket_number}</strong> has been created.
            </p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #666;"><strong>Subject:</strong></p>
              <p style="margin: 5px 0 15px 0; color: #333;">${ticket.subject}</p>
              <p style="margin: 0; color: #666;"><strong>Status:</strong></p>
              <p style="margin: 5px 0 0 0; color: #333;">${ticket.status}</p>
            </div>
            <p style="color: #333; line-height: 1.6;">
              We'll respond as soon as possible. You can view your ticket here:
            </p>
            <div style="margin: 30px 0;">
              <a href="${ticketUrl}" style="background-color: #199D67; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; display: inline-block;">
                View Ticket
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Best,<br>
              VibrationFit Support Team
            </p>
          </div>
        `,
        textBody: `Support Ticket Created\n\nYour ticket ${ticket.ticket_number} has been created.\n\nSubject: ${ticket.subject}\nStatus: ${ticket.status}\n\nView your ticket: ${ticketUrl}\n\nBest,\nVibrationFit Support Team`,
      })

      console.log('✅ Confirmation email sent')
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError)
      // Don't fail ticket creation if email fails
    }

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Error in create ticket API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Use admin client for database queries (bypasses RLS)
    const adminClient = createAdminClient()

    let query = adminClient
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    // If not admin, only show their tickets
    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { data: tickets, error } = await query

    if (error) {
      console.error('❌ Error fetching tickets:', error)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    return NextResponse.json({ tickets })
  } catch (error: any) {
    console.error('❌ Error in tickets API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

