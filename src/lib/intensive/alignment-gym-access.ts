import type { SupabaseClient } from '@supabase/supabase-js'

export const ALIGNMENT_GYM_GRADUATION_REQUIRED_MESSAGE =
  'Complete Graduation (Step 14) of your 72-Hour Vision Activation Intensive before joining Alignment Gym live sessions or replays.'

/**
 * True when the user is in an active Intensive and has not yet completed Graduation (Step 14).
 * Vision Pro members without an active Intensive are not locked.
 */
export async function isAlignmentGymSessionsLocked(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: account } = await supabase
    .from('user_accounts')
    .select('role')
    .eq('id', userId)
    .single()

  if (account?.role === 'super_admin') {
    return false
  }

  const { data: intensive } = await supabase
    .from('intensive_checklist')
    .select('unlock_completed')
    .eq('user_id', userId)
    .in('status', ['pending', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!intensive) {
    return false
  }

  return !intensive.unlock_completed
}
