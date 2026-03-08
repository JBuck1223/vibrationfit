export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isUserAdmin } from '@/lib/supabase/admin'
import { queryRecipients, type BlastFilters } from '@/lib/crm/blast-filters'
import { sendAndLogEmail } from '@/lib/email/send'
import { getSenderById, DEFAULT_CRM_SENDER } from '@/lib/crm/senders'

const MAX_RECIPIENTS = 500
const SYNC_THRESHOLD = 50

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

    const { filters, subject, textBody, senderId } = (await request.json()) as {
      filters: BlastFilters
      subject: string
      textBody: string
      senderId?: string
    }
    const sender = getSenderById(senderId || DEFAULT_CRM_SENDER.id)

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

    const admin = createAdminClient()
    const now = new Date().toISOString()

    const { data: campaign, error: campaignError } = await admin
      .from('messaging_campaigns')
      .insert({
        name: `Blast: ${subject.slice(0, 80)}`,
        channel: 'email',
        template_id: null,
        subject,
        text_body: textBody,
        sender_id: sender.id,
        audience_filter: filters,
        audience_count: recipients.length,
        status: 'sending',
        sent_count: 0,
        failed_count: 0,
        created_by: user.id,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single()

    if (campaignError || !campaign) {
      console.error('[blast] Failed to create campaign:', campaignError)
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    // Small sends: fire immediately, no queue delay
    if (recipients.length <= SYNC_THRESHOLD) {
      return await sendSync(admin, campaign.id, recipients, { subject, textBody, sender })
    }

    // Large sends: queue for background processing by the cron
    return await sendQueued(admin, campaign.id, recipients, { subject, textBody, userId: user.id })
  } catch (error: unknown) {
    console.error('Error creating blast:', error)
    const msg = error instanceof Error ? error.message : 'Failed to create blast'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ── Synchronous path (≤50 recipients) ──

async function sendSync(
  admin: ReturnType<typeof createAdminClient>,
  campaignId: string,
  recipients: Awaited<ReturnType<typeof queryRecipients>>,
  opts: { subject: string; textBody: string; sender: ReturnType<typeof getSenderById> }
) {
  const BATCH = 10
  let sent = 0
  let failed = 0

  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH)

    const settled = await Promise.allSettled(
      batch.map((r) =>
        sendAndLogEmail({
          to: r.email,
          subject: opts.subject,
          from: opts.sender.from,
          textBody: opts.textBody,
          replyTo: opts.sender.email,
          context: {
            userId: r.userId || undefined,
            guestEmail: r.email,
            campaignId,
          },
        })
      )
    )

    for (const result of settled) {
      if (result.status === 'fulfilled') sent++
      else failed++
    }

    if (i + BATCH < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  await admin
    .from('messaging_campaigns')
    .update({
      status: 'sent',
      sent_count: sent,
      failed_count: failed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  return NextResponse.json({ campaignId, recipientCount: recipients.length })
}

// ── Queued path (>50 recipients) ──

async function sendQueued(
  admin: ReturnType<typeof createAdminClient>,
  campaignId: string,
  recipients: Awaited<ReturnType<typeof queryRecipients>>,
  opts: { subject: string; textBody: string; userId: string }
) {
  const scheduledRows = recipients.map((r) => ({
    message_type: 'email',
    recipient_email: r.email,
    recipient_name: r.name,
    recipient_user_id: r.userId || null,
    subject: opts.subject,
    body: opts.textBody,
    text_body: opts.textBody,
    scheduled_for: new Date().toISOString(),
    status: 'pending',
    related_entity_type: 'campaign',
    related_entity_id: campaignId,
    created_by: opts.userId,
  }))

  const CHUNK = 200
  for (let i = 0; i < scheduledRows.length; i += CHUNK) {
    const chunk = scheduledRows.slice(i, i + CHUNK)
    const { error: insertError } = await admin
      .from('scheduled_messages')
      .insert(chunk)

    if (insertError) {
      console.error('[blast] Failed to insert scheduled_messages chunk:', insertError)
      await admin
        .from('messaging_campaigns')
        .update({ status: 'cancelled', error_log: insertError.message })
        .eq('id', campaignId)
      return NextResponse.json({ error: 'Failed to queue messages' }, { status: 500 })
    }
  }

  return NextResponse.json({ campaignId, recipientCount: recipients.length })
}
