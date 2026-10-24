# Member Music Uploads

**Last Updated:** October 24, 2026
**Status:** In Progress (migration pending)

Also in this change: the app-shell Audio menus now list **Music** and label the member's songs **My Songs** (`src/lib/app-shell/sections.ts`, `src/lib/navigation/menu-definitions.ts`).
**Location in App:** Audio Studio > Create > Songwriter > Custom > "Upload My Own Song" (`/audio/songwriter`)

---

## What it does

Members can upload a song they made themselves and share it with the community. The song lands in their Member Library, so it appears under their artist name in Browse Artists on `/audio/music` and in their own Songs tab. Only original music is allowed: the member must attest they hold full rights before the upload button enables.

## Flow

1. In Songwriter, with the **Custom** source selected, the member switches from **Create with VIVA** to **Upload My Own Song**. The VIVA steps are replaced by the upload card.
2. `UploadOriginalSong` (`src/components/audio-studio/`) collects the audio file, a title (prefilled from the filename), and the rights attestation checkbox. The attestation statements are rendered from `ORIGINAL_MUSIC_RIGHTS_STATEMENTS`.
3. The browser uploads the file straight to S3 with the existing presigned flow (`uploadUserFile('songUploads', ...)`), into `user-uploads/<userId>/songs/uploads/`. Duration is read client-side from the file's metadata.
4. `POST /api/songs/upload` validates the CDN URL is in the member's own upload folder, the attestation flag and version match, then inserts a `songs` row (`source = 'member_upload'`, `status = 'completed'`) and a `song_tracks` row (`in_member_library = true`, `rights_attested_at`, `rights_attestation_version`).
5. On success the member is sent to My Songs with the new song open (`/audio/songs?open=song:<id>`). It appears under their name in Music > Browse Artists on the next load.

## Rights attestation

Source of truth: `src/lib/songs/upload-rights.ts`. Bump `ORIGINAL_MUSIC_RIGHTS_VERSION` when the wording changes; the API rejects uploads whose `rights_version` does not match, and the accepted version is stored per track for audit.

The attestation is separate from the Song Publishing Agreement (which assigns VIVA tracks to Vibration Fit). Uploaded originals stay the member's property; they grant in-app streaming and artist credit only. Streaming-platform publishing of uploaded originals is not offered.

## Database

Migration `supabase/migrations/20261024120000_member_music_uploads.sql`:

- `songs.source` check constraint now allows `member_upload`.
- `song_tracks.rights_attested_at timestamptz`, `song_tracks.rights_attestation_version text`.

## Limits

- Formats: MP3, WAV, M4A, AAC, FLAC, OGG (`songUploads` rule in `s3-storage-presigned.ts` and `ORIGINAL_MUSIC_CONTENT_TYPES`).
- Size: 200MB.

## Removing a track

Members manage uploaded songs like any other song in their Songs tab (library toggle, delete). Admins can remove an upload the same way they handle any member-library track.
