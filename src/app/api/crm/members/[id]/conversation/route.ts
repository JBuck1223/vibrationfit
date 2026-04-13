// Get unified conversation thread for a member
// Combines: SMS messages, emails
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

/**
 * Normalize any phone string to E.164 format (+1XXXXXXXXXX).
 * Handles: (325) 234-4785, 3252344785, +13252344785, 325-234-4785, etc.
 */
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return `+${digits}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const adminClient = createAdminClient()

    // Get member details from user_accounts (primary), user_profiles (fallback), and auth
    const [{ data: account }, { data: profile }, { data: authUser }] = await Promise.all([
      adminClient
        .from('user_accounts')
        .select('email, phone')
        .eq('id', id)
        .single(),
      adminClient
        .from('user_profiles')
        .select('email, phone')
        .eq('user_id', id)
        .eq('is_active', true)
        .eq('is_draft', false)
        .single(),
      adminClient.auth.admin.getUserById(id),
    ])

    const userEmail = account?.email || authUser?.user?.email || profile?.email
    const rawPhone = account?.phone || profile?.phone || authUser?.user?.phone
    const e164Phone = rawPhone ? toE164(rawPhone) : null

    // Build SMS query — match by user_id, and also by E.164 phone number
    // Twilio always stores numbers in E.164 format, so we normalize before matching
    let smsQuery = adminClient
      .from('sms_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (e164Phone) {
      smsQuery = smsQuery.or(`user_id.eq.${id},from_number.eq.${e164Phone},to_number.eq.${e164Phone}`)
    } else {
      smsQuery = smsQuery.eq('user_id', id)
    }

    // Fetch SMS and emails in parallel
    const [{ data: smsMessages }, { data: emails }] = await Promise.all([
      smsQuery,
      userEmail
        ? adminClient
            .from('email_messages')
            .select('*')
            .or(`from_email.eq."${userEmail}",to_email.eq."${userEmail}",user_id.eq.${id}`)
            .order('created_at', { ascending: false })
        : adminClient
            .from('email_messages')
            .select('*')
            .eq('user_id', id)
            .order('created_at', { ascending: false }),
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
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    const smsCount = allMessages.filter(m => m.type === 'sms').length
    const emailCount = allMessages.filter(m => m.type === 'email').length

    return NextResponse.json({
      conversation: allMessages,
      counts: { total: allMessages.length, sms: smsCount, email: emailCount },
      matchedOn: { email: userEmail || null, phone: e164Phone || null, rawPhone: rawPhone || null },
    })
  } catch (error: unknown) {
    console.error('Error fetching member conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
