import type { SupabaseClient } from '@supabase/supabase-js'
import type { SongStatus } from './types'

/**
 * Status to keep when lyrics are edited.
 * Saving lyrics must not dump a finished song back into the drafts list.
 */
export async function statusAfterLyricsEdit(
  supabase: SupabaseClient,
  songId: string,
  currentStatus?: string | null,
): Promise<SongStatus> {
  if (currentStatus === 'generating_music') return 'generating_music'

  const { count } = await supabase
    .from('song_tracks')
    .select('id', { count: 'exact', head: true })
    .eq('song_id', songId)
    .eq('status', 'completed')

  if ((count ?? 0) > 0 || currentStatus === 'completed') return 'completed'
  return 'lyrics_complete'
}
