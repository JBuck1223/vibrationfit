export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { queryRecipients, type BlastFilters } from '@/lib/crm/blast-filters'
import { getSenderById, DEFAULT_CRM_SENDER } from '@/lib/crm/senders'
import { applyVariables } from '@/lib/messaging/templates'
import { filterSuppressed } from '@/lib/messaging/suppressions'
import type { BlastRecipient } from '@/lib/crm/blast-filters'

type BlastChannel = 'email' | 'sms' | 'both'

function recipientVars(r: BlastRecipient, referralLink?: string): Record<string, string> {
  return {
    first_name: r.firstName || r.name.split(' ')[0] || '',
    firstName: r.firstName || r.name.split(' ')[0] || '',
    name: r.name,
    email: r.email,
    referralLink: referralLink || '',
  }
}

const MAX_RECIPIENTS = 100_000

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { user } = auth

    const { filters, subject, textBody, smsBody, senderId, excludeSegmentId, channel: rawChannel, scheduledFor } = (await request.json()) as {
      filters: BlastFilters
      subject?: string
      textBody?: string
      smsBody?: string
      senderId?: string
      excludeSegmentId?: string
      channel?: BlastChannel
      scheduledFor?: string
    }

    const channel: BlastChannel = rawChannel || 'email'
    const sender = getSenderById(senderId || DEFAULT_CRM_SENDER.id)
    const sendsEmail = channel === 'email' || channel === 'both'
    const sendsSms = channel === 'sms' || channel === 'both'

    if (!filters?.audience) {
      return NextResponse.json({ error: 'Audience is required' }, { status: 400 })
    }
    if (sendsEmail && !subject) {
      return NextResponse.json({ error: 'Subject is required for email' }, { status: 400 })
    }
    if (sendsEmail && !textBody) {
      return NextResponse.json({ error: 'Message body is required for email' }, { status: 400 })
    }
    if (sendsSms && !smsBody) {
      return NextResponse.json({ error: 'SMS body is required' }, { status: 400 })
    }

    const allRecipients = await queryRecipients({ ...filters, exclude_segment_id: excludeSegmentId })

    if (allRecipients.length === 0) {
      return NextResponse.json({ error: 'No matching recipients' }, { status: 400 })
    }

    // Filter email suppressions (applies to email channel)
    let emailRecipients = allRecipients
    let suppressedCount = 0
    if (sendsEmail) {
      const { allowed, suppressed } = await filterSuppressed(allRecipients)
      emailRecipients = allowed
      suppressedCount = suppressed.length
    }

    // Filter SMS recipients to those with phone + sms_opt_in
    const smsRecipients = sendsSms
      ? allRecipients.filter(r => r.phone && r.smsOptIn)
      : []

    const totalRecipients = sendsEmail ? emailRecipients.length : smsRecipients.length
    if (sendsEmail && emailRecipients.length === 0 && !sendsSms) {
      return NextResponse.json(
        { error: `All ${suppressedCount} recipients are suppressed` },
        { status: 400 }
      )
    }
    if (sendsSms && smsRecipients.length === 0 && !sendsEmail) {
      return NextResponse.json(
        { error: 'No recipients with phone number and SMS opt-in' },
        { status: 400 }
      )
    }

    if (totalRecipients > MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `Too many recipients (${totalRecipients}). Maximum is ${MAX_RECIPIENTS.toLocaleString()}.` },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const now = new Date().toISOString()
    const sendAt = scheduledFor || now
    const isScheduled = scheduledFor ? new Date(scheduledFor) > new Date() : false

    // Resolve referral links for email recipients
    const referralMap = new Map<string, string>()
    if (sendsEmail && emailRecipients.length > 0) {
      const emails = emailRecipients.map(r => r.email).filter(Boolean)
      const REFERRAL_CHUNK = 500
      for (let i = 0; i < emails.length; i += REFERRAL_CHUNK) {
        const batch = emails.slice(i, i + REFERRAL_CHUNK)
        const { data: referralRows } = await admin
          .from('referral_participants')
          .select('email, referral_code')
          .in('email', batch)
          .eq('is_active', true)
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'
        for (const row of referralRows || []) {
          referralMap.set(row.email, `${siteUrl}/offer/launch?ref=${row.referral_code}`)
        }
      }
    }

    const campaignName = sendsEmail
      ? `Blast: ${(subject || 'SMS Blast').slice(0, 80)}`
      : `SMS Blast: ${(smsBody || '').slice(0, 80)}`

    const { data: campaign, error: campaignError } = await admin
      .from('messaging_campaigns')
      .insert({
        name: campaignName,
        channel,
        template_id: null,
        subject: subject || null,
        text_body: textBody || null,
        sms_body: smsBody || null,
        sender_id: sender.id,
        audience_filter: filters,
        audience_count: Math.max(emailRecipients.length, smsRecipients.length),
        status: isScheduled ? 'scheduled' : 'sending',
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

    const scheduledRows: Record<string, unknown>[] = []

    // Queue email messages
    if (sendsEmail) {
      for (const r of emailRecipients) {
        const vars = recipientVars(r, referralMap.get(r.email))
        scheduledRows.push({
          message_type: 'email',
          recipient_email: r.email,
          recipient_name: r.name,
          recipient_user_id: r.userId || null,
          subject: applyVariables(subject!, vars),
          body: applyVariables(textBody!, vars),
          text_body: applyVariables(textBody!, vars),
          scheduled_for: sendAt,
          status: 'pending',
          related_entity_type: 'campaign',
          related_entity_id: campaign.id,
          created_by: user.id,
          sender_email: sender.from,
        })
      }
    }

    // Queue SMS messages
    if (sendsSms) {
      for (const r of smsRecipients) {
        const vars = recipientVars(r, referralMap.get(r.email))
        scheduledRows.push({
          message_type: 'sms',
          recipient_phone: r.phone,
          recipient_name: r.name,
          recipient_user_id: r.userId || null,
          body: applyVariables(smsBody!, vars),
          scheduled_for: sendAt,
          status: 'pending',
          related_entity_type: 'campaign',
          related_entity_id: campaign.id,
          created_by: user.id,
        })
      }
    }

    // Parallel chunked insert
    const CHUNK = 1000
    const PARALLEL = 3
    for (let i = 0; i < scheduledRows.length; i += CHUNK * PARALLEL) {
      const parallelChunks = []
      for (let p = 0; p < PARALLEL; p++) {
        const start = i + p * CHUNK
        if (start >= scheduledRows.length) break
        parallelChunks.push(scheduledRows.slice(start, start + CHUNK))
      }

      const results = await Promise.all(
        parallelChunks.map((chunk) =>
          admin.from('scheduled_messages').insert(chunk)
        )
      )

      const insertError = results.find((r) => r.error)?.error
      if (insertError) {
        console.error('[blast] Failed to insert scheduled_messages chunk:', insertError)
        await admin
          .from('messaging_campaigns')
          .update({ status: 'cancelled', error_log: insertError.message })
          .eq('id', campaign.id)
        return NextResponse.json({ error: 'Failed to queue messages' }, { status: 500 })
      }
    }

    return NextResponse.json({
      campaignId: campaign.id,
      recipientCount: sendsEmail ? emailRecipients.length : smsRecipients.length,
      emailCount: sendsEmail ? emailRecipients.length : 0,
      smsCount: sendsSms ? smsRecipients.length : 0,
      suppressedCount,
      channel,
      ...(isScheduled && { scheduledFor: sendAt }),
    })
  } catch (error: unknown) {
    console.error('Error creating blast:', error)
    const msg = error instanceof Error ? error.message : 'Failed to create blast'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
