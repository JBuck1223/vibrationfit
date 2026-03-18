import type { SupabaseClient } from '@supabase/supabase-js'
import { getUserBadgeProgress } from '@/lib/badges/evaluate'

export type GraduateChecklistProgress = {
  firstDailyActivation: boolean
  calibrationCallAttended: boolean
  firstVibeTribePost: boolean
  vibeTribesAboutInfo: boolean
  firstAlignmentGymSession: boolean
  firstAdvancedAudioMix: boolean
  earningBadges: boolean
}

export type GraduateChecklistResult = {
  isGraduate: boolean
  progress: GraduateChecklistProgress | null
}

/**
 * Get graduate status and 7-day checklist progress for a user.
 * Use from server (dashboard page) or API route.
 */
export async function getGraduateChecklist(
  supabase: SupabaseClient,
  userId: string
): Promise<GraduateChecklistResult> {
  const { data: completedChecklist } = await supabase
    .from('intensive_checklist')
    .select('id, calibration_call_completed')
    .eq('user_id', userId)
    .or('status.eq.completed,unlock_completed.eq.true')
    .order('unlock_completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!completedChecklist) {
    return { isGraduate: false, progress: null }
  }

  const [
    vibePostsCount,
    alignmentGymSessions,
    audioTracksWithMix,
    badgeProgress,
    activationBadgesCount,
    userAboutMe,
  ] = await Promise.all([
    supabase
      .from('vibe_posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false),
    supabase
      .from('video_session_participants')
      .select('session_id')
      .eq('user_id', userId),
    supabase
      .from('audio_tracks')
      .select('id')
      .eq('user_id', userId)
      .eq('mix_status', 'completed')
      .limit(1),
    getUserBadgeProgress(supabase, userId),
    supabase
      .from('user_badges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .like('badge_type', 'activated_%'),
    supabase
      .from('user_accounts')
      .select('about_me')
      .eq('id', userId)
      .maybeSingle(),
  ])

  let alignmentGymCount = 0
  if (alignmentGymSessions.data?.length) {
    const sessionIds = alignmentGymSessions.data.map((p: { session_id: string }) => p.session_id)
    const { count } = await supabase
      .from('video_sessions')
      .select('*', { count: 'exact', head: true })
      .in('id', sessionIds)
      .eq('session_type', 'alignment_gym')
    alignmentGymCount = count ?? 0
  }

  const progress: GraduateChecklistProgress = {
    firstDailyActivation: (badgeProgress?.activationDays ?? 0) >= 1,
    calibrationCallAttended: completedChecklist.calibration_call_completed === true,
    firstVibeTribePost: (vibePostsCount.count ?? 0) >= 1,
    vibeTribesAboutInfo: !!(userAboutMe.data?.about_me),
    firstAlignmentGymSession: alignmentGymCount >= 1,
    firstAdvancedAudioMix: (audioTracksWithMix.data?.length ?? 0) >= 1,
    earningBadges: (activationBadgesCount.count ?? 0) >= 1,
  }

  return { isGraduate: true, progress }
}
