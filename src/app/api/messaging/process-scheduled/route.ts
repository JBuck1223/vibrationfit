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

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/aws-ses'
import { sendSMS } from '@/lib/messaging/twilio'
import { processSequenceSteps } from '@/lib/messaging/sequence-processor'

// Secret key for manual cron job authentication (optional)
const CRON_SECRET = process.env.CRON_SECRET

async function processMessages(request: NextRequest) {
  try {
    // Authenticate - Vercel cron, custom secret, or admin user
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')
    const supabase = await createClient()
    
    let isAuthorized = false
    
    // Check Vercel cron secret (automatically added by Vercel)
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
      isAuthorized = true
    }
    
    // Check custom cron secret header
    if (CRON_SECRET && cronSecret === CRON_SECRET) {
      isAuthorized = true
    }
    
    // In development, allow without auth for testing
    if (process.env.NODE_ENV === 'development') {
      isAuthorized = true
    }
    
    // Check if user is admin (for manual triggers)
    if (!isAuthorized) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: account } = await supabase
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

    // Get pending messages that are due
    const now = new Date().toISOString()
    
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(50) // Process in batches

    if (fetchError) {
      console.error('Error fetching scheduled messages:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      return NextResponse.json({ 
        message: 'No pending messages to process',
        processed: 0 
      })
    }

    console.log(`📨 Processing ${pendingMessages.length} scheduled messages...`)

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const message of pendingMessages) {
      results.processed++
      
      try {
        // Mark as processing to prevent duplicate sends
        await supabase
          .from('scheduled_messages')
          .update({ status: 'processing' })
          .eq('id', message.id)

        if (message.message_type === 'email') {
          // Send email
          if (!message.recipient_email) {
            throw new Error('No recipient email')
          }

          await sendEmail({
            to: message.recipient_email,
            subject: message.subject || 'VibrationFit Reminder',
            htmlBody: message.body,
            textBody: message.text_body || message.body.replace(/<[^>]*>/g, ''),
          })

          console.log(`✅ Email sent to ${message.recipient_email}`)
          
        } else if (message.message_type === 'sms') {
          // Send SMS
          if (!message.recipient_phone) {
            throw new Error('No recipient phone')
          }

          await sendSMS({
            to: message.recipient_phone,
            body: message.body,
          })

          console.log(`✅ SMS sent to ${message.recipient_phone}`)
        }

        // Mark as sent
        await supabase
          .from('scheduled_messages')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', message.id)

        // Log the send
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
        console.error(`❌ Failed to send message ${message.id}:`, errorMessage)
        
        // Update retry count and status
        const newRetryCount = (message.retry_count || 0) + 1
        const maxRetries = 3
        
        await supabase
          .from('scheduled_messages')
          .update({ 
            status: newRetryCount >= maxRetries ? 'failed' : 'pending',
            retry_count: newRetryCount,
            error_message: errorMessage
          })
          .eq('id', message.id)

        results.failed++
        results.errors.push(`${message.id}: ${errorMessage}`)
      }
    }

    console.log(`📊 Processing complete: ${results.sent} sent, ${results.failed} failed`)

    // --- Process sequence enrollments ---
    let sequenceResults = { processed: 0, sent: 0, completed: 0, skipped: 0, errors: 0 }
    try {
      sequenceResults = await processSequenceSteps()
    } catch (seqErr) {
      console.error('Error processing sequences:', seqErr)
    }

    return NextResponse.json({
      message: 'Processing complete',
      ...results,
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

// POST handler
export async function POST(request: NextRequest) {
  return processMessages(request)
}

// GET handler (for Vercel cron - cron jobs use GET)
export async function GET(request: NextRequest) {
  return processMessages(request)
}

