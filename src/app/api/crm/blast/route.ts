export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { queryRecipients, type BlastFilters } from '@/lib/crm/blast-filters'
import { sendAndLogEmail } from '@/lib/email/send'
import { getSenderById, DEFAULT_CRM_SENDER } from '@/lib/crm/senders'
import { applyVariables } from '@/lib/messaging/templates'
import type { BlastRecipient } from '@/lib/crm/blast-filters'

function recipientVars(r: BlastRecipient, referralLink?: string): Record<string, string> {
  return {
    first_name: r.firstName || r.name.split(' ')[0] || '',
    firstName: r.firstName || r.name.split(' ')[0] || '',
    name: r.name,
    email: r.email,
    referralLink: referralLink || '',
  }
}

const MAX_RECIPIENTS = 500
const SYNC_THRESHOLD = 50

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { user } = auth

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

    // Pre-fetch referral codes so {{referralLink}} can be populated per recipient
    const emails = recipients.map(r => r.email).filter(Boolean)
    const referralMap = new Map<string, string>()
    if (emails.length > 0) {
      const { data: referralRows } = await admin
        .from('referral_participants')
        .select('email, referral_code')
        .in('email', emails)
        .eq('is_active', true)
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'
      for (const row of referralRows || []) {
        referralMap.set(row.email, `${siteUrl}/offer/launch?ref=${row.referral_code}`)
      }
    }

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
      return await sendSync(admin, campaign.id, recipients, { subject, textBody, sender, referralMap })
    }

    // Large sends: queue for background processing by the cron
    return await sendQueued(admin, campaign.id, recipients, { subject, textBody, userId: user.id, referralMap })
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
  opts: { subject: string; textBody: string; sender: ReturnType<typeof getSenderById>; referralMap: Map<string, string> }
) {
  const BATCH = 10
  let sent = 0
  let failed = 0

  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH)

    const settled = await Promise.allSettled(
      batch.map((r) => {
        const vars = recipientVars(r, opts.referralMap.get(r.email))
        return sendAndLogEmail({
          to: r.email,
          subject: applyVariables(opts.subject, vars),
          from: opts.sender.from,
          textBody: applyVariables(opts.textBody, vars),
          replyTo: opts.sender.email,
          context: {
            userId: r.userId || undefined,
            guestEmail: r.email,
            campaignId,
          },
        })
      })
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
  opts: { subject: string; textBody: string; userId: string; referralMap: Map<string, string> }
) {
  const scheduledRows = recipients.map((r) => {
    const vars = recipientVars(r, opts.referralMap.get(r.email))
    return {
      message_type: 'email',
      recipient_email: r.email,
      recipient_name: r.name,
      recipient_user_id: r.userId || null,
      subject: applyVariables(opts.subject, vars),
      body: applyVariables(opts.textBody, vars),
      text_body: applyVariables(opts.textBody, vars),
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      related_entity_type: 'campaign',
      related_entity_id: campaignId,
      created_by: opts.userId,
    }
  })

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
