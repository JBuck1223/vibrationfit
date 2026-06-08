export interface MusicCatalogPerformer {
  name: string
  snapshotId: string
}

/** Vibration Fit Music catalog performers (links to /snapshot/[id]). */
export const MUSIC_CATALOG_PERFORMERS: readonly MusicCatalogPerformer[] = [
  { name: 'Vanessa Buckingham', snapshotId: '30082787-6ae1-4413-9a32-293cc63e38ee' },
  { name: 'Jordan Buckingham', snapshotId: '2a0fc1a7-5b8a-46a4-97e4-d5c5ddefdf1a' },
] as const

export const CINDY_BUCKINGHAM: MusicCatalogPerformer = {
  name: 'Cindy Buckingham',
  snapshotId: '898e008f-d3d5-4f05-947b-138f6c8b92ba',
}

/** Track-specific performer credits (default: Vanessa + Jordan). */
const TRACK_PERFORMER_OVERRIDES: Record<string, readonly MusicCatalogPerformer[]> = {
  // Music the Powerful Soul-ution
  '29982d18-6d11-43ca-ac99-c4a274c99af4': [
    ...MUSIC_CATALOG_PERFORMERS,
    CINDY_BUCKINGHAM,
  ],
}

function performersForTrack(trackId: string) {
  return TRACK_PERFORMER_OVERRIDES[trackId] ?? MUSIC_CATALOG_PERFORMERS
}

export function musicCatalogPerformerLinks(trackId?: string) {
  const performers = trackId ? performersForTrack(trackId) : MUSIC_CATALOG_PERFORMERS
  return performers.map((p) => ({
    name: p.name,
    snapshotHref: `/snapshot/${p.snapshotId}`,
  }))
}

export function musicCatalogArtistFallback(trackId?: string, album?: string | null) {
  const performers = trackId ? performersForTrack(trackId) : MUSIC_CATALOG_PERFORMERS
  const names = performers.map((p) => p.name).join(' · ')
  const albumLabel = (album || '').trim()
  return albumLabel ? `${names} · ${albumLabel}` : names
}
