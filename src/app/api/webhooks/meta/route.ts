// Meta webhook for Instagram + Facebook DM automation (multi-account).
// Receives DM and comment events, resolves the receiving account from
// meta_accounts via entry.id, matches the text against keyword rules in
// meta_automation_rules, and sends auto-replies (DM reply or comment
// private reply) via the Graph API using that account's token.
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendDM,
  sendPrivateReply,
  getIgUsername,
  type MetaPlatform,
  type MessagingAccount,
} from '@/lib/meta/messaging'

interface MetaAccount {
  id: string
  platform: MetaPlatform
  ig_user_id: string
  username: string | null
  access_token: string
  is_active: boolean
}

interface AutomationRule {
  id: string
  account_id: string | null
  platform: 'instagram' | 'facebook' | 'both'
  trigger_type: 'dm_keyword' | 'comment_keyword'
  keyword: string
  match_type: 'exact' | 'contains'
  reply_text: string
  reply_link: string | null
  media_id: string | null
}

// ---------------------------------------------------------------------------
// GET: Meta webhook verification handshake
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge || '', { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// ---------------------------------------------------------------------------
// POST: inbound events
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  if (!verifySignature(rawBody, request.headers.get('x-hub-signature-256'))) {
    console.error('[meta-webhook] Invalid signature')
    return new NextResponse('Invalid signature', { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Bad payload', { status: 400 })
  }

  try {
    if (payload.object === 'instagram') {
      await handleEntries('instagram', payload.entry || [])
    } else if (payload.object === 'page') {
      await handleEntries('facebook', payload.entry || [])
    } else {
      console.log('[meta-webhook] Ignoring object type:', payload.object)
    }
  } catch (err) {
    // Never fail the webhook: Meta retries aggressively and can disable
    // the subscription if we keep erroring.
    console.error('[meta-webhook] Handler error:', err)
  }

  return NextResponse.json({ received: true })
}

function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.META_APP_SECRET
  if (!secret) {
    console.error('[meta-webhook] META_APP_SECRET not set')
    return false
  }
  if (!header?.startsWith('sha256=')) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  const received = header.slice('sha256='.length)

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(received, 'hex')
    )
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Event routing
// ---------------------------------------------------------------------------

async function handleEntries(platform: MetaPlatform, entries: any[]) {
  const admin = createAdminClient()

  for (const entry of entries) {
    const account = await resolveAccount(admin, platform, String(entry.id))
    if (!account) {
      console.log(
        `[meta-webhook] No active ${platform} account for entry.id ${entry.id}, skipping`
      )
      continue
    }

    // DMs (both IG and Messenger use the `messaging` array shape)
    for (const event of entry.messaging || []) {
      if (event.message) {
        await handleMessage(admin, account, event)
      }
    }

    // Comments arrive via the `changes` array
    for (const change of entry.changes || []) {
      if (platform === 'instagram' && change.field === 'comments') {
        await handleInstagramComment(admin, account, change.value)
      } else if (platform === 'facebook' && change.field === 'feed') {
        await handleFacebookComment(admin, account, change.value)
      }
    }
  }
}

async function resolveAccount(
  admin: ReturnType<typeof createAdminClient>,
  platform: MetaPlatform,
  entryId: string
): Promise<MetaAccount | null> {
  const { data } = await admin
    .from('meta_accounts')
    .select('*')
    .eq('platform', platform)
    .eq('ig_user_id', entryId)
    .eq('is_active', true)
    .maybeSingle()
  return (data as MetaAccount) || null
}

// ---------------------------------------------------------------------------
// DM handling
// ---------------------------------------------------------------------------

async function handleMessage(
  admin: ReturnType<typeof createAdminClient>,
  account: MetaAccount,
  event: any
) {
  const message = event.message
  if (message.is_echo) return // our own outbound messages echoed back

  const senderId: string | undefined = event.sender?.id
  const text: string = message.text || ''
  const messageId: string | undefined = message.mid

  if (!senderId) return
  if (senderId === account.ig_user_id) return // sent by the account itself

  if (messageId && (await alreadyProcessed(admin, messageId))) return

  const messagingAccount: MessagingAccount = {
    platform: account.platform,
    access_token: account.access_token,
  }

  const username =
    account.platform === 'instagram'
      ? await getIgUsername(messagingAccount, senderId)
      : null

  const rule = text
    ? await matchRule(admin, account, 'dm_keyword', text)
    : null

  await admin.from('meta_messages').insert({
    account_id: account.id,
    platform: account.platform,
    sender_id: senderId,
    sender_username: username,
    direction: 'inbound',
    message_type: 'dm',
    body: text || null,
    external_message_id: messageId || null,
    rule_id: rule?.id || null,
  })

  console.log(
    `[meta-webhook] Inbound ${account.platform} DM to @${account.username} from ${username || senderId}` +
      (rule ? ` matched rule "${rule.keyword}"` : '')
  )

  if (!rule) return

  const reply = composeReply(rule)
  const result = await sendDM(messagingAccount, senderId, reply)

  await logOutbound(admin, {
    account,
    senderId,
    username,
    messageType: 'dm',
    body: reply,
    ruleId: rule.id,
    messageId: result.messageId,
    success: result.success,
    error: result.error,
  })

  if (result.success) {
    await admin.rpc('increment_meta_rule_hit', { p_rule_id: rule.id })
  }
}

// ---------------------------------------------------------------------------
// Comment handling
// ---------------------------------------------------------------------------

async function handleInstagramComment(
  admin: ReturnType<typeof createAdminClient>,
  account: MetaAccount,
  value: any
) {
  const commentId: string | undefined = value?.id
  const fromId: string | undefined = value?.from?.id
  const username: string | null = value?.from?.username || null
  const text: string = value?.text || ''
  const mediaId: string | null = value?.media?.id || null

  if (!commentId || !fromId) return
  if (fromId === account.ig_user_id) return // our own comments

  await processComment(admin, account, {
    commentId,
    fromId,
    username,
    text,
    postId: mediaId,
  })
}

async function handleFacebookComment(
  admin: ReturnType<typeof createAdminClient>,
  account: MetaAccount,
  value: any
) {
  if (value?.item !== 'comment' || value?.verb !== 'add') return

  const commentId: string | undefined = value?.comment_id
  const fromId: string | undefined = value?.from?.id
  const username: string | null = value?.from?.name || null
  const text: string = value?.message || ''
  const postId: string | null = value?.post_id || null

  if (!commentId || !fromId) return
  if (fromId === account.ig_user_id) return // our own comments

  await processComment(admin, account, {
    commentId,
    fromId,
    username,
    text,
    postId,
  })
}

async function processComment(
  admin: ReturnType<typeof createAdminClient>,
  account: MetaAccount,
  opts: {
    commentId: string
    fromId: string
    username: string | null
    text: string
    postId: string | null
  }
) {
  if (await alreadyProcessed(admin, opts.commentId)) return

  const rule = opts.text
    ? await matchRule(admin, account, 'comment_keyword', opts.text, opts.postId)
    : null

  await admin.from('meta_messages').insert({
    account_id: account.id,
    platform: account.platform,
    sender_id: opts.fromId,
    sender_username: opts.username,
    direction: 'inbound',
    message_type: 'comment',
    body: opts.text || null,
    external_message_id: opts.commentId,
    rule_id: rule?.id || null,
  })

  console.log(
    `[meta-webhook] Inbound ${account.platform} comment to @${account.username} from ${opts.username || opts.fromId}` +
      (rule ? ` matched rule "${rule.keyword}"` : '')
  )

  if (!rule) return

  const reply = composeReply(rule)
  const result = await sendPrivateReply(
    { platform: account.platform, access_token: account.access_token },
    opts.commentId,
    reply
  )

  await logOutbound(admin, {
    account,
    senderId: opts.fromId,
    username: opts.username,
    messageType: 'dm',
    body: reply,
    ruleId: rule.id,
    messageId: result.messageId,
    success: result.success,
    error: result.error,
  })

  if (result.success) {
    await admin.rpc('increment_meta_rule_hit', { p_rule_id: rule.id })
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function alreadyProcessed(
  admin: ReturnType<typeof createAdminClient>,
  externalId: string
): Promise<boolean> {
  const { data } = await admin
    .from('meta_messages')
    .select('id')
    .eq('external_message_id', externalId)
    .maybeSingle()
  return !!data
}

async function matchRule(
  admin: ReturnType<typeof createAdminClient>,
  account: MetaAccount,
  triggerType: 'dm_keyword' | 'comment_keyword',
  text: string,
  postId?: string | null
): Promise<AutomationRule | null> {
  const { data: rules } = await admin
    .from('meta_automation_rules')
    .select('*')
    .eq('is_active', true)
    .eq('trigger_type', triggerType)
    .in('platform', [account.platform, 'both'])

  if (!rules?.length) return null

  const normalized = text.trim().toLowerCase()

  for (const rule of rules as AutomationRule[]) {
    // Rules scoped to a specific account only fire for that account;
    // account_id null = applies to all accounts.
    if (rule.account_id && rule.account_id !== account.id) continue

    // Comment rules can be scoped to a single post/media
    if (rule.media_id && postId && rule.media_id !== postId) continue
    if (rule.media_id && !postId) continue

    const keyword = rule.keyword.trim().toLowerCase()
    const matched =
      rule.match_type === 'exact'
        ? normalized === keyword
        : normalized.includes(keyword)

    if (matched) return rule
  }

  return null
}

function composeReply(rule: AutomationRule): string {
  return rule.reply_link
    ? `${rule.reply_text}\n\n${rule.reply_link}`
    : rule.reply_text
}

async function logOutbound(
  admin: ReturnType<typeof createAdminClient>,
  opts: {
    account: MetaAccount
    senderId: string
    username: string | null
    messageType: 'dm' | 'comment'
    body: string
    ruleId: string
    messageId?: string
    success: boolean
    error?: string
  }
) {
  if (!opts.success) {
    console.error(
      `[meta-webhook] Failed to send ${opts.account.platform} reply from @${opts.account.username} to ${opts.senderId}:`,
      opts.error
    )
    return
  }

  await admin.from('meta_messages').insert({
    account_id: opts.account.id,
    platform: opts.account.platform,
    sender_id: opts.senderId,
    sender_username: opts.username,
    direction: 'outbound',
    message_type: opts.messageType,
    body: opts.body,
    external_message_id: opts.messageId || null,
    rule_id: opts.ruleId,
  })
}
