// IMAP Email Sync - Pull inbound emails from Google Workspace
// Syncs replies to team@vibrationfit.com and matches to members

import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface EmailSyncResult {
  success: boolean
  newMessages: number
  errors: string[]
}

/**
 * Sync inbound emails from Google Workspace via IMAP
 */
export async function syncInboundEmails(): Promise<EmailSyncResult> {
  return new Promise((resolve) => {
    const result: EmailSyncResult = {
      success: true,
      newMessages: 0,
      errors: [],
    }

    // Check IMAP configuration
    if (!process.env.IMAP_HOST || !process.env.IMAP_USER || !process.env.IMAP_PASSWORD) {
      result.success = false
      result.errors.push('IMAP not configured')
      return resolve(result)
    }

    const imap = new Imap({
      user: process.env.IMAP_USER!,
      password: process.env.IMAP_PASSWORD!,
      host: process.env.IMAP_HOST!,
      port: parseInt(process.env.IMAP_PORT || '993'),
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    })

    imap.once('ready', () => {
      imap.openBox('INBOX', false, async (err, box) => {
        if (err) {
          result.success = false
          result.errors.push(`Failed to open inbox: ${err.message}`)
          imap.end()
          return resolve(result)
        }

        // Search for unread emails from the last 30 days
        imap.search(['UNSEEN', ['SINCE', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]], async (err, results) => {
          if (err) {
            result.success = false
            result.errors.push(`Search failed: ${err.message}`)
            imap.end()
            return resolve(result)
          }

          if (!results || results.length === 0) {
            console.log('📭 No new emails to sync')
            imap.end()
            return resolve(result)
          }

          console.log(`📬 Found ${results.length} new emails to sync`)

          const fetch = imap.fetch(results, { bodies: '', markSeen: true })

          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream) => {
              simpleParser(stream as any, async (err, parsed) => {
                if (err) {
                  result.errors.push(`Parse error: ${err.message}`)
                  return
                }

                try {
                  // Extract email data
                  const fromValue = Array.isArray(parsed.from) ? parsed.from[0] : parsed.from
                  const toValue = Array.isArray(parsed.to) ? parsed.to[0] : parsed.to
                  const fromEmail = fromValue?.value?.[0]?.address || ''
                  const toEmail = toValue?.value?.[0]?.address || ''
                  const subject = parsed.subject || '(No subject)'
                  const bodyText = parsed.text || ''
                  const bodyHtml = parsed.html || ''
                  const messageId = parsed.messageId || ''

                  // Check if already synced (deduplication)
                  const { data: existing } = await supabase
                    .from('email_messages')
                    .select('id')
                    .eq('imap_message_id', messageId)
                    .single()

                  if (existing) {
                    console.log(`⏭️  Skipping duplicate: ${messageId}`)
                    return
                  }

                  // Find matching user by email in user_profiles
                  const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('user_id')
                    .eq('email', fromEmail)
                    .single()

                  const userId = profile?.user_id

                  // Save to database
                  const { error: insertError } = await supabase
                    .from('email_messages')
                    .insert({
                      user_id: userId || null,
                      guest_email: userId ? null : fromEmail,
                      from_email: fromEmail,
                      to_email: toEmail,
                      subject,
                      body_text: bodyText,
                      body_html: bodyHtml,
                      direction: 'inbound',
                      status: 'delivered',
                      imap_message_id: messageId,
                      imap_uid: seqno,
                      is_reply: subject.toLowerCase().startsWith('re:'),
                      sent_at: parsed.date?.toISOString() || new Date().toISOString(),
                    })

                  if (insertError) {
                    result.errors.push(`DB insert failed: ${insertError.message}`)
                  } else {
                    result.newMessages++
                    console.log(`✅ Synced email from ${fromEmail}: ${subject}`)
                  }
                } catch (error: any) {
                  result.errors.push(`Processing error: ${error.message}`)
                }
              })
            })
          })

          fetch.once('end', () => {
            console.log(`✅ Email sync complete: ${result.newMessages} new messages`)
            imap.end()
          })

          fetch.once('error', (err) => {
            result.success = false
            result.errors.push(`Fetch error: ${err.message}`)
            imap.end()
          })
        })
      })
    })

    imap.once('error', (err: any) => {
      result.success = false
      result.errors.push(`IMAP connection error: ${err.message}`)
      resolve(result)
    })

    imap.once('end', () => {
      resolve(result)
    })

    imap.connect()
  })
}

