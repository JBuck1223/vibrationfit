import type { SupabaseClient } from '@supabase/supabase-js'

export type GraduateChecklistProgress = {
  firstDailyActivation: boolean
  firstAdvancedAudioMix: boolean
  firstAlignmentGymSession: boolean
  firstStory: boolean
  firstDailyPaper: boolean
  firstAbundanceEntry: boolean
  vibeTribesAboutInfo: boolean
}

export type GraduateChecklistResult = {
  isGraduate: boolean
  progress: GraduateChecklistProgress | null
}

function hasFrequencyEnhancement(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') return false
  const meta = metadata as Record<string, unknown>
  if (typeof meta.frequency_track_name === 'string' && meta.frequency_track_name.length > 0) {
    return true
  }
  if (typeof meta.frequency_volume === 'number' && meta.frequency_volume > 0) {
    return true
  }
  return false
}

async function hasPostGraduateMapActivation(
  supabase: SupabaseClient,
  userId: string,
  unlockCompletedAt: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('commitment_occurrences')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'yes')
    .gte('verified_at', unlockCompletedAt)
    .limit(1)

  return (data?.length ?? 0) > 0
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
    .select('id, unlock_completed_at')
    .eq('user_id', userId)
    .or('status.eq.completed,unlock_completed.eq.true')
    .order('unlock_completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!completedChecklist) {
    return { isGraduate: false, progress: null }
  }

  const unlockCompletedAt = completedChecklist.unlock_completed_at

  const [
    alignmentGymSessions,
    audioSetsWithTracks,
    userAboutMe,
    storiesCount,
    dailyPapersCount,
    abundanceEventsCount,
    firstDailyActivation,
  ] = await Promise.all([
    supabase
      .from('video_session_participants')
      .select('session_id')
      .eq('user_id', userId),
    supabase
      .from('audio_sets')
      .select('id, metadata, audio_tracks(mix_status)')
      .eq('user_id', userId),
    supabase
      .from('user_accounts')
      .select('about_me')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('stories')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('daily_papers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('abundance_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    unlockCompletedAt
      ? hasPostGraduateMapActivation(supabase, userId, unlockCompletedAt)
      : Promise.resolve(false),
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

  const firstAdvancedAudioMix = (audioSetsWithTracks.data ?? []).some((set) => {
    if (!hasFrequencyEnhancement(set.metadata)) return false
    const tracks = set.audio_tracks as Array<{ mix_status: string }> | null
    return tracks?.some((track) => track.mix_status === 'completed') ?? false
  })

  const progress: GraduateChecklistProgress = {
    firstDailyActivation,
    firstAdvancedAudioMix,
    firstAlignmentGymSession: alignmentGymCount >= 1,
    firstStory: (storiesCount.count ?? 0) >= 1,
    firstDailyPaper: (dailyPapersCount.count ?? 0) >= 1,
    firstAbundanceEntry: (abundanceEventsCount.count ?? 0) >= 1,
    vibeTribesAboutInfo: !!(userAboutMe.data?.about_me),
  }

  return { isGraduate: true, progress }
}
