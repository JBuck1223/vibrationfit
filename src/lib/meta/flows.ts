// Flow engine for the Meta DM automation.
//
// A rule's `flow` jsonb holds an ordered list of steps:
//   { id, type: 'message',       text, link?, buttons?: [{ label, goto }], goto? }
//   { id, type: 'capture_email', prompt, success_text?, goto? }
//
// - message steps send a DM (buttons become IG quick replies whose payload
//   encodes the target step: "flow:<ruleId>:<stepId>"). A message with no
//   buttons chains straight into its `goto` step, if any.
// - capture_email steps ask for an email. A valid typed email is saved to
//   `leads` and `meta_contacts` immediately, then echoed back for
//   confirmation ("I have your email as X, can you please confirm it is
//   correct?" with a Yes button). The confirm tap triggers the success
//   message and the optional email_template send. Returning contacts skip
//   typing: "Is <email> the best email to send it over to?" with a Yes
//   button. Confirm buttons carry the email in their payload
//   ("flowc:<ruleId>:<stepId>:<email>") so taps work statelessly.

import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendDM,
  sendPrivateReply,
  type MessagingAccount,
  type QuickReply,
} from '@/lib/meta/messaging'
import { sendAndLogEmail } from '@/lib/email/send'
import { renderEmailTemplate } from '@/lib/email/templates/db'

type AdminClient = ReturnType<typeof createAdminClient>

export interface FlowStep {
  id: string
  type: 'message' | 'capture_email'
  text?: string
  link?: string
  buttons?: Array<{ label: string; goto: string }>
  prompt?: string
  success_text?: string
  /** confirmation message after they type an email; {{email}} merges it in */
  confirm_text?: string
  /** confirmation message for returning contacts whose email we remember */
  confirm_known_text?: string
  /** label for the confirmation quick-reply button */
  confirm_button?: string
  /** email_templates slug to send once the email is confirmed */
  email_template?: string
  /** value substituted for {{link}} in that template */
  email_link?: string
  goto?: string
}

export interface Flow {
  steps: FlowStep[]
}

export interface FlowRule {
  id: string
  flow: Flow | null
  reply_text: string
  reply_link: string | null
}

export interface FlowAccount {
  id: string
  platform: 'instagram' | 'facebook'
  ig_user_id: string
  username: string | null
  access_token: string
}

const PAYLOAD_PREFIX = 'flow:'
const CONFIRM_PREFIX = 'flowc:'
const MAX_CHAIN = 10 // safety cap on message->goto chains
const MAX_EMAIL_ATTEMPTS = 2
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const YES_RE = /^(yes|yes!|yep|yeah|yup|correct|confirm|yes please|sure)[.!]*$/i
const NO_RE = /^(no|no!|nope|nah|wrong|incorrect|not correct|that's wrong|thats wrong|it's wrong|its wrong|it's not|its not)[.!]*$/i

export function hasFlow(rule: { flow?: Flow | null }): boolean {
  return !!rule.flow?.steps?.length
}

function messagingAccount(account: FlowAccount): MessagingAccount {
  return { platform: account.platform, access_token: account.access_token }
}

function findStep(flow: Flow, stepId: string): FlowStep | null {
  return flow.steps.find((s) => s.id === stepId) || null
}

async function logOutbound(
  admin: AdminClient,
  account: FlowAccount,
  senderId: string,
  body: string,
  ruleId: string
) {
  await admin.from('meta_messages').insert({
    account_id: account.id,
    platform: account.platform,
    sender_id: senderId,
    direction: 'outbound',
    message_type: 'dm',
    body,
    rule_id: ruleId,
  })
}

async function parkState(
  admin: AdminClient,
  account: FlowAccount,
  senderId: string,
  ruleId: string,
  stepId: string,
  awaiting: 'email' | 'email_confirm',
  collected?: Record<string, unknown>
) {
  await admin.from('meta_flow_state').upsert(
    {
      account_id: account.id,
      sender_id: senderId,
      rule_id: ruleId,
      step_id: stepId,
      awaiting,
      attempts: 0,
      collected: collected || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'account_id,sender_id' }
  )
}

async function clearState(admin: AdminClient, account: FlowAccount, senderId: string) {
  await admin
    .from('meta_flow_state')
    .delete()
    .eq('account_id', account.id)
    .eq('sender_id', senderId)
}

async function getKnownEmail(
  admin: AdminClient,
  account: FlowAccount,
  senderId: string
): Promise<string | null> {
  const { data } = await admin
    .from('meta_contacts')
    .select('email')
    .eq('account_id', account.id)
    .eq('sender_id', senderId)
    .maybeSingle()
  return data?.email || null
}

const EMAIL_VAR_RE = /\{\{\s*email\s*\}\}/ // no `g`: .test() must stay stateless

/** Replace {{email}} in flow copy with the sender's email address. */
function fillEmailVar(text: string, email: string | null): string {
  return text.replace(/\{\{\s*email\s*\}\}/g, email || 'your email')
}

function confirmText(step: FlowStep, email: string, known: boolean): string {
  const custom = known ? step.confirm_known_text || step.confirm_text : step.confirm_text
  if (custom?.trim()) return fillEmailVar(custom, email)
  return known
    ? `Is ${email} the best email to send it over to?`
    : `I have your email as ${email}, can you please confirm it is correct?`
}

function confirmButtons(rule: FlowRule, step: FlowStep, email: string, known: boolean): QuickReply[] {
  return [
    {
      title: step.confirm_button?.trim() || (known ? 'Yes please!' : 'Yes!'),
      payload: `${CONFIRM_PREFIX}${rule.id}:${step.id}:${email}`,
    },
  ]
}

/**
 * Ask the sender to confirm an email (typed just now, or remembered from a
 * previous capture). Sent as a DM, or as a private reply when the flow was
 * triggered by a comment.
 */
async function sendEmailConfirm(
  admin: AdminClient,
  account: FlowAccount,
  senderId: string,
  rule: FlowRule,
  step: FlowStep,
  email: string,
  known: boolean,
  viaCommentId?: string
): Promise<void> {
  const text = confirmText(step, email, known)
  const buttons = confirmButtons(rule, step, email, known)
  const result = viaCommentId
    ? await sendPrivateReply(messagingAccount(account), viaCommentId, text, buttons)
    : await sendDM(messagingAccount(account), senderId, text, buttons)

  if (!result.success) {
    console.error('[meta-flows] Failed to send email confirm:', result.error)
    return
  }
  await logOutbound(admin, account, senderId, text, rule.id)
  await parkState(admin, account, senderId, rule.id, step.id, 'email_confirm', { email })
}

/**
 * Ask the sender to type their email (no remembered contact). Sent as a DM,
 * or as a private reply when the flow was triggered by a comment.
 */
async function sendEmailPrompt(
  admin: AdminClient,
  account: FlowAccount,
  senderId: string,
  rule: FlowRule,
  step: FlowStep,
  viaCommentId?: string
): Promise<void> {
  const prompt = step.prompt || 'What is your best email address?'
  const result = viaCommentId
    ? await sendPrivateReply(messagingAccount(account), viaCommentId, prompt)
    : await sendDM(messagingAccount(account), senderId, prompt)

  if (!result.success) {
    console.error('[meta-flows] Failed to send capture prompt:', result.error)
    return
  }
  await logOutbound(admin, account, senderId, prompt, rule.id)
  await parkState(admin, account, senderId, rule.id, step.id, 'email')
}

/**
 * Run a capture_email step: returning contacts confirm their saved email,
 * new contacts are asked to type one.
 */
async function runCaptureStep(
  admin: AdminClient,
  account: FlowAccount,
  senderId: string,
  rule: FlowRule,
  step: FlowStep,
  viaCommentId?: string
): Promise<void> {
  const known = await getKnownEmail(admin, account, senderId)
  if (known) {
    await sendEmailConfirm(admin, account, senderId, rule, step, known, true, viaCommentId)
  } else {
    await sendEmailPrompt(admin, account, senderId, rule, step, viaCommentId)
  }
}

/**
 * Deliver the promised email after a confirmed capture. Best-effort: a send
 * failure never blocks the rest of the flow.
 */
async function sendCaptureEmail(
  account: FlowAccount,
  step: FlowStep,
  email: string,
  leadId: string | null
): Promise<void> {
  try {
    const rendered = await renderEmailTemplate(step.email_template!, {
      link: step.email_link || '',
    })
    await sendAndLogEmail({
      to: email,
      subject: rendered.subject,
      htmlBody: rendered.htmlBody || undefined,
      textBody: rendered.textBody || undefined,
      context: { guestEmail: email },
    })
    console.log('[meta-flows] Capture email sent', {
      template: step.email_template,
      email,
      leadId,
      account: account.username,
    })
  } catch (err) {
    console.error('[meta-flows] Failed to send capture email:', err)
  }
}

/**
 * Save the lead and remember the contact. Called as soon as a valid email is
 * typed -- we never wait for the confirm tap to capture it.
 */
async function rememberEmail(
  admin: AdminClient,
  account: FlowAccount,
  senderId: string,
  email: string,
  senderUsername: string | null
): Promise<string | null> {
  const leadId = await saveLead(admin, account, email, senderUsername)

  await admin.from('meta_contacts').upsert(
    {
      account_id: account.id,
      sender_id: senderId,
      username: senderUsername,
      email,
      lead_id: leadId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'account_id,sender_id' }
  )

  return leadId
}

/**
 * A confirmed email: make sure it's saved, thank them, send the promised
 * email, and continue the flow.
 */
async function completeCapture(
  admin: AdminClient,
  account: FlowAccount,
  senderId: string,
  rule: FlowRule,
  step: FlowStep | null,
  email: string,
  senderUsername: string | null
): Promise<void> {
  // Idempotent: usually already saved when they typed it, but confirm taps
  // can arrive without prior state (e.g. old messages), so save again.
  const leadId = await rememberEmail(admin, account, senderId, email, senderUsername)

  await clearState(admin, account, senderId)

  if (step?.email_template) {
    await sendCaptureEmail(account, step, email, leadId)
  }

  if (step?.success_text) {
    const text = fillEmailVar(step.success_text, email)
    const result = await sendDM(messagingAccount(account), senderId, text)
    if (result.success) {
      await logOutbound(admin, account, senderId, text, rule.id)
    }
  }
  if (step?.goto) {
    await runStep(admin, account, senderId, rule, step.goto, email)
  }
}

/**
 * Start a rule's flow from its first step (DM keyword trigger).
 */
export async function startFlow(
  admin: AdminClient,
  account: FlowAccount,
  senderId: string,
  rule: FlowRule
): Promise<void> {
  const first = rule.flow?.steps?.[0]
  if (!first) return
  // A new keyword trigger supersedes any parked capture state.
  await clearState(admin, account, senderId)
  await runStep(admin, account, senderId, rule, first.id)
}

/**
 * Start a rule's flow from a comment trigger. The first step goes out as a
 * private reply (Instagram supports quick-reply buttons there); the rest of
 * the flow continues in DMs via button taps or captured replies.
 * Returns true if the private reply was sent successfully.
 */
export async function startFlowFromComment(
  admin: AdminClient,
  account: FlowAccount,
  senderId: string,
  commentId: string,
  rule: FlowRule
): Promise<boolean> {
  const first = rule.flow?.steps?.[0]
  if (!first) return false
  await clearState(admin, account, senderId)

  if (first.type === 'capture_email') {
    await runCaptureStep(admin, account, senderId, rule, first, commentId)
    return true
  }

  let text = first.link ? `${first.text}\n\n${first.link}` : first.text || ''
  if (EMAIL_VAR_RE.test(text)) {
    text = fillEmailVar(text, await getKnownEmail(admin, account, senderId))
  }
  const quickReplies: QuickReply[] | undefined = first.buttons?.length
    ? first.buttons.map((b) => ({
        title: b.label,
        payload: `${PAYLOAD_PREFIX}${rule.id}:${b.goto}`,
      }))
    : undefined

  const result = await sendPrivateReply(
    messagingAccount(account),
    commentId,
    text,
    quickReplies
  )
  if (!result.success) {
    console.error('[meta-flows] Comment flow first step failed:', result.error)
    return false
  }
  await logOutbound(admin, account, senderId, text, rule.id)
  return true
}

/**
 * Execute a step (and any no-button goto chain that follows it).
 * `knownEmail` fills {{email}} in message text; when not passed, the
 * sender's remembered contact email is looked up on demand.
 */
export async function runStep(
  admin: AdminClient,
  account: FlowAccount,
  senderId: string,
  rule: FlowRule,
  stepId: string,
  knownEmail?: string
): Promise<void> {
  if (!rule.flow) return
  let current: FlowStep | null = findStep(rule.flow, stepId)
  let hops = 0
  let email: string | null | undefined = knownEmail

  while (current && hops < MAX_CHAIN) {
    hops++

    if (current.type === 'capture_email') {
      await runCaptureStep(admin, account, senderId, rule, current)
      return // wait for the typed reply or confirm tap
    }

    // message step
    let text = current.link ? `${current.text}\n\n${current.link}` : current.text || ''
    if (EMAIL_VAR_RE.test(text)) {
      if (email === undefined) {
        email = await getKnownEmail(admin, account, senderId)
      }
      text = fillEmailVar(text, email)
    }
    const quickReplies: QuickReply[] | undefined = current.buttons?.length
      ? current.buttons.map((b) => ({
          title: b.label,
          payload: `${PAYLOAD_PREFIX}${rule.id}:${b.goto}`,
        }))
      : undefined

    const result = await sendDM(messagingAccount(account), senderId, text, quickReplies)
    if (!result.success) {
      console.error('[meta-flows] Failed to send message step:', result.error)
      return
    }
    await logOutbound(admin, account, senderId, text, rule.id)

    if (quickReplies) return // wait for a button tap
    current = current.goto ? findStep(rule.flow, current.goto) : null
  }
}

async function loadRule(admin: AdminClient, ruleId: string): Promise<FlowRule | null> {
  const { data } = await admin
    .from('meta_automation_rules')
    .select('id, flow, reply_text, reply_link')
    .eq('id', ruleId)
    .eq('is_active', true)
    .maybeSingle()
  return (data as FlowRule) || null
}

/**
 * Handle a quick-reply button tap. Returns true if the payload was ours.
 */
export async function handleQuickReplyPayload(
  admin: AdminClient,
  account: FlowAccount,
  senderId: string,
  payload: string,
  senderUsername: string | null
): Promise<boolean> {
  // Email confirm tap: payload carries rule, step, and the email itself.
  if (payload.startsWith(CONFIRM_PREFIX)) {
    const parts = payload.slice(CONFIRM_PREFIX.length).split(':')
    const [ruleId, stepId, ...emailParts] = parts
    const email = emailParts.join(':').trim().toLowerCase()
    if (!ruleId || !stepId || !EMAIL_RE.test(email)) return true

    const rule = await loadRule(admin, ruleId)
    if (rule && hasFlow(rule)) {
      const step = findStep(rule.flow!, stepId)
      await completeCapture(admin, account, senderId, rule, step, email, senderUsername)
    }
    return true
  }

  // Step navigation tap.
  if (payload.startsWith(PAYLOAD_PREFIX)) {
    const [ruleId, stepId] = payload.slice(PAYLOAD_PREFIX.length).split(':')
    if (!ruleId || !stepId) return true

    const rule = await loadRule(admin, ruleId)
    if (rule && hasFlow(rule)) {
      await runStep(admin, account, senderId, rule, stepId)
    }
    return true
  }

  return false
}

/**
 * If this sender is parked on a capture step, consume their typed reply.
 * Returns true if the message was handled by the flow (skip keyword matching).
 */
export async function handlePendingState(
  admin: AdminClient,
  account: FlowAccount,
  senderId: string,
  text: string,
  senderUsername: string | null
): Promise<boolean> {
  const { data: state } = await admin
    .from('meta_flow_state')
    .select('*')
    .eq('account_id', account.id)
    .eq('sender_id', senderId)
    .maybeSingle()

  if (!state) return false

  const rule = await loadRule(admin, state.rule_id)
  if (!rule || !hasFlow(rule)) {
    await clearState(admin, account, senderId)
    return false
  }

  const step = findStep(rule.flow!, state.step_id)
  const trimmed = text.trim()
  const asEmail = trimmed.toLowerCase()

  if (state.awaiting === 'email_confirm') {
    // They typed a (different) email instead of tapping: save it right away
    // and confirm the new one.
    if (EMAIL_RE.test(asEmail)) {
      await rememberEmail(admin, account, senderId, asEmail, senderUsername)
      if (step) await sendEmailConfirm(admin, account, senderId, rule, step, asEmail, false)
      return true
    }
    // They typed "yes" instead of tapping the button.
    if (YES_RE.test(trimmed)) {
      const email = (state.collected as { email?: string } | null)?.email
      if (email) {
        await completeCapture(admin, account, senderId, rule, step, email, senderUsername)
        return true
      }
      await clearState(admin, account, senderId)
      return false
    }
    // They said the email is wrong: ask for the correct one.
    if (NO_RE.test(trimmed)) {
      const askAgain = 'No problem! What is the correct email address?'
      const result = await sendDM(messagingAccount(account), senderId, askAgain)
      if (result.success) {
        await logOutbound(admin, account, senderId, askAgain, rule.id)
        if (step) await parkState(admin, account, senderId, rule.id, step.id, 'email')
      }
      return true
    }
    // Anything else: they've probably moved on. Let it fall through once,
    // then give up entirely.
    if (state.attempts + 1 >= MAX_EMAIL_ATTEMPTS) {
      await clearState(admin, account, senderId)
    } else {
      await admin
        .from('meta_flow_state')
        .update({ attempts: state.attempts + 1, updated_at: new Date().toISOString() })
        .eq('id', state.id)
    }
    return false
  }

  // awaiting === 'email'
  if (!EMAIL_RE.test(asEmail)) {
    if (state.attempts + 1 >= MAX_EMAIL_ATTEMPTS) {
      // Give up quietly so we don't badger people who changed their mind.
      await clearState(admin, account, senderId)
      return false // let the message fall through to keyword matching
    }
    await admin
      .from('meta_flow_state')
      .update({ attempts: state.attempts + 1, updated_at: new Date().toISOString() })
      .eq('id', state.id)
    const retry = "Hmm, that doesn't look like an email address. Mind sending it again?"
    const result = await sendDM(messagingAccount(account), senderId, retry)
    if (result.success) await logOutbound(admin, account, senderId, retry, rule.id)
    return true
  }

  // Valid email typed: save it immediately, then echo it back to confirm.
  // The promised email/success message still waits for the confirmation.
  await rememberEmail(admin, account, senderId, asEmail, senderUsername)
  if (step) {
    await sendEmailConfirm(admin, account, senderId, rule, step, asEmail, false)
  }
  return true
}

async function saveLead(
  admin: AdminClient,
  account: FlowAccount,
  email: string,
  senderUsername: string | null
): Promise<string | null> {
  const { data: existing } = await admin
    .from('leads')
    .select('id, metadata')
    .eq('email', email)
    .maybeSingle()

  const igMeta = {
    ig_username: senderUsername,
    captured_by_account: account.username,
  }

  if (existing) {
    await admin
      .from('leads')
      .update({
        metadata: { ...(existing.metadata || {}), instagram: igMeta },
      })
      .eq('id', existing.id)
    return existing.id
  }

  const { data: created } = await admin
    .from('leads')
    .insert({
      type: 'instagram',
      status: 'new',
      email,
      first_name: senderUsername,
      source: 'instagram_dm',
      metadata: { instagram: igMeta },
    })
    .select('id')
    .single()

  return created?.id || null
}
