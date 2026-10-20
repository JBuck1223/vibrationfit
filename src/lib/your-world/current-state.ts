/**
 * "Where they are now" for one life area. Members write it in Life Vision
 * ("what's going on now"); older members may only have a Profile essay,
 * which stays readable as a fallback.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export async function loadCurrentStateText(
  supabase: SupabaseClient,
  userId: string,
  category: string,
): Promise<string> {
  const { data: sessions } = await supabase
    .from('vision_draft_sessions')
    .select('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(5)
  const sessionIds = (sessions || []).map((s) => s.id as string)
  if (sessionIds.length > 0) {
    const { data: rows } = await supabase
      .from('vision_draft_session_category_text')
      .select('now_text, updated_at')
      .in('session_id', sessionIds)
      .eq('category', category)
      .not('now_text', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
    const text = (rows?.[0]?.now_text as string | undefined)?.trim()
    if (text) return text
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select(`state_${category}`)
    .eq('user_id', userId)
    .eq('is_draft', false)
    .order('is_active', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const legacy = (profile as Record<string, unknown> | null)?.[`state_${category}`]
  return typeof legacy === 'string' ? legacy.trim() : ''
}
