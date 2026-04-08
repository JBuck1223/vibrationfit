import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Extract @FullName patterns from content, resolve to user IDs,
 * and store in vibe_mentions table.
 *
 * Uses database-backed name resolution: extracts candidate text after
 * each @, generates progressively shorter word combinations, and queries
 * the DB for matching full_name values. This correctly handles multiple
 * mentions with arbitrary text between them.
 */
export async function extractAndStoreMentions(
  adminClient: SupabaseClient,
  content: string | null,
  mentionedByUserId: string,
  target: { post_id?: string; comment_id?: string }
) {
  if (!content) return []

  // Find @ positions not preceded by a word character (skip emails, etc.)
  const atPositions: number[] = []
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '@' && (i === 0 || /[^A-Za-z0-9_]/.test(content[i - 1]))) {
      atPositions.push(i)
    }
  }

  if (atPositions.length === 0) return []

  // For each @, extract candidate text (up to 4 words of letters)
  const candidateChunks: string[] = []
  for (const pos of atPositions) {
    const text = content.slice(pos + 1)
    const wordMatch = text.match(/^([A-Za-z]+(?:\s+[A-Za-z]+){0,3})/)
    if (wordMatch) {
      const trimmed = wordMatch[1].trim()
      if (trimmed.length >= 2) candidateChunks.push(trimmed)
    }
  }

  if (candidateChunks.length === 0) return []

  // For each chunk, generate name candidates from longest to shortest
  // e.g. "John Doe and" → ["John Doe and", "John Doe", "John"]
  const allCandidates = new Set<string>()
  for (const chunk of candidateChunks) {
    const words = chunk.split(/\s+/)
    for (let len = words.length; len >= 1; len--) {
      const candidate = words.slice(0, len).join(' ')
      if (candidate.length >= 2) allCandidates.add(candidate)
    }
  }

  if (allCandidates.size === 0) return []

  const { data: matchingUsers } = await adminClient
    .from('user_accounts')
    .select('id, full_name')
    .in('full_name', Array.from(allCandidates))

  if (!matchingUsers || matchingUsers.length === 0) return []

  // For each chunk, find the longest matching user name
  const matchedUsers = new Map<string, { id: string; full_name: string }>()

  for (const chunk of candidateChunks) {
    const chunkLower = chunk.toLowerCase()
    let bestMatch: (typeof matchingUsers)[number] | null = null

    for (const user of matchingUsers) {
      if (!user.full_name) continue
      const nameLower = user.full_name.toLowerCase()
      if (chunkLower === nameLower || chunkLower.startsWith(nameLower + ' ')) {
        if (!bestMatch || user.full_name.length > (bestMatch.full_name?.length || 0)) {
          bestMatch = user
        }
      }
    }

    if (bestMatch?.full_name) {
      matchedUsers.set(bestMatch.id, { id: bestMatch.id, full_name: bestMatch.full_name })
    }
  }

  const users = Array.from(matchedUsers.values())
  if (users.length === 0) return []

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

  return users
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
