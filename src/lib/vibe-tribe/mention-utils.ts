import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Extract @FullName patterns from content, resolve to user IDs,
 * and store in vibe_mentions table.
 */
export async function extractAndStoreMentions(
  adminClient: SupabaseClient,
  content: string | null,
  mentionedByUserId: string,
  target: { post_id?: string; comment_id?: string }
) {
  if (!content) return []

  const mentionPattern = /@([A-Za-z][A-Za-z\s]*?)(?=\s@|\s*$|[.,!?;:\n])/g
  const names: string[] = []
  let match: RegExpExecArray | null

  while ((match = mentionPattern.exec(content)) !== null) {
    const name = match[1].trim()
    if (name.length >= 2) {
      names.push(name)
    }
  }

  if (names.length === 0) return []

  const { data: users } = await adminClient
    .from('user_accounts')
    .select('id, full_name')
    .in('full_name', names)

  if (!users || users.length === 0) return []

  const mentionRows = users
    .filter(u => u.id !== mentionedByUserId)
    .map(u => ({
      mentioned_user_id: u.id,
      mentioned_by_user_id: mentionedByUserId,
      ...target,
    }))

  if (mentionRows.length > 0) {
    await adminClient.from('vibe_mentions').insert(mentionRows)
  }

  return users.map(u => ({ id: u.id, full_name: u.full_name }))
}

/**
 * Fetch mentioned users for a set of post IDs.
 * Returns a map from post_id to array of { id, full_name }.
 */
export async function getMentionedUsersForPosts(
  adminClient: SupabaseClient,
  postIds: string[]
): Promise<Record<string, { id: string; full_name: string }[]>> {
  if (postIds.length === 0) return {}

  const { data: mentions } = await adminClient
    .from('vibe_mentions')
    .select('post_id, mentioned_user_id')
    .in('post_id', postIds)

  if (!mentions || mentions.length === 0) return {}

  const userIds = [...new Set(mentions.map(m => m.mentioned_user_id))]
  const { data: users } = await adminClient
    .from('user_accounts')
    .select('id, full_name')
    .in('id', userIds)

  if (!users) return {}

  const usersMap = new Map(users.map(u => [u.id, u.full_name]))

  const result: Record<string, { id: string; full_name: string }[]> = {}
  for (const m of mentions) {
    if (!m.post_id) continue
    const name = usersMap.get(m.mentioned_user_id)
    if (!name) continue
    if (!result[m.post_id]) result[m.post_id] = []
    result[m.post_id].push({ id: m.mentioned_user_id, full_name: name })
  }

  return result
}

/**
 * Fetch mentioned users for a set of comment IDs.
 * Returns a map from comment_id to array of { id, full_name }.
 */
export async function getMentionedUsersForComments(
  adminClient: SupabaseClient,
  commentIds: string[]
): Promise<Record<string, { id: string; full_name: string }[]>> {
  if (commentIds.length === 0) return {}

  const { data: mentions } = await adminClient
    .from('vibe_mentions')
    .select('comment_id, mentioned_user_id')
    .in('comment_id', commentIds)

  if (!mentions || mentions.length === 0) return {}

  const userIds = [...new Set(mentions.map(m => m.mentioned_user_id))]
  const { data: users } = await adminClient
    .from('user_accounts')
    .select('id, full_name')
    .in('id', userIds)

  if (!users) return {}

  const usersMap = new Map(users.map(u => [u.id, u.full_name]))

  const result: Record<string, { id: string; full_name: string }[]> = {}
  for (const m of mentions) {
    if (!m.comment_id) continue
    const name = usersMap.get(m.mentioned_user_id)
    if (!name) continue
    if (!result[m.comment_id]) result[m.comment_id] = []
    result[m.comment_id].push({ id: m.mentioned_user_id, full_name: name })
  }

  return result
}

/**
 * Delete existing mentions for a post or comment, then re-extract and store.
 */
export async function updateMentions(
  adminClient: SupabaseClient,
  content: string | null,
  mentionedByUserId: string,
  target: { post_id?: string; comment_id?: string }
) {
  if (target.post_id) {
    await adminClient.from('vibe_mentions').delete().eq('post_id', target.post_id)
  } else if (target.comment_id) {
    await adminClient.from('vibe_mentions').delete().eq('comment_id', target.comment_id)
  }

  return extractAndStoreMentions(adminClient, content, mentionedByUserId, target)
}
