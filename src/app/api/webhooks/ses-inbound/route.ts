// AWS SES Inbound Email Webhook
// Receives incoming emails via SNS notifications
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📨 SES Inbound webhook received')

    // Handle SNS subscription confirmation
    if (body.Type === 'SubscriptionConfirmation') {
      console.log('🔔 SNS Subscription confirmation received')
      console.log('Visit this URL to confirm:', body.SubscribeURL)
      
      // Auto-confirm subscription
      if (body.SubscribeURL) {
        const response = await fetch(body.SubscribeURL)
        if (response.ok) {
          console.log('✅ SNS subscription confirmed automatically')
        }
      }
      
      return NextResponse.json({ message: 'Subscription confirmed' })
    }

    // Handle SNS notification (actual email)
    if (body.Type === 'Notification') {
      const message = JSON.parse(body.Message)
      
      console.log('📧 Email received:', {
        from: message.mail?.source,
        to: message.mail?.destination,
        subject: message.mail?.commonHeaders?.subject,
        messageId: message.mail?.messageId,
      })

      // Parse email details
      const from = message.mail?.source || 'unknown@sender.com'
      const to = message.mail?.destination?.[0] || 'team@vibrationfit.com'
      const subject = message.mail?.commonHeaders?.subject || '(No Subject)'
      const messageId = message.mail?.messageId
      
      // Get email content (SES provides it in S3 or directly)
      let bodyText = ''
      let bodyHtml = ''
      
      if (message.content) {
        // Email content is provided directly
        bodyText = extractTextFromContent(message.content)
        bodyHtml = extractHtmlFromContent(message.content)
      }

      // Find user by email
      const adminClient = createAdminClient()
      const { data: profiles } = await adminClient
        .from('user_profiles')
        .select('user_id, email')
        .eq('email', from)
        .limit(1)

      const userId = profiles?.[0]?.user_id || null

      // Extract ticket number from subject if it exists
      const ticketMatch = subject.match(/\[([A-Z]+-\d+)\]/)
      const ticketNumber = ticketMatch?.[1]

      let ticketId = null
      if (ticketNumber) {
        const { data: ticket } = await adminClient
          .from('support_tickets')
          .select('id')
          .eq('ticket_number', ticketNumber)
          .single()
        
        ticketId = ticket?.id
      }

      // Log email to database
      const { error: logError } = await adminClient
        .from('email_messages')
        .insert({
          user_id: userId,
          guest_email: !userId ? from : null,
          from_email: from,
          to_email: to,
          subject,
          body_text: bodyText,
          body_html: bodyHtml,
          direction: 'inbound',
          status: 'received',
          ses_message_id: messageId,
          is_reply: !!ticketNumber,
          // If we found a ticket, we could link it here
        })

      if (logError) {
        console.error('❌ Failed to log inbound email:', logError)
        return NextResponse.json({ error: 'Failed to log email' }, { status: 500 })
      }

      console.log('✅ Inbound email logged successfully')

      // If this is a ticket reply, create a support_ticket_reply
      if (ticketId) {
        const { error: replyError } = await adminClient
          .from('support_ticket_replies')
          .insert({
            ticket_id: ticketId,
            user_id: userId,
            message: bodyText,
            is_staff: false,
          })

        if (replyError) {
          console.error('❌ Failed to create ticket reply:', replyError)
        } else {
          console.log('✅ Created ticket reply for:', ticketNumber)
        }
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ message: 'Unknown notification type' })
  } catch (error: any) {
    console.error('❌ SES webhook error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

// Helper functions to parse email content
function extractTextFromContent(content: string): string {
  try {
    // SES provides email in MIME format
    // Extract text/plain part
    const textMatch = content.match(/Content-Type: text\/plain[\s\S]*?\n\n([\s\S]*?)(?=\n--)/i)
    return textMatch?.[1]?.trim() || content
  } catch {
    return content
  }
}

function extractHtmlFromContent(content: string): string {
  try {
    // Extract text/html part
    const htmlMatch = content.match(/Content-Type: text\/html[\s\S]*?\n\n([\s\S]*?)(?=\n--)/i)
    return htmlMatch?.[1]?.trim() || ''
  } catch {
    return ''
  }
}

