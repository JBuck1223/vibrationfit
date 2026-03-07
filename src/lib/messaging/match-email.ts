/**
 * Inbound email matching.
 *
 * Resolves which user or lead an inbound email belongs to using:
 *   1. Sender email → user_profiles.email (registered members)
 *   2. Sender email → leads.email (known leads)
 *   3. Thread match via In-Reply-To / References headers → find the original
 *      outbound email's user_id / guest_email from email_messages
 */

import { createAdminClient } from '@/lib/supabase/admin'

export interface MatchResult {
  userId: string | null
  guestEmail: string | null
}

/**
 * SES Message-IDs look like: <sesId@email.amazonses.com>
 * or <sesId@us-east-1.amazonses.com>
 */
function extractSesMessageId(headerValue: string): string | null {
  const match = headerValue.match(/<([^@]+)@[^>]*amazonses\.com>/)
  return match ? match[1] : null
}

export async function matchInboundEmail(
  fromEmail: string,
  inReplyTo?: string,
  references?: string | string[],
): Promise<MatchResult> {
  const supabase = createAdminClient()
  const result: MatchResult = { userId: null, guestEmail: null }

  // Strategy 1: Match sender to a registered member
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_id')
    .ilike('email', fromEmail)
    .limit(1)
    .single()

  if (profile) {
    result.userId = profile.user_id
    return result
  }

  // Strategy 2: Thread matching via In-Reply-To / References headers.
  // If the reply references an outbound email we sent, copy that row's user context.
  const headerValues: string[] = []
  if (inReplyTo) headerValues.push(inReplyTo)
  if (references) {
    const refs = Array.isArray(references) ? references : [references]
    headerValues.push(...refs)
  }

  for (const header of headerValues) {
    const sesId = extractSesMessageId(header)
    if (!sesId) continue

    const { data: original } = await supabase
      .from('email_messages')
      .select('user_id, guest_email')
      .eq('ses_message_id', sesId)
      .single()

    if (original) {
      result.userId = original.user_id || null
      result.guestEmail = original.guest_email || null
      if (result.userId) return result
    }
  }

  // Strategy 3: Check leads table
  const { data: lead } = await supabase
    .from('leads')
    .select('email')
    .ilike('email', fromEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (lead) {
    result.guestEmail = lead.email
    return result
  }

  // Fallback: store as guest email
  result.guestEmail = fromEmail
  return result
}
