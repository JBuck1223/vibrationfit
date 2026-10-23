import type { SupabaseClient } from '@supabase/supabase-js'
import { hasMemberAccess, NON_MEMBER_HOME } from '@/lib/access/member-access'

export const BEGIN_HOME = '/begin'
export const MEMBER_HOME = '/dashboard'
export { NON_MEMBER_HOME }

export type MemberHome = typeof BEGIN_HOME | typeof MEMBER_HOME | typeof NON_MEMBER_HOME

/**
 * Where a signed-in member lands: Getting Started (/begin) until Life
 * Activation onboarding is complete, then the main dashboard.
 *
 * Works with any Supabase client (server, service role, or browser) so the
 * same rule drives the auth redirects and the /dashboard gate.
 *
 * Resolution order:
 *  0. Not a member (no paid access, e.g. a Free Activation account): /join.
 *     Getting Started is part of the member app, never a free one.
 *  1. A life_activation_progress row is authoritative: in the flow until
 *     onboarding_completed_at is set.
 *  2. No row yet + an open legacy Intensive: still onboarding.
 *  3. No row yet + a committed personal Life Vision: an established member
 *     who predates Life Activation. Leave them on the dashboard; the sidebar
 *     still offers Getting Started.
 *  4. Otherwise: a new member. Send them to Getting Started.
 */
export async function resolveMemberHome(
  supabase: SupabaseClient,
  userId: string,
): Promise<MemberHome> {
  if (!(await hasMemberAccess(supabase, userId))) return NON_MEMBER_HOME

  const { data: progress } = await supabase
    .from('life_activation_progress')
    .select('onboarding_completed_at, onboarding')
    .eq('user_id', userId)
    .maybeSingle()

  if (progress) {
    const onboarding = progress.onboarding as Record<string, unknown> | null
    const done = Boolean(progress.onboarding_completed_at) || Boolean(onboarding?.complete)
    return done ? MEMBER_HOME : BEGIN_HOME
  }

  const [{ data: activeIntensive }, { data: activeVision }] = await Promise.all([
    supabase
      .from('intensive_checklist')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('vision_versions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('is_draft', false)
      .is('household_id', null)
      .limit(1)
      .maybeSingle(),
  ])

  if (activeIntensive) return BEGIN_HOME
  if (activeVision) return MEMBER_HOME
  return BEGIN_HOME
}
