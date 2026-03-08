/**
 * Process Scheduled Messages API
 * 
 * POST /api/messaging/process-scheduled
 * GET  /api/messaging/process-scheduled (for Vercel cron)
 * 
 * This endpoint processes pending scheduled messages that are due to be sent.
 * Called by Vercel cron every minute.
 * 
 * Security: Requires Vercel cron header, custom secret, or admin auth
 */

export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAndLogEmail } from '@/lib/email/send'
import { sendSMS } from '@/lib/messaging/twilio'
import { processSequenceSteps } from '@/lib/messaging/sequence-processor'
import { getSenderById, DEFAULT_CRM_SENDER } from '@/lib/crm/senders'

const CRON_SECRET = process.env.CRON_SECRET

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function processMessages(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')
    const isVercelCron = request.headers.get('x-vercel-cron') === '1'
      || request.headers.get('user-agent')?.includes('vercel-cron')
    
    let isAuthorized = false
    
    if (isVercelCron) {
      isAuthorized = true
    }
    
    if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) {
      isAuthorized = true
    }
    
    if (CRON_SECRET && cronSecret === CRON_SECRET) {
      isAuthorized = true
    }
    
    if (process.env.NODE_ENV === 'development') {
      isAuthorized = true
    }
    
    if (!isAuthorized) {
      const supabaseAuth = await createClient()
      const { data: { user } } = await supabaseAuth.auth.getUser()
      if (user) {
        const { data: account } = await supabaseAuth
          .from('user_accounts')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (account?.role === 'admin' || account?.role === 'super_admin') {
          isAuthorized = true
        }
      }
    }
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const now = new Date().toISOString()
    
    // ── 1. Regular (non-campaign) scheduled messages ──
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .or('related_entity_type.is.null,related_entity_type.neq.campaign')
      .order('scheduled_for', { ascending: true })
      .limit(50)

    if (fetchError) {
      console.error('Error fetching scheduled messages:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    if (pendingMessages && pendingMessages.length > 0) {
      console.log(`Processing ${pendingMessages.length} scheduled messages...`)

      for (const message of pendingMessages) {
        results.processed++
        
        try {
          await supabase
            .from('scheduled_messages')
            .update({ status: 'processing' })
            .eq('id', message.id)

          if (message.message_type === 'email') {
            if (!message.recipient_email) {
              throw new Error('No recipient email')
            }

            await sendAndLogEmail({
              to: message.recipient_email,
              subject: message.subject || 'VibrationFit Reminder',
              ...(message.text_body ? {} : { htmlBody: message.body }),
              textBody: message.text_body || message.body.replace(/<[^>]*>/g, ''),
              context: {
                userId: message.recipient_user_id || undefined,
                guestEmail: message.recipient_email,
              },
            })
            
          } else if (message.message_type === 'sms') {
            if (!message.recipient_phone) {
              throw new Error('No recipient phone')
            }

            await sendSMS({
              to: message.recipient_phone,
              body: message.body,
            })
          }

          await supabase
            .from('scheduled_messages')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', message.id)

          await supabase.from('message_send_log').insert({
            message_type: message.message_type,
            template_id: message.email_template_id || message.sms_template_id,
            recipient_email: message.recipient_email,
            recipient_phone: message.recipient_phone,
            recipient_name: message.recipient_name,
            recipient_user_id: message.recipient_user_id,
            related_entity_type: message.related_entity_type,
            related_entity_id: message.related_entity_id,
            subject: message.subject,
            status: 'sent',
            sent_at: new Date().toISOString(),
          })

          results.sent++

        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          console.error(`Failed to send message ${message.id}:`, errorMessage)
          
          const newRetryCount = (message.retry_count || 0) + 1
          const maxRetries = 3
          
          await supabase
            .from('scheduled_messages')
            .update({ 
              status: newRetryCount >= maxRetries ? 'failed' : 'pending',
              retry_count: newRetryCount,
              error_message: errorMessage,
            })
            .eq('id', message.id)

          results.failed++
          results.errors.push(`${message.id}: ${errorMessage}`)
        }
      }

      console.log(`Regular messages: ${results.sent} sent, ${results.failed} failed`)
    }

    // ── 2. Campaign blast messages (rate-limited) ──
    const campaignResults = await processCampaignMessages(supabase, now)

    // ── 3. Sequence enrollments ──
    let sequenceResults = { processed: 0, sent: 0, completed: 0, skipped: 0, errors: 0 }
    try {
      sequenceResults = await processSequenceSteps()
    } catch (seqErr) {
      console.error('Error processing sequences:', seqErr)
    }

    return NextResponse.json({
      message: 'Processing complete',
      ...results,
      campaigns: campaignResults,
      sequences: sequenceResults,
    })

  } catch (error) {
    console.error('Error processing scheduled messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const CAMPAIGN_CONCURRENCY = 10
const CAMPAIGN_BATCH_PAUSE_MS = 1000
const MAX_RETRIES = 3

async function processCampaignMessages(
  supabase: ReturnType<typeof createAdminClient>,
  now: string
) {
  const totals = { campaigns: 0, sent: 0, failed: 0 }

  const { data: campaignMessages, error } = await supabase
    .from('scheduled_messages')
    .select('*')
    .eq('status', 'pending')
    .eq('related_entity_type', 'campaign')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(200)

  if (error || !campaignMessages || campaignMessages.length === 0) {
    return totals
  }

  const byCampaign = new Map<string, typeof campaignMessages>()
  for (const msg of campaignMessages) {
    const cid = msg.related_entity_id as string
    if (!byCampaign.has(cid)) byCampaign.set(cid, [])
    byCampaign.get(cid)!.push(msg)
  }

  for (const [campaignId, messages] of byCampaign) {
    totals.campaigns++

    const { data: campaign } = await supabase
      .from('messaging_campaigns')
      .select('sender_id, sent_count, failed_count')
      .eq('id', campaignId)
      .single()

    const sender = getSenderById(campaign?.sender_id || DEFAULT_CRM_SENDER.id)
    let batchSent = campaign?.sent_count ?? 0
    let batchFailed = campaign?.failed_count ?? 0

    for (let i = 0; i < messages.length; i += CAMPAIGN_CONCURRENCY) {
      const batch = messages.slice(i, i + CAMPAIGN_CONCURRENCY)

      const ids = batch.map((m) => m.id)
      await supabase
        .from('scheduled_messages')
        .update({ status: 'processing' })
        .in('id', ids)

      const settled = await Promise.allSettled(
        batch.map(async (msg) => {
          if (!msg.recipient_email) throw new Error('No recipient email')

          await sendAndLogEmail({
            to: msg.recipient_email,
            subject: msg.subject || 'VibrationFit',
            from: sender.from,
            textBody: msg.text_body || msg.body.replace(/<[^>]*>/g, ''),
            ...(msg.text_body ? {} : { htmlBody: msg.body }),
            replyTo: sender.email,
            context: {
              userId: msg.recipient_user_id || undefined,
              guestEmail: msg.recipient_email,
              campaignId,
            },
          })

          await supabase
            .from('scheduled_messages')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', msg.id)
        })
      )

      for (let j = 0; j < settled.length; j++) {
        const result = settled[j]
        if (result.status === 'fulfilled') {
          batchSent++
        } else {
          batchFailed++
          const msg = batch[j]
          const errorMessage =
            result.reason instanceof Error ? result.reason.message : String(result.reason)
          const newRetryCount = (msg.retry_count || 0) + 1

          await supabase
            .from('scheduled_messages')
            .update({
              status: newRetryCount >= MAX_RETRIES ? 'failed' : 'pending',
              retry_count: newRetryCount,
              error_message: errorMessage,
            })
            .eq('id', msg.id)
        }
      }

      await supabase
        .from('messaging_campaigns')
        .update({
          sent_count: batchSent,
          failed_count: batchFailed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId)

      if (i + CAMPAIGN_CONCURRENCY < messages.length) {
        await sleep(CAMPAIGN_BATCH_PAUSE_MS)
      }
    }

    totals.sent += batchSent
    totals.failed += batchFailed

    const { count: remaining } = await supabase
      .from('scheduled_messages')
      .select('id', { count: 'exact', head: true })
      .eq('related_entity_id', campaignId)
      .eq('related_entity_type', 'campaign')
      .in('status', ['pending', 'processing'])

    if (!remaining || remaining === 0) {
      await supabase
        .from('messaging_campaigns')
        .update({ status: 'sent', updated_at: new Date().toISOString() })
        .eq('id', campaignId)

      console.log(`Campaign ${campaignId} complete: ${batchSent} sent, ${batchFailed} failed`)
    }
  }

  return totals
}

export async function POST(request: NextRequest) {
  return processMessages(request)
}

export async function GET(request: NextRequest) {
  return processMessages(request)
}
