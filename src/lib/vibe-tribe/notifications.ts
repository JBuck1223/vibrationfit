import { createAdminClient } from '@/lib/supabase/admin'
import type { VibeNotificationContext, VibeNotificationType } from '@/lib/vibe-tribe/types'

export interface VibeNotificationRecipient {
  userId: string
  type: VibeNotificationType
  context: VibeNotificationContext
}

const RANK: Record<VibeNotificationType, number> = {
  mention: 3,
  reply: 2,
  comment: 1,
  heart: 0,
  post: 0,
}

function offer(
  chosen: Map<string, VibeNotificationRecipient>,
  actorId: string,
  userId: string | null | undefined,
  type: VibeNotificationType,
  context: VibeNotificationContext
) {
  if (!userId || userId === actorId) return
  const existing = chosen.get(userId)
  // Equal rank does not replace, so call the more specific offer first.
  if (existing && RANK[existing.type] >= RANK[type]) return
  chosen.set(userId, { userId, type, context })
}

/**
 * Who hears about a new comment or reply.
 * A mention replaces a comment or reply for the same person.
 * A reply to your own comment stays "replied to your comment" when you also wrote the post.
 */
export function buildCommentNotificationRecipients(input: {
  actorId: string
  postAuthorId: string
  parentAuthorId?: string | null
  mentionedUserIds: string[]
}): VibeNotificationRecipient[] {
  const chosen = new Map<string, VibeNotificationRecipient>()

  if (input.parentAuthorId) {
    offer(chosen, input.actorId, input.parentAuthorId, 'reply', 'comment')
    offer(chosen, input.actorId, input.postAuthorId, 'reply', 'post')
  } else {
    offer(chosen, input.actorId, input.postAuthorId, 'comment', 'post')
  }

  for (const mentionedId of input.mentionedUserIds) {
    offer(chosen, input.actorId, mentionedId, 'mention', 'comment')
  }

  return Array.from(chosen.values())
}

/**
 * Every other active member hears about a new post.
 * A mention replaces the generic post notice for that person.
 */
export function buildNewPostRecipients(input: {
  actorId: string
  memberIds: string[]
  mentionedUserIds: string[]
}): VibeNotificationRecipient[] {
  const chosen = new Map<string, VibeNotificationRecipient>()

  for (const memberId of input.memberIds) {
    offer(chosen, input.actorId, memberId, 'post', 'post')
  }

  for (const mentionedId of input.mentionedUserIds) {
    offer(chosen, input.actorId, mentionedId, 'mention', 'post')
  }

  return Array.from(chosen.values())
}

export function buildMentionRecipients(
  actorId: string,
  mentionedUserIds: string[],
  context: VibeNotificationContext
): VibeNotificationRecipient[] {
  const chosen = new Map<string, VibeNotificationRecipient>()
  for (const mentionedId of mentionedUserIds) {
    offer(chosen, actorId, mentionedId, 'mention', context)
  }
  return Array.from(chosen.values())
}

function excerptOf(text: string | null | undefined): string | null {
  if (!text) return null
  const trimmed = text.trim().replace(/\s+/g, ' ')
  if (!trimmed) return null
  return trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed
}

export async function createVibeNotifications(params: {
  actorId: string
  postId: string
  commentId?: string | null
  excerpt?: string | null
  recipients: VibeNotificationRecipient[]
}): Promise<void> {
  const recipients = params.recipients.filter(recipient => recipient.userId !== params.actorId)
  if (recipients.length === 0) return

  try {
    const admin = createAdminClient()
    const excerpt = excerptOf(params.excerpt)
    const rows = []

    for (const recipient of recipients) {
      if (recipient.type === 'heart') {
        const existing = admin
          .from('vibe_notifications')
          .select('id')
          .eq('user_id', recipient.userId)
          .eq('actor_id', params.actorId)
          .eq('type', 'heart')

        const { data: prior } = params.commentId
          ? await existing.eq('comment_id', params.commentId).maybeSingle()
          : await existing.eq('post_id', params.postId).is('comment_id', null).maybeSingle()

        if (prior) continue
      }

      rows.push({
        user_id: recipient.userId,
        actor_id: params.actorId,
        type: recipient.type,
        context: recipient.context,
        post_id: params.postId,
        comment_id: params.commentId || null,
        excerpt,
      })
    }

    if (rows.length === 0) return

    const { error } = await admin.from('vibe_notifications').insert(rows)
    if (error && error.code !== '23505') {
      console.error('Failed to create vibe notifications:', error)
    }
  } catch (err) {
    console.error('createVibeNotifications error:', err)
  }
}
