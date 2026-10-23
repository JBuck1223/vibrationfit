import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Member access, decided by the database (public.has_member_access and
 * public.vibe_tribe_unlocked) so the app, the API and row-level security all
 * use one definition:
 *
 * - Members: admins, super admins, coaches, complimentary accounts, an
 *   active / trialing / past-due subscription (or a canceled one until its
 *   paid period ends), or an active member of a paying household.
 * - Free accounts (Free Activation) are not members: no member app at all.
 * - Vibe Tribe opens for a member once Getting Started reaches its step.
 *
 * Any error counts as no access.
 */

/** Where a signed-in non-member is sent instead of the member app. */
export const NON_MEMBER_HOME = '/join'

export async function hasMemberAccess(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_member_access', { uid: userId })
  if (error) {
    console.error('[member-access] has_member_access failed:', error.message)
    return false
  }
  return data === true
}

export async function isVibeTribeUnlocked(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('vibe_tribe_unlocked', { uid: userId })
  if (error) {
    console.error('[member-access] vibe_tribe_unlocked failed:', error.message)
    return false
  }
  return data === true
}
