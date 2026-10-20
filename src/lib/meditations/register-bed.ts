import type { createAdminClient } from '@/lib/supabase/admin'

type AdminDb = ReturnType<typeof createAdminClient>

function bedName(songTrackId: string) {
  return `meditation-${songTrackId}`
}

/**
 * Publish or hide a member instrumental as a Life Vision background bed.
 * The row is keyed by song track so re-sharing updates the same bed.
 * Unsharing deactivates it only when no other shared session still uses the file.
 */
export async function syncSharedInstrumentalBed(
  db: AdminDb,
  {
    songTrackId,
    userId,
    title,
    fileUrl,
    durationSeconds,
    shared,
  }: {
    songTrackId: string
    userId: string
    title: string
    fileUrl: string
    durationSeconds: number | null
    shared: boolean
  },
): Promise<void> {
  const name = bedName(songTrackId)

  if (!shared) {
    const { count } = await db
      .from('meditations')
      .select('id', { count: 'exact', head: true })
      .eq('music_song_track_id', songTrackId)
      .eq('is_shared', true)

    if ((count ?? 0) > 0) return

    await db
      .from('audio_background_tracks')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('name', name)
    return
  }

  const payload = {
    display_name: title,
    file_url: fileUrl,
    duration_seconds: durationSeconds,
    category: 'meditations',
    is_active: true,
    created_by: userId,
    updated_at: new Date().toISOString(),
  }

  const { data: existing } = await db
    .from('audio_background_tracks')
    .select('id')
    .eq('name', name)
    .maybeSingle()

  if (existing) {
    await db.from('audio_background_tracks').update(payload).eq('id', existing.id)
    return
  }

  await db.from('audio_background_tracks').insert({
    name,
    sort_order: 500,
    ...payload,
  })
}
