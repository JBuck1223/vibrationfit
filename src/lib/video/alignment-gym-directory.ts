import type { VideoSession } from '@/lib/video/types'

/**
 * Sessions that appear on /alignment-gym (matches Supabase .or() on that page).
 * Used for routing replays and API access parity with the directory.
 */
export function isAlignmentGymDirectorySession(
  session: Pick<VideoSession, 'session_type' | 'title'>
): boolean {
  if (session.session_type === 'alignment_gym') return true
  if (session.session_type === 'group') return true
  if (typeof session.title === 'string' && /alignment gym/i.test(session.title)) return true
  return false
}
