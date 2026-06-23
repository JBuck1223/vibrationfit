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

/**
 * Resolve the life category keys for a song. Prefers the creator's explicit
 * tags (songs.life_categories) and falls back to the source entity's category.
 */
export async function getSongLifeCategories(db: AdminDb, songId: string): Promise<string[]> {
  const { data: song } = await db
    .from('songs')
    .select('entity_type, entity_id, life_categories')
    .eq('id', songId)
    .single()

  if (!song) return []

  // Creator-selected tags take precedence (source-agnostic tagging).
  if (Array.isArray(song.life_categories) && song.life_categories.length > 0) {
    return song.life_categories as string[]
  }

  if (!song.entity_id) return []

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

  const [{ data: song }, { data: account }] = await Promise.all([
    db.from('songs').select('title, lyrics').eq('id', songId).single(),
    db.from('user_accounts').select('full_name, first_name, last_name').eq('id', userId).single(),
  ])

  const creatorName = account?.full_name
    || [account?.first_name, account?.last_name].filter(Boolean).join(' ')
    || null
  const description = creatorName ? `Created by ${creatorName}` : 'Member created song'

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
    description,
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

export type MemberCatalogRow = {
  id: string
  title?: string | null
  preview_url?: string | null
  tags?: string[] | null
  created_at?: string | null
}

/** Normalize catalog tags from Supabase (always a string array). */
export function catalogTrackTags(track: { tags?: unknown }): string[] {
  return Array.isArray(track.tags) ? track.tags : []
}

/** Admin-curated Vibration Fit music (site-assets/music on CDN). */
export function isOfficialMusicCatalogTrack(track: { preview_url?: string | null }): boolean {
  return Boolean(track.preview_url?.includes('/site-assets/music/'))
}

/** Assigned member user id for an official catalog track (`creator:` tag). */
export function officialCatalogCreatorUserId(track: { tags?: unknown }): string | null {
  const tag = catalogTrackTags(track).find((t) => t.startsWith('creator:'))
  return tag ? tag.slice('creator:'.length).trim() || null : null
}

/** Member-shared catalog row (user-uploads path or member-created tag). */
export function isMemberCreatedCatalogTrack(track: {
  tags?: unknown
  preview_url?: string | null
}): boolean {
  if (catalogTrackTags(track).includes(MEMBER_CREATED_TAG)) return true
  return Boolean(track.preview_url?.includes('/user-uploads/'))
}

/** Tracks shown under Listen > Music > Published. */
export function isPublishedFilterTrack(track: {
  tags?: unknown
  preview_url?: string | null
}): boolean {
  if (isOfficialMusicCatalogTrack(track)) return true
  if (!isMemberCreatedCatalogTrack(track)) return true
  return catalogTrackTags(track).includes('published')
}

/** Tracks shown under Listen > Music > Member Library. */
export function isMemberLibraryFilterTrack(track: {
  tags?: unknown
  preview_url?: string | null
}): boolean {
  return isMemberCreatedCatalogTrack(track)
}

/** Stable song identity for member catalog rows (song UUID from preview URL, or creator+title). */
export function memberCatalogSongKey(track: MemberCatalogRow): string {
  const url = track.preview_url || ''
  const songMatch = url.match(/\/songs\/([0-9a-f-]{36})\//i)
  if (songMatch) return songMatch[1]!

  const creator = track.tags?.find((t) => t.startsWith('creator:')) || 'unknown'
  const title = (track.title || '').trim().toLowerCase()
  return `${creator}:${title}`
}

function trackVersionFromPreviewUrl(previewUrl?: string | null): number {
  if (!previewUrl) return 0
  const match = previewUrl.match(/\/track-(\d+)\./i)
  return match ? parseInt(match[1], 10) : 0
}

/** Higher rank wins when picking the single member-library track per song. */
function memberCatalogTrackRank(track: MemberCatalogRow): number {
  let rank = 0
  if (track.tags?.includes('published')) rank += 10_000
  rank += trackVersionFromPreviewUrl(track.preview_url)
  if (track.created_at) rank += new Date(track.created_at).getTime() / 1e15
  return rank
}

/** Normalize catalog title for alphabetical sorting. */
export function musicCatalogTitleSortKey(title?: string | null): string {
  return (title || '')
    .trim()
    .replace(/^#\s+/, '')
    .toLowerCase()
}

export function compareMusicCatalogByTitle(
  a: { title?: string | null },
  b: { title?: string | null },
): number {
  return musicCatalogTitleSortKey(a.title).localeCompare(
    musicCatalogTitleSortKey(b.title),
    undefined,
    { sensitivity: 'base', numeric: true },
  )
}

/** Keep one catalog row per song for member library display. */
export function dedupeMemberCatalogTracks<T extends MemberCatalogRow>(tracks: T[]): T[] {
  const bySong = new Map<string, T>()
  for (const track of tracks) {
    const key = memberCatalogSongKey(track)
    const existing = bySong.get(key)
    if (!existing || memberCatalogTrackRank(track) > memberCatalogTrackRank(existing)) {
      bySong.set(key, track)
    }
  }
  return Array.from(bySong.values()).sort(compareMusicCatalogByTitle)
}
