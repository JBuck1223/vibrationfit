/**
 * Public artist page helpers (server-only).
 *
 * An artist's handle is their referral code — the member's app-wide
 * username. Old codes still resolve via referral_code_history (the page
 * redirects to the current handle), and raw user ids are accepted as a
 * fallback for members who haven't joined the referral program yet.
 *
 * Uses the admin client: song_tracks/music_catalog aren't publicly readable
 * via RLS, and these pages are unauthenticated.
 */

import { randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { dedupeMemberCatalogTracks } from '@/lib/songs/catalog-sync'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type AdminDb = ReturnType<typeof createAdminClient>

export function generateShareToken(): string {
  return randomBytes(12).toString('base64url')
}

export interface ResolvedArtistHandle {
  userId: string
  /** Current canonical handle: referral code when present, else user id. */
  canonicalHandle: string
  /** True when the requested handle is outdated (caller should redirect). */
  isStale: boolean
  referralCode: string | null
}

export async function resolveArtistHandle(handle: string): Promise<ResolvedArtistHandle | null> {
  const trimmed = (handle || '').trim()
  if (!trimmed) return null

  const adminDb = createAdminClient()

  // Current referral code.
  const { data: participant } = await adminDb
    .from('referral_participants')
    .select('user_id, referral_code')
    .ilike('referral_code', trimmed)
    .not('user_id', 'is', null)
    .maybeSingle()

  if (participant?.user_id) {
    return {
      userId: participant.user_id,
      canonicalHandle: participant.referral_code,
      isStale: participant.referral_code !== trimmed,
      referralCode: participant.referral_code,
    }
  }

  // Old referral code (member renamed their handle).
  const { data: history } = await adminDb
    .from('referral_code_history')
    .select('participant_id')
    .ilike('old_code', trimmed)
    .maybeSingle()

  if (history?.participant_id) {
    const { data: owner } = await adminDb
      .from('referral_participants')
      .select('user_id, referral_code')
      .eq('id', history.participant_id)
      .not('user_id', 'is', null)
      .maybeSingle()
    if (owner?.user_id) {
      return {
        userId: owner.user_id,
        canonicalHandle: owner.referral_code,
        isStale: true,
        referralCode: owner.referral_code,
      }
    }
  }

  // Raw user id fallback; redirect to the pretty handle when one exists.
  if (UUID_RE.test(trimmed)) {
    const { data: byUser } = await adminDb
      .from('referral_participants')
      .select('referral_code')
      .eq('user_id', trimmed)
      .maybeSingle()
    return {
      userId: trimmed,
      canonicalHandle: byUser?.referral_code || trimmed,
      isStale: Boolean(byUser?.referral_code),
      referralCode: byUser?.referral_code || null,
    }
  }

  return null
}

/** Best public handle for a user (for building artist links). */
export async function artistHandleForUser(adminDb: AdminDb, userId: string): Promise<string> {
  const { data } = await adminDb
    .from('referral_participants')
    .select('referral_code')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.referral_code || userId
}

export interface PublicArtistTrack {
  id: string
  title: string
  artist_name: string
  mp3_url: string
  cover_url: string | null
  duration_ms: number | null
  genres: string[]
  moods: string[]
  share_token: string
}

export interface PublicArtist {
  userId: string
  name: string
  avatarUrl: string | null
  referralCode: string | null
  tracks: PublicArtistTrack[]
}

/**
 * Mint a share token for a catalog row that doesn't have one yet.
 * Safe under concurrency: falls back to re-reading if another request won.
 */
async function ensureCatalogShareToken(adminDb: AdminDb, catalogId: string): Promise<string | null> {
  const token = generateShareToken()
  const { data: updated } = await adminDb
    .from('music_catalog')
    .update({ share_token: token })
    .eq('id', catalogId)
    .is('share_token', null)
    .select('share_token')
    .maybeSingle()
  if (updated?.share_token) return updated.share_token

  const { data: row } = await adminDb
    .from('music_catalog')
    .select('share_token')
    .eq('id', catalogId)
    .maybeSingle()
  return row?.share_token || null
}

/**
 * Load an artist's public profile and their tracks (everything credited to
 * them on /audio/music: member-library songs synced into the catalog plus
 * official catalog songs assigned via the `creator:` tag).
 */
export async function getPublicArtist(userId: string): Promise<PublicArtist | null> {
  const adminDb = createAdminClient()

  const [{ data: account }, { data: catalogRows }, { data: participant }] = await Promise.all([
    adminDb
      .from('user_accounts')
      .select('full_name, first_name, last_name, profile_picture_url')
      .eq('id', userId)
      .maybeSingle(),
    adminDb
      .from('music_catalog')
      .select('id, title, preview_url, artwork_url, duration_seconds, genre, tags, created_at, share_token')
      .eq('is_active', true)
      .not('preview_url', 'is', null)
      .contains('tags', [`creator:${userId}`]),
    adminDb
      .from('referral_participants')
      .select('referral_code')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const deduped = dedupeMemberCatalogTracks(catalogRows || [])
  if (deduped.length === 0) return null

  const name = account?.full_name
    || [account?.first_name, account?.last_name].filter(Boolean).join(' ').trim()
    || 'Vibration Fit Member'

  const tracks = (await Promise.all(
    deduped.map(async (row): Promise<PublicArtistTrack | null> => {
      const token = row.share_token || await ensureCatalogShareToken(adminDb, row.id)
      if (!token) return null
      return {
        id: row.id,
        title: row.title,
        artist_name: name,
        mp3_url: row.preview_url!,
        cover_url: row.artwork_url || null,
        duration_ms: typeof row.duration_seconds === 'number' ? row.duration_seconds * 1000 : null,
        genres: row.genre ? [row.genre] : [],
        moods: [],
        share_token: token,
      }
    })
  )).filter((t): t is PublicArtistTrack => t !== null)

  return {
    userId,
    name,
    avatarUrl: account?.profile_picture_url || null,
    referralCode: participant?.referral_code || null,
    tracks,
  }
}
