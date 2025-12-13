// Get unified conversation thread for a member
// Combines: SMS messages, emails
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

    // Get member details (user_profiles) - optional, just for metadata
    const { data: member } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', id)
      .single()

    // Get user's email from auth.users
    const { data: authUser } = await adminClient.auth.admin.getUserById(id)
    const userEmail = authUser?.user?.email || member?.email

    // Fetch SMS messages for this member
    const { data: smsMessages } = await adminClient
      .from('sms_messages')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: true })

    // Fetch emails for this member (by email address OR user_id)
    let emailQuery = adminClient
      .from('email_messages')
      .select('*')
      .order('created_at', { ascending: true })

    if (userEmail) {
      // Search by email address (catches both inbound and outbound)
      emailQuery = emailQuery.or(`from_email.eq.${userEmail},to_email.eq.${userEmail},user_id.eq.${id}`)
    } else {
      // Fallback to user_id only
      emailQuery = emailQuery.eq('user_id', id)
    }

    const { data: emails } = await emailQuery

    // Combine and sort all messages
    const allMessages: any[] = []

    // Add SMS messages
    smsMessages?.forEach((sms) => {
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

    // Sort by timestamp
    allMessages.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    return NextResponse.json({
      conversation: allMessages,
      member: member ? {
        id: member.user_id,
        name: `${member.first_name} ${member.last_name}`.trim(),
        email: member.email,
        phone: member.phone,
      } : null,
    })
  } catch (error: any) {
    console.error('❌ Error fetching member conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

