/**
 * Catalog sync for member-created songs.
 *
 * When a member hearts one of their song tracks it is automatically shared to
 * the public Vibration Fit Music catalog (/audio/music) for all members. When
 * they unheart it, the shared catalog row is removed. Admin can later flag a
 * shared track as `published` (live on streaming platforms).
 *
 * Shared rows are identified by the `member-created` tag so we never touch
 * admin-curated catalog entries.
 */

import type { createAdminClient } from '@/lib/supabase/admin'

type AdminDb = ReturnType<typeof createAdminClient>

const MEMBER_CREATED_TAG = 'member-created'

// Maps a song's source entity to the table/column that holds its life category.
const ENTITY_CATEGORY_LOOKUP: Record<string, { table: string; column: string }> = {
  life_vision: { table: 'life_visions', column: 'category' },
  vision_board_item: { table: 'vision_board_items', column: 'life_category' },
  journal_entry: { table: 'journal_entries', column: 'life_category' },
}

/** Resolve the life category keys attached to a song via its source entity. */
export async function getSongLifeCategories(db: AdminDb, songId: string): Promise<string[]> {
  const { data: song } = await db
    .from('songs')
    .select('entity_type, entity_id')
    .eq('id', songId)
    .single()

  if (!song?.entity_id) return []

  const lookup = ENTITY_CATEGORY_LOOKUP[song.entity_type as string]
  if (!lookup) return []

  const { data } = await db
    .from(lookup.table)
    .select(lookup.column)
    .eq('id', song.entity_id)
    .single()

  const value = (data as Record<string, unknown> | null)?.[lookup.column]
  return value ? [String(value)] : []
}

/**
 * Add (or reactivate) a member's track in the public music catalog.
 * Idempotent: dedupes on the track's preview/mp3 URL.
 */
export async function shareTrackToCatalog(
  db: AdminDb,
  { userId, songId, trackId }: { userId: string; songId: string; trackId: string },
): Promise<void> {
  const { data: track } = await db
    .from('song_tracks')
    .select('id, mp3_url, cover_url, duration_ms')
    .eq('id', trackId)
    .single()

  if (!track?.mp3_url) {
    console.warn('[CatalogSync] Cannot share track — missing mp3_url')
    return
  }

  const { data: song } = await db
    .from('songs')
    .select('title, lyrics')
    .eq('id', songId)
    .single()

  const title = song?.title || 'Untitled'
  const lifeCategories = await getSongLifeCategories(db, songId)
  const tags = [...new Set([MEMBER_CREATED_TAG, `creator:${userId}`, ...lifeCategories])]

  const { data: existing } = await db
    .from('music_catalog')
    .select('id, tags')
    .eq('preview_url', track.mp3_url)
    .maybeSingle()

  if (existing) {
    const mergedTags = [...new Set([...(existing.tags || []), ...tags])]
    await db
      .from('music_catalog')
      .update({ tags: mergedTags, is_active: true, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    return
  }

  const { error } = await db.from('music_catalog').insert({
    title,
    artist: 'Vibration Fit',
    tags,
    preview_url: track.mp3_url,
    artwork_url: track.cover_url || null,
    duration_seconds: track.duration_ms ? Math.round(track.duration_ms / 1000) : null,
    plain_lyrics: song?.lyrics || null,
    description: 'Member created song',
    is_active: true,
    release_date: new Date().toISOString().slice(0, 10),
  })

  if (error) {
    console.error('[CatalogSync] Failed to add to music_catalog:', error)
  }
}

/**
 * Remove a member's track from the public catalog (on unheart).
 * Only removes member-created rows so admin-curated entries are never deleted.
 */
export async function unshareTrackFromCatalog(db: AdminDb, mp3Url: string | null): Promise<void> {
  if (!mp3Url) return

  const { error } = await db
    .from('music_catalog')
    .delete()
    .eq('preview_url', mp3Url)
    .contains('tags', [MEMBER_CREATED_TAG])

  if (error) {
    console.error('[CatalogSync] Failed to remove from music_catalog:', error)
  }
}
