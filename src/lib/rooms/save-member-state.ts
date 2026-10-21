import type { createClient } from '@/lib/supabase/server'
type Client = Awaited<ReturnType<typeof createClient>>
/** Compare-and-swap keeps widget edits and continuity writes from overwriting each other.
 * Uses the existing member-owned JSON preferences row; no schema migration is needed. */
export async function updateMemberState(
  client: Client,
  userId: string,
  update: (layout: Record<string, unknown>) => Record<string, unknown>,
) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await client
      .from('member_dashboard_layouts')
      .select('layout,updated_at')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw new Error('Could not read member preferences')
    const current =
      data?.layout && typeof data.layout === 'object' ? data.layout : {}
    const next = update(current)
    if (!data) {
      const result = await client
        .from('member_dashboard_layouts')
        .insert({ user_id: userId, layout: next })
      if (!result.error) return next
      if (result.error.code === '23505') continue
      throw new Error('Could not save member preferences')
    }
    const result = await client
      .from('member_dashboard_layouts')
      .update({ layout: next })
      .eq('user_id', userId)
      .eq('updated_at', data.updated_at)
      .select('user_id')
    if (result.error) throw new Error('Could not save member preferences')
    if (result.data?.length) return next
  }
  throw new Error('Preferences changed. Please try again.')
}
