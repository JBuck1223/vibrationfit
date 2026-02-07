// Get unified conversation thread for a member
// Combines: SMS messages, emails
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

    // Get member details and auth user in parallel
    const [{ data: member }, { data: authUser }] = await Promise.all([
      adminClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', id)
        .single(),
      adminClient.auth.admin.getUserById(id),
    ])

    const userEmail = authUser?.user?.email || member?.email

    // Fetch SMS and emails in parallel
    const [{ data: smsMessages }, { data: emails }] = await Promise.all([
      adminClient
        .from('sms_messages')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: true }),
      // Use quoted values in .or() to prevent filter injection
      userEmail
        ? adminClient
            .from('email_messages')
            .select('*')
            .or(`from_email.eq."${userEmail}",to_email.eq."${userEmail}",user_id.eq.${id}`)
            .order('created_at', { ascending: true })
        : adminClient
            .from('email_messages')
            .select('*')
            .eq('user_id', id)
            .order('created_at', { ascending: true }),
    ])

    // Combine and sort all messages
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
  } catch (error: unknown) {
    console.error('Error fetching member conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
