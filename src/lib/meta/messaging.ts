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

/** Quick-reply button shown under a DM (tap sends the payload back to us). */
export interface QuickReply {
  title: string
  payload: string
}

/**
 * Send a DM reply to a user who has messaged the account (24-hour window).
 * Optional quick replies render as tappable buttons under the message.
 */
export async function sendDM(
  account: MessagingAccount,
  recipientId: string,
  text: string,
  quickReplies?: QuickReply[]
): Promise<SendResult> {
  try {
    const message: Record<string, unknown> = { text }
    if (quickReplies?.length) {
      message.quick_replies = quickReplies.slice(0, 13).map((qr) => ({
        content_type: 'text',
        // IG/Messenger cap quick-reply titles at 20 chars
        title: qr.title.slice(0, 20),
        payload: qr.payload,
      }))
    }
    const body: Record<string, unknown> = {
      recipient: { id: recipientId },
      message,
    }
    if (account.platform === 'facebook') {
      body.messaging_type = 'RESPONSE'
    }
    const result = await graphPost(
      baseUrl(account.platform),
      '/me/messages',
      account.access_token,
      body
    )
    return { success: true, messageId: result.message_id }
  } catch (err) {
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
  quickReplies?: QuickReply[]
): Promise<SendResult> {
  try {
    if (account.platform === 'instagram') {
      const message: Record<string, unknown> = { text }
      if (quickReplies?.length) {
        message.quick_replies = quickReplies.slice(0, 13).map((qr) => ({
          content_type: 'text',
          title: qr.title.slice(0, 20),
          payload: qr.payload,
        }))
      }
      const result = await graphPost(GRAPH_IG, '/me/messages', account.access_token, {
        recipient: { comment_id: commentId },
        message,
      })
      return { success: true, messageId: result.message_id }
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
