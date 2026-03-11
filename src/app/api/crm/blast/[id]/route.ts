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

    const { data: emailRows } = await admin
      .from('email_messages')
      .select('id, to_email, status, sent_at, delivered_at, opened_at, clicked_at')
      .eq('campaign_id', campaignId)

    const emails = emailRows || []

    const stats = {
      total: emails.length,
      delivered: 0,
      bounced: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
    }

    for (const e of emails) {
      switch (e.status) {
        case 'delivered':
          stats.delivered++
          break
        case 'opened':
          stats.delivered++
          stats.opened++
          break
        case 'clicked':
          stats.delivered++
          stats.opened++
          stats.clicked++
          break
        case 'bounced':
          stats.bounced++
          break
        case 'failed':
          stats.failed++
          break
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
        subject: campaign.subject,
        senderId: campaign.sender_id,
        audienceCount: campaign.audience_count,
        sentCount: campaign.sent_count,
        failedCount: campaign.failed_count,
        status: campaign.status,
        createdAt: campaign.created_at,
        updatedAt: campaign.updated_at,
      },
      stats,
      pending: pendingCount || 0,
      recipients: emails.map((e) => ({
        email: e.to_email,
        status: e.status,
        sentAt: e.sent_at,
        deliveredAt: e.delivered_at,
        openedAt: e.opened_at,
        clickedAt: e.clicked_at,
      })),
    })
  } catch (error: unknown) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
