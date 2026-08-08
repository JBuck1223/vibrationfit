/**
 * VIVA Household Lens (opt-in)
 *
 * When BOTH members of a household turn on VIVA sharing
 * (household_sharing_settings.viva_mode = 'all'), the coach can hold the
 * shared family story: memory items, constraints, and embeddings created
 * while sharing is on carry household_id, and each member's coach sees the
 * other's shared items with attribution.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { getHouseholdContext } from '@/lib/household/context'

export interface VivaHouseholdLens {
  householdId: string
  householdName: string
  /** Other members with mutual VIVA sharing on, with display names. */
  sharedMembers: { userId: string; name: string }[]
  /** userId -> first name, for attributing shared memory (includes self). */
  nameByUserId: Record<string, string>
}

/**
 * Returns the household lens when the member AND at least one other household
 * member have opted into VIVA sharing. Null otherwise (per-member privacy is
 * the default).
 */
export async function getVivaHouseholdLens(
  supabase: SupabaseClient,
  userId: string
): Promise<VivaHouseholdLens | null> {
  try {
    const { data: mine } = await supabase
      .from('household_sharing_settings')
      .select('household_id')
      .eq('user_id', userId)
      .eq('viva_mode', 'all')
      .maybeSingle()

    if (!mine?.household_id) return null

    const { data: others } = await supabase
      .from('household_sharing_settings')
      .select('user_id')
      .eq('household_id', mine.household_id)
      .eq('viva_mode', 'all')
      .neq('user_id', userId)

    if (!others || others.length === 0) return null

    const context = await getHouseholdContext(userId)
    if (!context) return null

    const sharedMembers = others
      .map(o => context.memberMap[o.user_id])
      .filter(Boolean)
      .map(m => ({ userId: m.userId, name: m.firstName || m.displayName }))

    if (sharedMembers.length === 0) return null

    const nameByUserId: Record<string, string> = {}
    for (const m of context.members) {
      nameByUserId[m.userId] = m.firstName || m.displayName
    }

    return {
      householdId: context.householdId,
      householdName: context.householdName,
      sharedMembers,
      nameByUserId,
    }
  } catch (err) {
    console.error('[VIVA Household Lens] Error:', err)
    return null
  }
}
