import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Maps activity_type values on commitments to legacy area keys (area-stats / client).
 * Prefer autoVerifyOccurrenceByActivityType for MAP verification.
 */
const ACTIVITY_TO_AREA: Record<string, string> = {
  vision_audio: 'vision-audio',
  morning_vision: 'vision-audio',
  night_immersion: 'vision-audio',
  realtime_activation: 'vision-audio',
  story_audio: 'story-audio',
  music_listen: 'music-listen',
  vision_read: 'life-vision',
  vision_board_view: 'vision-board',
  vision_board_update: 'vision-board',
  journal_entry: 'journal',
  journal_review: 'journal-review',
  daily_paper: 'daily-paper',
  alignment_gym: 'alignment-gym',
  vibe_tribe_post: 'vibe-tribe',
  vibe_tribe_engage: 'vibe-tribe',
  abundance_tracker: 'abundance-tracker',
}

function getActivityTypesForArea(areaKey: string): string[] {
  return Object.entries(ACTIVITY_TO_AREA)
    .filter(([, area]) => area === areaKey)
    .map(([type]) => type)
}

/**
 * Mark the first pending occurrence for the given activity type on the given date.
 */
export async function autoVerifyOccurrenceByActivityType(
  userId: string,
  activityType: string,
  occurredOn?: string,
): Promise<{ verified: boolean; occurrenceId?: string }> {
  const supabase = createAdminClient()
  const date = occurredOn ?? new Date().toISOString().split('T')[0]

  const { data: commitments } = await supabase
    .from('commitments')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('activity_type', activityType)

  if (!commitments?.length) return { verified: false }

  const commitmentIds = commitments.map((c) => c.id)

  const { data: occurrence } = await supabase
    .from('commitment_occurrences')
    .select('id')
    .eq('user_id', userId)
    .eq('occurred_on', date)
    .eq('status', 'pending')
    .in('commitment_id', commitmentIds)
    .order('occurred_on', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!occurrence) return { verified: false }

  await supabase
    .from('commitment_occurrences')
    .update({
      status: 'yes',
      verified_at: new Date().toISOString(),
    })
    .eq('id', occurrence.id)

  return { verified: true, occurrenceId: occurrence.id }
}

/**
 * Auto-verify today's pending commitment occurrences when the user
 * completes an on-platform action (legacy area-key API).
 */
export async function autoVerifyOccurrence(
  userId: string,
  areaKey: string,
  occurredOn?: string,
): Promise<{ verified: boolean; occurrenceId?: string }> {
  const activityTypes = getActivityTypesForArea(areaKey)
  if (activityTypes.length === 0) return { verified: false }

  const supabase = createAdminClient()
  const date = occurredOn ?? new Date().toISOString().split('T')[0]

  const { data: commitments } = await supabase
    .from('commitments')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .in('activity_type', activityTypes)

  if (!commitments?.length) return { verified: false }

  const commitmentIds = commitments.map((c) => c.id)

  const { data: occurrence } = await supabase
    .from('commitment_occurrences')
    .select('id')
    .eq('user_id', userId)
    .eq('occurred_on', date)
    .eq('status', 'pending')
    .in('commitment_id', commitmentIds)
    .limit(1)
    .maybeSingle()

  if (!occurrence) return { verified: false }

  await supabase
    .from('commitment_occurrences')
    .update({
      status: 'yes',
      verified_at: new Date().toISOString(),
    })
    .eq('id', occurrence.id)

  return { verified: true, occurrenceId: occurrence.id }
}
