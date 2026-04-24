# Global playlist audio (design system)

**Last updated:** April 23, 2026  
**Status:** Active

## What this is

The app-wide audio experience: embedded playlist, persistent bottom mini bar, and full-screen drawer, wired to `global-audio-store`. Components live under `src/lib/design-system/components/media/global-audio/` and are re-exported from `@/lib/design-system/components` with the other media components.

| Component | Role |
|-----------|------|
| `EmbeddedPlayer` | In-page full player for a set |
| `InlineTrackList` | Compact list + header affordances |
| `PersistentMiniPlayer` | Fixed bottom bar + seek strip |
| `AudioDrawerPlayer` | Full “now playing” drawer |
| `GlobalAudioPlayerShell` | Root layout shell (drawer + mini) |
| `TrackArtwork` | Artwork or category icon |

## vs single-track `AudioPlayer`

`AudioPlayer` in `media/AudioPlayer.tsx` is a **single-track, in-place** control with local progress storage. It is **not** the global shell. For playlist UX, import the global suite above, not the legacy `AudioPlayer`.
