import {
  JORDAN_BUCKINGHAM_USER_ID,
  VANESSA_BUCKINGHAM_USER_ID,
} from '@/lib/music/artists'

export interface MusicCatalogPerformer {
  name: string
  snapshotId: string
}

export interface TrackPerformerLink {
  name: string
  snapshotHref: string
}

/** Official catalog artists (links to /snapshot/[id]). */
export const MUSIC_CATALOG_PERFORMERS: readonly MusicCatalogPerformer[] = [
  { name: 'Vanessa Buckingham', snapshotId: VANESSA_BUCKINGHAM_USER_ID },
  { name: 'Jordan Buckingham', snapshotId: JORDAN_BUCKINGHAM_USER_ID },
] as const

const MUSIC_CATALOG_PERFORMER_BY_ID = Object.fromEntries(
  MUSIC_CATALOG_PERFORMERS.map((performer) => [performer.snapshotId, performer]),
) as Record<string, MusicCatalogPerformer>

function performerLinkForUserId(userId: string): TrackPerformerLink | null {
  const performer = MUSIC_CATALOG_PERFORMER_BY_ID[userId]
  if (!performer) return null
  return { name: performer.name, snapshotHref: `/snapshot/${performer.snapshotId}` }
}

function parseMemberCreatorName(description?: string | null): string | null {
  if (!description) return null
  const match = description.match(/^Created by (.+)$/i)
  return match?.[1]?.trim() || null
}

function parseMemberCreatorUserId(tags?: string[] | null): string | null {
  const tag = tags?.find((t) => t.startsWith('creator:'))
  return tag ? tag.slice('creator:'.length).trim() || null : null
}

/** Performer credits for Vibe Tribe member-created catalog tracks. */
export function memberCatalogPerformerLinks(
  description?: string | null,
  tags?: string[] | null,
): TrackPerformerLink[] {
  const name = parseMemberCreatorName(description)
  if (!name) return []

  const userId = parseMemberCreatorUserId(tags)
  return [{
    name,
    snapshotHref: userId ? `/snapshot/${userId}` : '/snapshot/me',
  }]
}

export function isMemberCreatedCatalogTrack(tags?: string[] | null) {
  return Array.isArray(tags) && tags.includes('member-created')
}

export function musicCatalogPerformerLinks(
  _trackId?: string,
  options?: { description?: string | null; tags?: string[] | null },
) {
  if (isMemberCreatedCatalogTrack(options?.tags)) {
    const memberLinks = memberCatalogPerformerLinks(options?.description, options?.tags)
    if (memberLinks.length) return memberLinks
    const userId = parseMemberCreatorUserId(options?.tags)
    if (userId) return [{ name: 'Vibration Fit', snapshotHref: `/snapshot/${userId}` }]
    return []
  }

  const creatorId = parseMemberCreatorUserId(options?.tags)
  const assignedArtist = creatorId ? performerLinkForUserId(creatorId) : null
  if (assignedArtist) return [assignedArtist]

  return MUSIC_CATALOG_PERFORMERS.map((p) => ({
    name: p.name,
    snapshotHref: `/snapshot/${p.snapshotId}`,
  }))
}

export function musicCatalogArtistFallback(
  _trackId?: string,
  album?: string | null,
  options?: { description?: string | null; tags?: string[] | null },
) {
  if (isMemberCreatedCatalogTrack(options?.tags)) {
    const memberLinks = memberCatalogPerformerLinks(options?.description, options?.tags)
    if (memberLinks.length) {
      const names = memberLinks.map((p) => p.name).join(' · ')
      const albumLabel = (album || '').trim()
      return albumLabel ? `${names} · ${albumLabel}` : names
    }
    return 'Vibration Fit'
  }

  const creatorId = parseMemberCreatorUserId(options?.tags)
  const assignedArtist = creatorId ? performerLinkForUserId(creatorId) : null
  const names = assignedArtist
    ? assignedArtist.name
    : MUSIC_CATALOG_PERFORMERS.map((p) => p.name).join(' · ')
  const albumLabel = (album || '').trim()
  return albumLabel ? `${names} · ${albumLabel}` : names
}
