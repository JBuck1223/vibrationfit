/**
 * Post a staff reply on a support ticket and email the member.
 *
 * Preview (no write, no email):
 *   npx tsx scripts/support/reply-ticket.ts --ticket SUPP-0047 --status waiting_reply --as vanessa --message-file reply.txt
 *
 * Send:
 *   npx tsx scripts/support/reply-ticket.ts --ticket SUPP-0047 --status resolved --as vanessa --message-file reply.txt --yes
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import { sendAndLogEmail } from '../../src/lib/email/send'
import { generatePersonalMessageEmail } from '../../src/lib/email/templates/personal-message'

dotenv.config({ path: '.env.local' })

const STAFF = {
  vanessa: '30082787-6ae1-4413-9a32-293cc63e38ee',
  jordan: '2a0fc1a7-5b8a-46a4-97e4-d5c5ddefdf1a',
} as const

const STATUSES = ['open', 'in_progress', 'waiting_reply', 'resolved', 'closed'] as const

type StaffName = keyof typeof STAFF
type TicketStatus = (typeof STATUSES)[number]

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  if (index === -1) return undefined
  const value = process.argv[index + 1]
  if (!value || value.startsWith('--')) return ''
  return value
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

async function main() {
  const ticketRef = arg('ticket')
  const status = arg('status') as TicketStatus | undefined
  const asName = (arg('as') || 'vanessa') as StaffName
  const messageFile = arg('message-file')
  const inlineMessage = arg('message')
  const send = hasFlag('yes')

  if (!ticketRef || !status || !STATUSES.includes(status)) {
    console.error('Required: --ticket SUPP-0000 --status waiting_reply|resolved|closed|in_progress|open')
    process.exit(1)
  }
  if (!STAFF[asName]) {
    console.error('--as must be vanessa or jordan')
    process.exit(1)
  }

  const message = (messageFile ? fs.readFileSync(messageFile, 'utf8') : inlineMessage || '').trim()
  if (!message) {
    console.error('Required: --message-file <path> or --message "..."')
    process.exit(1)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const column = ticketRef.startsWith('SUPP-') ? 'ticket_number' : 'id'
  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select('id, ticket_number, subject, status, guest_email, user_id')
    .eq(column, ticketRef)
    .single()

  if (ticketError || !ticket) {
    console.error('Ticket not found:', ticketError?.message || ticketRef)
    process.exit(1)
  }

  let email = ticket.guest_email as string | null
  if (!email && ticket.user_id) {
    const { data: account } = await supabase
      .from('user_accounts')
      .select('email')
      .eq('id', ticket.user_id)
      .single()
    email = account?.email || null
  }

  console.log(`${send ? 'SEND' : 'PREVIEW'} ${ticket.ticket_number} → ${status} as ${asName}`)
  console.log(`To: ${email || '(no email — reply will still post)'}`)
  console.log('---')
  console.log(message)
  console.log('---')

  if (!send) {
    console.log('Preview only. Re-run with --yes to post and email.')
    return
  }

  const { error: replyError } = await supabase.from('support_ticket_replies').insert({
    ticket_id: ticket.id,
    user_id: STAFF[asName],
    message,
    is_staff: true,
  })

  if (replyError) {
    console.error('Failed to insert reply:', replyError.message)
    process.exit(1)
  }

  const now = new Date().toISOString()
  const update: Record<string, string | null> = {
    status,
    updated_at: now,
  }
  if (status === 'resolved') update.resolved_at = now
  if (status === 'closed') update.closed_at = now

  const { error: updateError } = await supabase
    .from('support_tickets')
    .update(update)
    .eq('id', ticket.id)

  if (updateError) {
    console.error('Reply saved, but status update failed:', updateError.message)
    process.exit(1)
  }

  if (!email) {
    console.log('Reply posted. No member email on the ticket.')
    return
  }

  const ticketUrl = `https://vibrationfit.com/support/tickets/${ticket.id}`
  const emailContent = await generatePersonalMessageEmail({
    senderName: 'Vibration Fit Support Team',
    messageBody: `We've added a new response to your support ticket ${ticket.ticket_number}: "${ticket.subject}"\n\nView your ticket and reply here:\n${ticketUrl}`,
    closingLine: 'Best regards,',
  })

  await sendAndLogEmail({
    to: email,
    subject: `Re: ${ticket.subject} [${ticket.ticket_number}]`,
    htmlBody: emailContent.htmlBody,
    textBody: emailContent.textBody,
    replyTo: 'team@vibrationfit.com',
    context: { userId: ticket.user_id || undefined, isReply: true },
  })

  console.log(`Reply posted. ${ticket.ticket_number} is ${status}. Email sent to ${email}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
