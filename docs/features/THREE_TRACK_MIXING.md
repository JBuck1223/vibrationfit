# Three-Track Audio Mixing System

**Last Updated:** December 26, 2024  
**Status:** ✅ Active

## Overview

The VibrationFit audio system now supports **3-track mixing**: Voice + Background + Binaural Enhancement. Users can add optional binaural beats or Solfeggio frequencies to any audio mix for enhanced brainwave entrainment effects.

## How It Works

### 🎵 Three Audio Layers

1. **Voice** - User's life vision narration (generated via ElevenLabs)
2. **Background** - Nature sounds, ambient, or music (ocean waves, rain, etc.)
3. **Binaural** (Optional) - Binaural beats or Solfeggio frequencies for brainwave entrainment

### 🧠 Binaural Enhancement

When a user selects a binaural track, the Lambda mixer combines all three layers:

```
Voice (60%) + Ocean Waves (25%) + Theta Binaural (15%) = Final Mix
```

**Use Cases:**
- Voice + Ocean + Theta → Deep meditation
- Voice + Rain + Delta → Sleep enhancement
- Voice + White Noise + Alpha → Focused learning
- Voice + Forest + 528Hz Solfeggio → Healing frequency

## Architecture

### 1. Frontend Selection (`/life-vision/[id]/audio/generate`)

**Step 1:** Select base voice (voice-only tracks)  
**Step 2:** Select background track (nature, ambient, music)  
**Step 3:** Select mix ratio (90/10, 80/20, 50/50, etc.)  
**Step 4 (Optional):** Select binaural enhancement + volume slider

```typescript
// State management
const [selectedBinauralTrack, setSelectedBinauralTrack] = useState<string>('')
const [binauralVolume, setBinauralVolume] = useState<number>(15) // 5-30%

// Load binaural tracks
const { data: binauralData } = await supabase
  .from('audio_background_tracks')
  .select('*')
  .eq('is_active', true)
  .in('category', ['binaural', 'solfeggio'])
```

### 2. API Flow

```
Frontend → /api/audio/generate-custom-mix
  ├─→ Generate voice-only tracks (if needed)
  ├─→ For each section:
  │    └─→ /api/audio/mix-custom
  │         └─→ AWS Lambda (audio-mixer)
  │              ├─ Download voice
  │              ├─ Download background
  │              ├─ Download binaural (if selected)
  │              ├─ Mix with FFmpeg (2 or 3 tracks)
  │              ├─ Upload to S3
  │              └─ Update Supabase
  └─→ Update batch status
```

### 3. Lambda Mixer (`audio-mixer`)

**Updated Function:** Supports optional 3rd track

```javascript
// Parameters
{
  voiceUrl,           // Required
  bgUrl,              // Required
  binauralUrl,        // Optional ✨ NEW
  voiceVolume,        // Decimal (0.6 = 60%)
  bgVolume,           // Decimal (0.25 = 25%)
  binauralVolume,     // Decimal (0.15 = 15%) ✨ NEW
  outputKey,
  trackId
}

// FFmpeg 3-track mix
ffmpeg -i voice.mp3 -i bg.mp3 -i binaural.mp3 \
  -filter_complex "[0:a]volume=0.6[a0]; \
                   [1:a]volume=0.25,aloop=loop=-1:size=2e+09[a1]; \
                   [2:a]volume=0.15,aloop=loop=-1:size=2e+09[a2]; \
                   [a0][a1][a2]amix=inputs=3:duration=first" \
  -codec:a libmp3lame -b:a 192k output.mp3
```

**Backwards Compatible:** If `binauralUrl` is not provided, it uses the 2-track mix (voice + background only).

## Database Schema

### `audio_background_tracks` Table

```sql
-- Binaural tracks are stored here with category='binaural' or 'solfeggio'
id                uuid PRIMARY KEY
name              text UNIQUE          -- e.g., "528hz-theta"
display_name      text                 -- e.g., "DNA Repair Theta"
category          text                 -- 'binaural' or 'solfeggio'
file_url          text                 -- S3 URL
description       text
is_active         boolean
sort_order        integer
```

**Filtering:**
- **Background tracks:** `category NOT IN ('binaural', 'solfeggio')`
- **Binaural tracks:** `category IN ('binaural', 'solfeggio')`

### `audio_generation_batches` Metadata

```json
{
  "custom_mix": true,
  "background_track_id": "uuid",
  "background_track_url": "https://...",
  "mix_ratio_id": "uuid",
  "voice_volume": 60,
  "bg_volume": 40,
  
  // Optional binaural enhancement ✨ NEW
  "binaural_track_id": "uuid",
  "binaural_track_url": "https://...",
  "binaural_volume": 15
}
```

## UI Components

### Binaural Selection Card

```tsx
<Card variant="default" hover>
  <div className="text-center py-2">
    <p className="text-white font-medium text-sm">{track.display_name}</p>
    <p className="text-xs text-neutral-400 mt-1">{track.description}</p>
    {isSelected && <CheckCircle className="text-purple-500" />}
  </div>
</Card>
```

### Volume Slider

```tsx
<input
  type="range"
  min="5"
  max="30"
  value={binauralVolume}
  onChange={(e) => setBinauralVolume(parseInt(e.target.value))}
  className="w-full accent-purple-500"
/>
<div className="flex justify-between text-xs text-neutral-400">
  <span>Subtle (5%)</span>
  <span>Balanced (15%)</span>
  <span>Strong (30%)</span>
</div>
```

## Deployment

### Step 1: Run Database Migration

```sql
-- Add unique constraint for upsert operations
ALTER TABLE public.audio_background_tracks
ADD CONSTRAINT audio_background_tracks_name_unique UNIQUE (name);
```

Run in Supabase Dashboard → SQL Editor

### Step 2: Generate Binaural Tracks

Go to `/admin/audio-generator` and generate:
- **Solfeggio Binaural Combinations** (e.g., 528Hz + Theta, 639Hz + Alpha)
- **Or basic binaural beats** (Delta, Theta, Alpha, Beta, Gamma)

Tracks are automatically:
1. Generated with FFmpeg
2. Uploaded to S3 (`site-assets/audio/mixing-tracks/solfeggio/binaural/`)
3. Inserted into `audio_background_tracks` table

### Step 3: Deploy Updated Lambda Function

```bash
cd docs/jordan/audio-mixer-1a7d17f2-ebcc-4e1b-8dae-934f921b684d

# Test locally (optional)
node index.js

# Deploy to AWS Lambda
zip -r function.zip index.js node_modules/
aws lambda update-function-code \
  --function-name audio-mixer \
  --zip-file fileb://function.zip
```

**Lambda updates:**
- Accepts optional `binauralUrl` and `binauralVolume` parameters
- Uses 3-track FFmpeg mix when binaural is provided
- Falls back to 2-track mix when binaural is omitted

### Step 4: Test the System

1. Go to `/life-vision/[id]/audio/generate`
2. Generate voice-only tracks (Step 1)
3. Select a background track (Step 2)
4. Select a mix ratio (Step 3)
5. **Select a binaural track** (Step 4 - Optional)
6. Adjust binaural volume (5-30%)
7. Click "Generate Custom Mix"
8. Check `/life-vision/[id]/audio/queue/[batchId]` for progress

## Binaural Track Examples

### Solfeggio Frequencies

| Frequency | Purpose | Example Combinations |
|-----------|---------|---------------------|
| 174 Hz | Pain Relief | 174hz-delta, 174hz-theta |
| 285 Hz | Tissue Healing | 285hz-delta, 285hz-theta |
| 396 Hz | Liberation | 396hz-theta, 396hz-alpha |
| 417 Hz | Change | 417hz-theta, 417hz-alpha |
| 528 Hz | DNA Repair | 528hz-theta, 528hz-alpha |
| 639 Hz | Connection | 639hz-alpha, 639hz-beta |
| 741 Hz | Awakening | 741hz-alpha, 741hz-beta |
| 852 Hz | Spiritual Order | 852hz-theta, 852hz-alpha |
| 963 Hz | Divine Connection | 963hz-theta, 963hz-alpha |

### Brainwave States

| State | Frequency Range | Effect | Volume Recommendation |
|-------|----------------|--------|----------------------|
| Delta | 0.5-4 Hz | Deep sleep, healing | 10-15% |
| Theta | 4-8 Hz | Meditation, creativity | 15-20% |
| Alpha | 8-13 Hz | Relaxed focus, learning | 15-20% |
| Beta | 13-18 Hz | Alert focus, thinking | 10-15% |

## User Experience

### Default State
- Binaural section hidden if no tracks available
- "None" selected by default
- Volume slider hidden until a track is selected

### When Binaural Selected
- Purple highlight on selected track
- Volume slider appears (default 15%)
- Range: 5% (subtle) to 30% (strong)
- Real-time volume adjustment

### Generation Feedback
- Shows all 3 layers in generation log
- Progress updates: "Voice (60%) + Background (25%) + Binaural (15%)"
- Final mix URL includes all 3 layers

## Technical Notes

### FFmpeg Volume Mixing

The Lambda uses `amix` with normalized volumes:
- Voice + Background + Binaural should not exceed 100%
- Default safe levels: 60% + 25% + 15% = 100%
- Higher binaural (20-30%) works better for pure Solfeggio without background

### File Naming Convention

**Binaural files:**
- Format: `{frequency}hz-{brainwave}.mp3`
- Examples: `528hz-theta.mp3`, `639hz-alpha.mp3`

**Database names:**
- Format: `{frequency}hz-{brainwave}`
- Examples: `528hz-theta`, `639hz-alpha`

### S3 Storage

```
site-assets/audio/mixing-tracks/
├── binaural/              # Basic binaural beats
├── solfeggio/
│   └── binaural/         # Solfeggio + binaural combinations
└── [other categories]/
```

## Future Enhancements

### 1. Preset Combinations
Create "recommended combos" with pre-selected binaural tracks:
- "Deep Sleep Bundle" → Delta binaural + Ocean waves
- "Meditation Package" → Theta binaural + Forest sounds
- "Focus Mode" → Alpha binaural + White noise

### 2. Dynamic Volume Adjustments
Allow users to adjust all 3 volumes independently:
- Voice: 40-80%
- Background: 10-40%
- Binaural: 5-30%

### 3. Journey Tracks
Time-based binaural progressions that evolve during playback:
- Sleep Journey: Alpha → Theta → Delta over 20 minutes
- Meditation Journey: Beta → Alpha → Theta over 15 minutes

### 4. Binaural Visualization
Show frequency wave patterns in UI to help users understand the effect.

## Testing Checklist

- [x] Frontend loads binaural tracks from database
- [x] UI shows optional binaural selection
- [x] Volume slider works (5-30%)
- [x] "None" option deselects binaural
- [x] Generate without binaural (2-track mix) works
- [x] Generate with binaural (3-track mix) works
- [x] Lambda receives correct parameters
- [x] FFmpeg 3-track mixing produces quality output
- [x] Files upload to S3 correctly
- [x] Database records include binaural metadata
- [x] Queue page shows binaural info in track details

## Support

**Issues:**
- Check Lambda logs: AWS CloudWatch → `/aws/lambda/audio-mixer`
- Check API logs: Vercel deployment logs
- Verify FFmpeg in Lambda Layer: `/opt/ffmpeg-layer/bin/ffmpeg`

**Questions:**
- See `SOLFEGGIO_BINAURAL_SYSTEM.md` for frequency details
- See `FLEXIBLE_AUDIO_MIXING_SYSTEM.md` for 2-track mixing
- See `LAMBDA_MIXER_COMPATIBILITY.md` for Lambda setup

---

🎵 **Now users can create powerful brainwave-enhanced life vision audio!** 🧠✨

