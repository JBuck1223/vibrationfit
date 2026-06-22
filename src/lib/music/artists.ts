export const OFFICIAL_ARTIST_ID = 'vibrationfit'

export interface MusicArtist {
  id: string
  name: string
  avatarUrl: string | null
  songCount: number
  isOfficial: boolean
}
