export const JORDAN_BUCKINGHAM_USER_ID = '2a0fc1a7-5b8a-46a4-97e4-d5c5ddefdf1a'
export const VANESSA_BUCKINGHAM_USER_ID = '30082787-6ae1-4413-9a32-293cc63e38ee'

/** @deprecated Official catalog songs are now assigned to member artists. */
export const OFFICIAL_ARTIST_ID = 'vibrationfit'

export interface MusicArtist {
  id: string
  name: string
  avatarUrl: string | null
  songCount: number
  isOfficial: boolean
}
