import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Maps activity_type values on commitments to area_activations area keys.
 * Multiple activity types can map to the same area.
 */
const ACTIVITY_TO_AREA: Record<string, string> = {
  vision_audio: 'vision-audio',
  morning_vision: 'vision-audio',
  night_immersion: 'vision-audio',
  realtime_activation: 'vision-audio',
  journal_entry: 'journal',
  daily_paper: 'daily-paper',
  alignment_gym: 'alignment-gym',
  vibe_tribe_post: 'vibe-tribe',
  vibe_tribe_engage: 'vibe-tribe',
  vision_board_update: 'vision-board',
  abundance_tracker: 'abundance-tracker',
}

/**
 * Reverse: area key -> all matching activity types.
 */
function getActivityTypesForArea(areaKey: string): string[] {
  return Object.entries(ACTIVITY_TO_AREA)
    .filter(([, area]) => area === areaKey)
    .map(([type]) => type)
}

/**
 * Auto-verify today's pending commitment occurrences when the user
 * completes an on-platform action.
 *
 * Called after area_activations is written (e.g. audio play, journal save).
 * Finds pending occurrences for today whose commitment's activity_type
 * matches the given area, and marks the first one as 'yes'.
 */
export async function autoVerifyOccurrence(
  userId: string,
  areaKey: string,
): Promise<{ verified: boolean; occurrenceId?: string }> {
  const activityTypes = getActivityTypesForArea(areaKey)
  if (activityTypes.length === 0) return { verified: false }

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: commitments } = await supabase
    .from('commitments')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .in('activity_type', activityTypes)

  if (!commitments || commitments.length === 0) return { verified: false }

  const commitmentIds = commitments.map(c => c.id)

  const { data: occurrence } = await supabase
    .from('commitment_occurrences')
    .select('id')
    .eq('user_id', userId)
    .eq('occurred_on', today)
    .eq('status', 'pending')
    .in('commitment_id', commitmentIds)
    .limit(1)
    .single()

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
 * Client-side helper: fire-and-forget auto-verify via API.
 */
export async function autoVerifyClient(areaKey: string): Promise<void> {
  try {
    await fetch('/api/map/auto-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area: areaKey }),
    })
  } catch {
    // Silent failure — auto-verify is best-effort
  }
}
