/**
 * Original Music Rights attestation for member-uploaded songs.
 *
 * Members may only upload music they created themselves and hold full rights
 * to. The exact statements they agree to live here so the client renders them
 * and the API records which version was accepted (song_tracks.rights_attestation_version).
 */

export const ORIGINAL_MUSIC_RIGHTS_VERSION = '1.0'

export const ORIGINAL_MUSIC_RIGHTS_STATEMENTS: readonly string[] = [
  'This song is my own original work. I wrote, performed, or produced it myself (or with collaborators who have given me permission to share it here).',
  'I own or control all rights to the recording, composition, and lyrics. It contains no samples, beats, melodies, or lyrics owned by anyone else, and it was not made with a service whose terms forbid sharing it here.',
  'I give Vibration Fit permission to stream this song to members inside the app and to show my name as the artist. I can remove it from my library at any time.',
  'I understand that uploading music I do not have full rights to may result in the song being removed and my upload access being revoked.',
] as const

/** Server-side allowlist for uploaded song content types (mirrors the songUploads storage rule). */
export const ORIGINAL_MUSIC_CONTENT_TYPES: readonly string[] = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave',
  'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/flac', 'audio/x-flac', 'audio/ogg',
] as const

export const ORIGINAL_MUSIC_MAX_BYTES = 200 * 1024 * 1024

/** File picker accept string for the upload input. */
export const ORIGINAL_MUSIC_ACCEPT = '.mp3,.wav,.m4a,.aac,.flac,.ogg,audio/*'

/** Uploaded song files must live under the member's own songs/uploads folder on the CDN. */
export function isMemberSongUploadUrl(url: string, userId: string): boolean {
  return url.startsWith(`https://media.vibrationfit.com/user-uploads/${userId}/songs/uploads/`)
}
