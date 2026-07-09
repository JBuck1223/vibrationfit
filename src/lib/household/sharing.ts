// Helpers for the per-feature "share all" mode (household_sharing_settings).
//
// RLS makes share-all rows *visible*, but API routes that build explicit
// queries (e.g. scope=household lenses) also need to know which members share
// everything so those rows can be included even though household_id is NULL.

import type { SupabaseClient } from '@supabase/supabase-js'

export type SharingFeature =
  | 'life_visions'
  | 'vision_board'
  | 'abundance'
  | 'audio'
  | 'projects'
  | 'stories'

const FEATURE_COLUMN: Record<SharingFeature, string> = {
  life_visions: 'life_visions_mode',
  vision_board: 'vision_board_mode',
  abundance: 'abundance_mode',
  audio: 'audio_mode',
  projects: 'projects_mode',
  stories: 'stories_mode',
}

/**
 * Returns the user ids of household members who have "share all" enabled for
 * the given feature. Uses the caller's supabase client, so RLS applies
 * (household members can read each other's settings rows).
 */
export async function getShareAllMemberIds(
  supabase: SupabaseClient,
  householdId: string,
  feature: SharingFeature
): Promise<string[]> {
  const column = FEATURE_COLUMN[feature]
  const { data, error } = await supabase
    .from('household_sharing_settings')
    .select(`user_id, ${column}`)
    .eq('household_id', householdId)
    .eq(column, 'all')

  if (error) {
    console.error('[getShareAllMemberIds] Query error:', error)
    return []
  }
  return (data || []).map((row) => (row as unknown as { user_id: string }).user_id)
}
