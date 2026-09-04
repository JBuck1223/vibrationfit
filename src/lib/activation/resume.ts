/**
 * Resume an existing Activation instead of spawning a second row,
 * and send the branded "Your Activation has begun" door-back-in email.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { sendAndLogEmail } from '@/lib/email/send'
import { renderEmailTemplate } from '@/lib/email/templates/db'
import { recordActivationEvent } from '@/lib/activation/events'

export const INCOMPLETE_ACTIVATION_STATUSES = [
  'started',
  'oriented',
  'current_state',
  'dream',
  'category_confirmed',
  'generating',
  'ready',
  'opened',
] as const

export type ActivationResumeRow = {
  id: string
  status: string
  entered_at?: string | null
  opened_at?: string | null
  ready_at?: string | null
  resume_email_sent_at?: string | null
}

export function activationResumePath(activation: Pick<ActivationResumeRow, 'id' | 'status'>): string {
  if (['ready', 'opened', 'entered'].includes(activation.status)) {
    return `/activation/${activation.id}`
  }
  return `/activation/experience?id=${activation.id}`
}

export async function findLatestActivation(
  admin: SupabaseClient,
  userId: string,
): Promise<ActivationResumeRow | null> {
  const { data } = await admin
    .from('activations')
    .select('id, status, entered_at, opened_at, ready_at, resume_email_sent_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as ActivationResumeRow | null) || null
}

export async function findLatestIncompleteActivation(
  admin: SupabaseClient,
  userId: string,
): Promise<ActivationResumeRow | null> {
  const { data } = await admin
    .from('activations')
    .select('id, status, entered_at, opened_at, ready_at, resume_email_sent_at')
    .eq('user_id', userId)
    .in('status', [...INCOMPLETE_ACTIVATION_STATUSES])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as ActivationResumeRow | null) || null
}

export async function sendActivationBegunEmail(params: {
  admin: SupabaseClient
  origin: string
  email: string
  firstName?: string | null
  userId: string
  activation: ActivationResumeRow
}): Promise<void> {
  const { admin, origin, email, firstName, userId, activation } = params
  const returnTo = activationResumePath(activation)

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  const tokenHash = linkData?.properties?.hashed_token
  if (linkErr || !tokenHash) {
    throw new Error(linkErr?.message || 'Could not create a resume link')
  }

  const resumeUrl = `${origin}/auth/callback?token_hash=${tokenHash}&type=magiclink&returnTo=${encodeURIComponent(returnTo)}`

  const rendered = await renderEmailTemplate('activation-begun', {
    firstName: firstName?.trim() || 'there',
    resumeUrl,
  })

  await sendAndLogEmail({
    to: email,
    subject: rendered.subject,
    htmlBody: rendered.htmlBody,
    textBody: rendered.textBody,
    context: { userId, guestEmail: email },
  })

  await admin
    .from('activations')
    .update({ resume_email_sent_at: new Date().toISOString() })
    .eq('id', activation.id)

  await recordActivationEvent(admin, {
    eventType: 'activation_resume_email_sent',
    activationId: activation.id,
    userId,
    eventData: { return_to: returnTo },
  })
}
