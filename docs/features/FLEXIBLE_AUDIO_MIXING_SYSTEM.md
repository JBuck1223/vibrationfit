# Flexible Audio Mixing System

**Last Updated:** December 23, 2024  
**Status:** Active

## Overview

The Flexible Audio Mixing System allows users to create custom audio mixes by choosing:
1. **Any background track** from a library of nature sounds, ambient music, and more
2. **Any mix ratio** from 10/90 to 90/10 (voice/background volume)

This replaces the old fixed variant system (sleep/meditation/energy) with a much more flexible approach.

## Architecture

### Database Tables

#### `background_tracks`
Stores available background audio tracks that can be mixed with voice recordings.

```sql
- id: uuid (primary key)
- name: text (internal identifier, e.g., 'ocean-waves-1')
- display_name: text (user-facing name, e.g., 'Ocean Waves')
- category: text (nature, ambient, music)
- file_url: text (full S3 URL)
- duration_seconds: integer
- description: text
- is_active: boolean
- sort_order: integer
- created_at, updated_at: timestamptz
```

**Seeded Tracks:**
- Ocean Waves (2 variants)
- Gentle Rain
- Forest Ambience
- White Noise
- Pink Noise
- Meditation Tones
- Binaural Alpha
- Calm Piano
- Uplifting Energy

#### `mix_ratios`
Stores preset mix ratios for voice/background volume levels.

```sql
- id: uuid (primary key)
- name: text (e.g., 'Voice Focused (80/20)')
- voice_volume: integer (0-100)
- bg_volume: integer (0-100)
- description: text
- is_active: boolean
- sort_order: integer
- icon: text (optional icon identifier)
- created_at, updated_at: timestamptz
- CONSTRAINT: voice_volume + bg_volume = 100
```

**Seeded Ratios:**
- Voice Only (100/0)
- Voice Dominant (90/10)
- Voice Focused (80/20)
- Voice Strong (70/30)
- Balanced (60/40)
- Even Mix (50/50)
- Background Strong (40/60)
- Background Focused (30/70)
- Music Focused (20/80)
- Music Dominant (10/90)

### User Flow

1. **Generate Voice-Only Track** (Step 1)
   - User selects a voice (OpenAI TTS or cloned voice)
   - System generates pure voice recordings for all vision sections
   - Stored in `audio_tracks` table with `variant = 'standard'`

2. **Create Custom Mix** (Step 2)
   - User selects an existing voice recording
   - User chooses a background track from the library
   - User selects a mix ratio (voice/background volume)
   - System creates mixed audio by combining voice + background

### API Endpoints

#### `POST /api/audio/generate-custom-mix`
Generates custom mixed audio tracks.

**Request:**
```json
{
  "visionId": "uuid",
  "sections": [{ "sectionKey": "forward", "text": "..." }],
  "voice": "alloy",
  "batchId": "uuid",
  "backgroundTrackUrl": "https://...",
  "voiceVolume": 70,
  "bgVolume": 30
}
```

**Process:**
1. Generates/reuses voice-only tracks
2. Triggers Lambda mixing for each track
3. Updates batch status

#### `POST /api/audio/mix-custom`
Mixes a single voice track with background audio.

**Request:**
```json
{
  "trackId": "uuid",
  "voiceUrl": "https://...",
  "backgroundTrackUrl": "https://...",
  "voiceVolume": 70,
  "bgVolume": 30,
  "outputKey": "s3-key-for-output.mp3"
}
```

**Process:**
1. Invokes AWS Lambda `audioMixerFunction`
2. Lambda uses FFmpeg to mix audio
3. Updates `audio_tracks.mixed_audio_url`

### UI Components

#### Background Track Selector
- Category filter (All, Nature, Ambient, Music)
- Grid of track cards with:
  - Display name
  - Description
  - Category badge
  - Selection indicator

#### Mix Ratio Selector
- Grid of ratio cards showing:
  - Ratio name
  - Voice/background percentages
  - Selection indicator

### Migration

**File:** `supabase/migrations/20251223161528_flexible_audio_mixing.sql`

**What it does:**
1. Creates `background_tracks` table
2. Creates `mix_ratios` table
3. Seeds 10 background tracks
4. Seeds 10 mix ratio presets
5. Sets up RLS policies (public read, admin write)

**To apply:**
```bash
cd /Users/jordanbuckingham/Desktop/vibrationfit
supabase db push
```

## Benefits

### Old System (Fixed Variants)
- ❌ Only 3 options: sleep, meditation, energy
- ❌ Fixed background track (Ocean Waves only)
- ❌ Fixed mix ratios per variant
- ❌ Required code changes to add new variants

### New System (Flexible Mixing)
- ✅ 10 background tracks (easily expandable)
- ✅ 10 mix ratios (easily expandable)
- ✅ 100 possible combinations (10 tracks × 10 ratios)
- ✅ Admin can add new tracks/ratios via database
- ✅ No code changes needed for new options

## Backwards Compatibility

The old `audio_variants` table is still supported for existing mixes. The UI shows both:
- **Old system:** Fixed variants (sleep/meditation/energy)
- **New system:** Custom track + ratio selection

Users can choose either approach.

## Adding New Tracks

To add a new background track:

1. Upload audio file to S3:
   ```
   s3://vibration-fit-client-storage/site-assets/audio/mixing-tracks/
   ```

2. Insert into database:
   ```sql
   INSERT INTO public.background_tracks 
     (name, display_name, category, file_url, description, sort_order)
   VALUES 
     ('new-track', 'New Track Name', 'nature', 
      'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/new-track.mp3',
      'Description of the track', 11);
   ```

3. Track appears immediately in UI (no deploy needed)

## Adding New Mix Ratios

To add a new mix ratio:

```sql
INSERT INTO public.mix_ratios 
  (name, voice_volume, bg_volume, description, sort_order)
VALUES 
  ('Custom Ratio (65/35)', 65, 35, 'Custom description', 11);
```

## Technical Notes

### Audio Mixing
- Mixing is done server-side via AWS Lambda
- Lambda uses FFmpeg to combine audio streams
- Voice and background volumes are controlled via `-filter_complex`
- Output is normalized to prevent clipping

### Storage
- Voice-only tracks: `audio_tracks.audio_url`
- Mixed tracks: `audio_tracks.mixed_audio_url`
- Both stored in S3: `s3://vibration-fit-client-storage/`

### Performance
- Voice generation: ~5-10 seconds per section
- Mixing: ~2-3 seconds per track
- Total time for 10 sections: ~2-3 minutes

## Future Enhancements

1. **Preview Background Tracks**
   - Add audio player to track selector
   - Let users hear tracks before selecting

2. **Custom Upload**
   - Allow users to upload their own background tracks
   - Store in user-specific S3 folder

3. **Saved Presets**
   - Let users save favorite track/ratio combinations
   - Quick access to "My Presets"

4. **Batch Generation**
   - Generate multiple mixes at once
   - E.g., "Generate all 10 ratios with Ocean Waves"

5. **Advanced Mixing**
   - Fade in/out controls
   - EQ adjustments
   - Reverb/effects

## Related Files

- Migration: `supabase/migrations/20251223161528_flexible_audio_mixing.sql`
- UI Page: `src/app/life-vision/[id]/audio/generate/page.tsx`
- API Routes:
  - `src/app/api/audio/generate-custom-mix/route.ts`
  - `src/app/api/audio/mix-custom/route.ts`
- Lambda Function: `lambda-video-processor/audioMixerFunction/`

## Support

For issues or questions:
1. Check Lambda logs in CloudWatch
2. Check Supabase logs for database errors
3. Check browser console for client-side errors
4. Verify S3 URLs are publicly accessible

