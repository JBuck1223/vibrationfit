export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id: campaignId } = await params
    const admin = createAdminClient()

    const { data: campaign, error: campaignError } = await admin
      .from('messaging_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const channel = campaign.channel || 'email'
    const sendsEmail = channel === 'email' || channel === 'both'
    const sendsSms = channel === 'sms' || channel === 'both'

    // Email stats
    const emailStats = {
      total: 0,
      delivered: 0,
      bounced: 0,
      complaint: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
    }

    let emailRecipients: { email: string; status: string; sentAt: string | null; deliveredAt: string | null; openedAt: string | null; clickedAt: string | null }[] = []

    if (sendsEmail) {
      const { data: emailRows } = await admin
        .from('email_messages')
        .select('id, to_email, status, sent_at, delivered_at, opened_at, clicked_at')
        .eq('campaign_id', campaignId)

      const emails = emailRows || []
      emailStats.total = emails.length

      for (const e of emails) {
        switch (e.status) {
          case 'delivered':
            emailStats.delivered++
            break
          case 'opened':
            emailStats.delivered++
            emailStats.opened++
            break
          case 'clicked':
            emailStats.delivered++
            emailStats.opened++
            emailStats.clicked++
            break
          case 'bounced':
            emailStats.bounced++
            break
          case 'complaint':
            emailStats.complaint++
            break
          case 'failed':
            emailStats.failed++
            break
        }
      }

      emailRecipients = emails.map((e) => ({
        email: e.to_email,
        status: e.status,
        sentAt: e.sent_at,
        deliveredAt: e.delivered_at,
        openedAt: e.opened_at,
        clickedAt: e.clicked_at,
      }))
    }

    // SMS stats
    const smsStats = {
      total: 0,
      sent: 0,
      failed: 0,
    }

    if (sendsSms) {
      const { data: smsRows } = await admin
        .from('message_send_log')
        .select('id, recipient_phone, status, sent_at')
        .eq('related_entity_id', campaignId)
        .eq('related_entity_type', 'campaign')
        .eq('message_type', 'sms')

      const sms = smsRows || []
      smsStats.total = sms.length
      for (const s of sms) {
        if (s.status === 'sent') smsStats.sent++
        else smsStats.failed++
      }
    }

    const { count: pendingCount } = await admin
      .from('scheduled_messages')
      .select('id', { count: 'exact', head: true })
      .eq('related_entity_id', campaignId)
      .eq('related_entity_type', 'campaign')
      .in('status', ['pending', 'processing'])

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        channel,
        subject: campaign.subject,
        smsBody: campaign.sms_body,
        senderId: campaign.sender_id,
        audienceCount: campaign.audience_count,
        sentCount: campaign.sent_count,
        failedCount: campaign.failed_count,
        status: campaign.status,
        createdAt: campaign.created_at,
        updatedAt: campaign.updated_at,
      },
      stats: emailStats,
      smsStats,
      pending: pendingCount || 0,
      recipients: emailRecipients,
    })
  } catch (error: unknown) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
