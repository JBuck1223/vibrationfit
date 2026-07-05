// Meta messaging client for the DM automation.
//
// Instagram accounts use the "Instagram API with Instagram Login" flow:
// each connected account (stored in meta_accounts) has its own long-lived
// Instagram user token and talks to graph.instagram.com. No Facebook Page
// linking required.
//
// Facebook Pages (future) use a Page token against graph.facebook.com,
// stored the same way in meta_accounts with platform = 'facebook'.

const GRAPH_FB = 'https://graph.facebook.com/v21.0'
const GRAPH_IG = 'https://graph.instagram.com/v21.0'

export type MetaPlatform = 'instagram' | 'facebook'

export interface MessagingAccount {
  platform: MetaPlatform
  access_token: string
}

function baseUrl(platform: MetaPlatform) {
  return platform === 'instagram' ? GRAPH_IG : GRAPH_FB
}

async function graphPost(
  base: string,
  path: string,
  token: string,
  body: Record<string, unknown>
) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error?.message || `Graph API error: ${res.status}`)
  }
  return json
}

async function graphGet(
  base: string,
  path: string,
  token: string,
  params: Record<string, string> = {}
) {
  const qs = new URLSearchParams({ ...params, access_token: token })
  const res = await fetch(`${base}${path}?${qs}`)
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error?.message || `Graph API error: ${res.status}`)
  }
  return json
}

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

/** Tappable button attached to a DM (tap sends the payload back to us). */
export interface QuickReply {
  title: string
  payload: string
}

const MAX_INLINE_BUTTONS = 3 // button-template cap; more falls back to quick replies

/** Floating pills above the keyboard; disappear once tapped. Up to 13. */
function quickReplyMessage(text: string, buttons: QuickReply[]) {
  return {
    text,
    quick_replies: buttons.slice(0, 13).map((qr) => ({
      content_type: 'text',
      // IG/Messenger cap quick-reply titles at 20 chars
      title: qr.title.slice(0, 20),
      payload: qr.payload,
    })),
  }
}

/** Buttons rendered inside the message bubble itself (ManyChat style). */
function buttonTemplateMessage(text: string, buttons: QuickReply[]) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: text.slice(0, 640),
        buttons: buttons.slice(0, MAX_INLINE_BUTTONS).map((b) => ({
          type: 'postback',
          title: b.title.slice(0, 20),
          payload: b.payload,
        })),
      },
    },
  }
}

function buildMessage(text: string, buttons?: QuickReply[]): Record<string, unknown> {
  if (!buttons?.length) return { text }
  return buttons.length <= MAX_INLINE_BUTTONS
    ? buttonTemplateMessage(text, buttons)
    : quickReplyMessage(text, buttons)
}

/**
 * Send a DM reply to a user who has messaged the account (24-hour window).
 * Buttons render inside the message bubble (button template, up to 3); more
 * than 3 fall back to floating quick replies. If the template is rejected,
 * we retry once as quick replies.
 */
export async function sendDM(
  account: MessagingAccount,
  recipientId: string,
  text: string,
  buttons?: QuickReply[]
): Promise<SendResult> {
  const send = async (message: Record<string, unknown>) => {
    const body: Record<string, unknown> = {
      recipient: { id: recipientId },
      message,
    }
    if (account.platform === 'facebook') {
      body.messaging_type = 'RESPONSE'
    }
    return graphPost(baseUrl(account.platform), '/me/messages', account.access_token, body)
  }

  try {
    const result = await send(buildMessage(text, buttons))
    return { success: true, messageId: result.message_id }
  } catch (err) {
    if (buttons?.length && buttons.length <= MAX_INLINE_BUTTONS) {
      try {
        const result = await send(quickReplyMessage(text, buttons))
        return { success: true, messageId: result.message_id }
      } catch (retryErr) {
        return { success: false, error: (retryErr as Error).message }
      }
    }
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Send a private reply to a comment (arrives as a DM to the commenter).
 * Instagram: POST /me/messages with recipient.comment_id (supports quick
 * replies). Facebook: POST /{comment_id}/private_replies (text only,
 * one-shot, within 7 days).
 */
export async function sendPrivateReply(
  account: MessagingAccount,
  commentId: string,
  text: string,
  buttons?: QuickReply[]
): Promise<SendResult> {
  try {
    if (account.platform === 'instagram') {
      const send = (message: Record<string, unknown>) =>
        graphPost(GRAPH_IG, '/me/messages', account.access_token, {
          recipient: { comment_id: commentId },
          message,
        })
      try {
        const result = await send(buildMessage(text, buttons))
        return { success: true, messageId: result.message_id }
      } catch (err) {
        if (buttons?.length && buttons.length <= MAX_INLINE_BUTTONS) {
          const result = await send(quickReplyMessage(text, buttons))
          return { success: true, messageId: result.message_id }
        }
        throw err
      }
    }
    const result = await graphPost(
      GRAPH_FB,
      `/${commentId}/private_replies`,
      account.access_token,
      { message: text }
    )
    return { success: true, messageId: result.id }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Post a public reply on a comment (visible to everyone under the post),
 * e.g. "Just sent it over -- check your DMs!".
 */
export async function replyToComment(
  account: MessagingAccount,
  commentId: string,
  text: string
): Promise<SendResult> {
  try {
    // IG uses /replies; FB Pages use /comments for threaded replies
    const path =
      account.platform === 'instagram'
        ? `/${commentId}/replies`
        : `/${commentId}/comments`
    const result = await graphPost(
      baseUrl(account.platform),
      path,
      account.access_token,
      { message: text }
    )
    return { success: true, messageId: result.id }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Look up an Instagram user's username from their IGSID (best effort;
 * used to make the admin activity feed human-readable).
 */
export async function getIgUsername(
  account: MessagingAccount,
  igsid: string
): Promise<string | null> {
  try {
    const result = await graphGet(
      baseUrl(account.platform),
      `/${igsid}`,
      account.access_token,
      { fields: 'username' }
    )
    return result.username || null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Account onboarding / token lifecycle (Instagram Login flow)
// ---------------------------------------------------------------------------

export interface IgIdentity {
  igUserId: string
  username: string | null
}

/**
 * Identify the IG professional account behind a token.
 * `user_id` is the professional account ID (matches webhook entry.id);
 * `id` is the app-scoped fallback.
 */
export async function getIgIdentity(accessToken: string): Promise<IgIdentity> {
  const result = await graphGet(GRAPH_IG, '/me', accessToken, {
    fields: 'user_id,username',
  })
  return {
    igUserId: String(result.user_id || result.id),
    username: result.username || null,
  }
}

/**
 * Subscribe the account to the app's webhooks. Without this, Meta delivers
 * no message/comment events for the account, even with the app-level
 * webhook callback configured.
 */
export async function subscribeIgWebhooks(
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await graphPost(
      GRAPH_IG,
      '/me/subscribed_apps?subscribed_fields=messages,comments,messaging_postbacks',
      accessToken,
      {}
    )
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Exchange a short-lived Instagram Login token for a long-lived one
 * (~60 days). Tokens generated from the developer dashboard are already
 * long-lived; this is for tokens obtained via the OAuth browser flow.
 */
export async function exchangeIgToken(
  shortLivedToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const appSecret = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET
  if (!appSecret) throw new Error('INSTAGRAM_APP_SECRET not set')

  const qs = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: appSecret,
    access_token: shortLivedToken,
  })
  const res = await fetch(`https://graph.instagram.com/access_token?${qs}`)
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error?.message || `Token exchange failed: ${res.status}`)
  }
  return {
    accessToken: json.access_token,
    expiresAt: new Date(Date.now() + (json.expires_in || 5184000) * 1000),
  }
}

/**
 * Refresh a long-lived Instagram Login token (must be at least 24h old
 * and not expired). Returns the new token and expiry.
 */
export async function refreshIgToken(
  longLivedToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const qs = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: longLivedToken,
  })
  const res = await fetch(`https://graph.instagram.com/refresh_access_token?${qs}`)
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error?.message || `Token refresh failed: ${res.status}`)
  }
  return {
    accessToken: json.access_token,
    expiresAt: new Date(Date.now() + (json.expires_in || 5184000) * 1000),
  }
}
