export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isUserAdmin } from '@/lib/supabase/admin'
import { queryRecipients, type BlastFilters } from '@/lib/crm/blast-filters'
import { sendAndLogBulkEmail } from '@/lib/email/send'

const MAX_RECIPIENTS = 500

export async function POST(request: NextRequest) {
  try {
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

    const { filters, subject, textBody } = (await request.json()) as {
      filters: BlastFilters
      subject: string
      textBody: string
    }

    if (!filters?.audience) {
      return NextResponse.json({ error: 'Audience is required' }, { status: 400 })
    }
    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }
    if (!textBody) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
    }

    const recipients = await queryRecipients(filters)

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No matching recipients' }, { status: 400 })
    }

    if (recipients.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `Too many recipients (${recipients.length}). Maximum is ${MAX_RECIPIENTS}.` },
        { status: 400 }
      )
    }

    const bulkRecipients = recipients.map((r) => ({
      email: r.email,
      userId: r.userId,
    }))

    const results = await sendAndLogBulkEmail({
      recipients: bulkRecipients,
      subject,
      from: '"Jordan Buckingham" <jordan@vibrationfit.com>',
      textBody,
      replyTo: 'jordan@vibrationfit.com',
    })

    return NextResponse.json({
      success: true,
      sent: results.sent.length,
      failed: results.failed.length,
      errors: results.failed.map((f) => `${f.email}: ${f.error}`),
    })
  } catch (error: unknown) {
    console.error('Error sending blast:', error)
    const msg = error instanceof Error ? error.message : 'Failed to send blast'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
