# Songwriter

**Last Updated:** May 19, 2026  
**Status:** Final Spec  
**Location in App:** Audio Studio > Create > Songwriter (`/audio/songwriter`)

---

## The Product

One screen. Three inputs. Create a song.

---

## The Screen

### 1. Song Idea

Large text area.

Prompt: **"What's this song about?"**

Example chips underneath:
- Chasing dreams
- Missing someone
- Feeling alive again
- Freedom
- Parenthood
- Falling in love
- Healing
- Letting go
- Road trips
- Starting over

Optional secondary field: "Add a few details or imagery"

---

### 2. Lyrics

Two options side by side:

**Option A:** Button — "Write My Song"  
VIVA generates lyrics from the Song Idea. Streams in real-time. User can edit after.

**Option B:** Paste area  
User pastes their own lyrics (from anywhere — ChatGPT, handwritten, whatever).

---

### 3. Reference Track

Paste a YouTube URL.

```
Paste YouTube URL
    ↓
Waveform auto-loads
    ↓
User drags a 30-second window over the section they want
    ↓
Preview the clip
    ↓
"Use As Reference"
```

This replaces dropdown genre/style pickers. Musicians think in SOUND, not categories.

---

### Generate

One button: **"Create My Track"**

---

## Results

- Version A / Version B (2 track variants)
- Play / Pause
- Heart to favorite
- Download stems (ZIP)
- "Generate More" for additional versions
- Done.

---

## The Secret Sauce

VIVA works invisibly. User types a simple idea like:

> "A song about wanting to feel alive again after losing myself in routine."

VIVA internally extracts:
- Emotional arc (starting emotion → destination)
- Core message
- Imagery and sensory language
- Lyrical pacing and intensity
- Spiritual undertones (underneath, never on top)

The user does ZERO emotional paperwork. That's AI work, not user work.

The Emotional Songwriting Framework still powers everything — it just runs under the hood instead of being exposed as a form.

---

## Under the Hood

```
Song Idea (user types)
    ↓
VIVA extracts emotional core + writes lyrics (or user pastes their own)
    ↓
YouTube reference → extract audio → user picks 30s → upload to Mureka
    ↓
Lyrics + reference_id → Mureka API
    ↓
Poll every 5s (~45 second wait)
    ↓
Download MP3s + cover art from Mureka → upload to S3
    ↓
Show results (2 variants)
```

---

## API Routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/songs/generate-lyrics` | VIVA writes lyrics from Song Idea |
| POST | `/api/songs/generate-music` | Sends lyrics + reference_id to Mureka |
| GET | `/api/songs/poll/[taskId]` | Polls Mureka, saves tracks to S3 |
| POST | `/api/songs/[id]/favorite` | Toggle favorite on a track |
| POST | `/api/songs/[id]/stems` | Get stems ZIP, save to S3 |
| POST | `/api/songs/upload-reference` | Upload 30s clip to Mureka |
| POST | `/api/songs/extract-youtube` | Extract audio from YouTube URL |

---

## Dependencies

- **Mureka API** — music generation, stems, reference upload (~$0.045/song, ~$0.06/stems)
- **YouTube audio extraction** — server-side (yt-dlp or equivalent)
- **Waveform UI** — wavesurfer.js or similar for the 30s scrubber
- **AWS S3** — permanent storage for all generated audio
- **OpenAI / AI Gateway** — VIVA lyrics generation

---

## Build Order

1. One-screen form (Song Idea + Lyrics + Generate) — works without reference track
2. YouTube URL → waveform → 30s scrubber → Mureka reference upload
3. Results page (player, favorite, stems, generate more)
