export const SONG_PUBLISHING_AGREEMENT_VERSION = '2.0'

export function hasAcceptedSongPublishingAgreement(account: {
  song_publishing_agreement_accepted_at?: string | null
  song_publishing_agreement_version?: string | null
} | null | undefined): boolean {
  if (!account?.song_publishing_agreement_accepted_at) return false
  return account.song_publishing_agreement_version === SONG_PUBLISHING_AGREEMENT_VERSION
}
