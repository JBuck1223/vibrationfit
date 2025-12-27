# Binaural Metadata Schema

**Last Updated:** December 26, 2024  
**Migration:** `20251226000002_add_binaural_metadata_fields.sql`

## Overview

Enhanced the `audio_background_tracks` table with structured binaural metadata fields. Instead of parsing track names (`528hz-theta`), we now have dedicated columns for frequency, brainwave state, and beat frequency.

## New Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `is_binaural` | `boolean` | True if track contains binaural beats/Solfeggio | `true` |
| `frequency_hz` | `integer` | Base/carrier frequency in Hz | `528` |
| `brainwave_state` | `text` | Target brainwave state | `'theta'` |
| `binaural_beat_hz` | `numeric(4,1)` | Binaural beat difference frequency | `6.0` |

## Constraints

```sql
-- Frequency must be positive and reasonable
CHECK (frequency_hz IS NULL OR (frequency_hz > 0 AND frequency_hz <= 10000))

-- Brainwave state must be valid
CHECK (brainwave_state IS NULL OR brainwave_state IN ('delta', 'theta', 'alpha', 'beta', 'gamma'))

-- Binaural beat frequency must be in valid range
CHECK (binaural_beat_hz IS NULL OR (binaural_beat_hz >= 0.5 AND binaural_beat_hz <= 100))
```

## Indexes

```sql
-- Fast filtering for binaural tracks
CREATE INDEX idx_audio_background_tracks_binaural 
  ON public.audio_background_tracks(is_binaural) 
  WHERE is_binaural = true;

-- Fast filtering by frequency
CREATE INDEX idx_audio_background_tracks_frequency 
  ON public.audio_background_tracks(frequency_hz) 
  WHERE frequency_hz IS NOT NULL;

-- Fast filtering by brainwave state
CREATE INDEX idx_audio_background_tracks_brainwave 
  ON public.audio_background_tracks(brainwave_state) 
  WHERE brainwave_state IS NOT NULL;
```

## Benefits

### 1. **Structured Queries** 🔍

**Before (parsing strings):**
```typescript
// Bad: Have to parse names like "528hz-theta"
const tracks = await supabase
  .from('audio_background_tracks')
  .select('*')
  .like('name', '%theta%')  // 😬 Fragile string matching
```

**After (structured data):**
```typescript
// Good: Query by actual fields
const tracks = await supabase
  .from('audio_background_tracks')
  .select('*')
  .eq('is_binaural', true)
  .eq('brainwave_state', 'theta')
  .gte('frequency_hz', 400)
  .lte('frequency_hz', 600)  // ✅ Find Solfeggio frequencies in heart chakra range
```

### 2. **Advanced Filtering UI** 🎨

Now you can build:

**Frequency Range Slider:**
```typescript
// Find all tracks between 400-800 Hz
const healingFrequencies = await supabase
  .from('audio_background_tracks')
  .select('*')
  .eq('is_binaural', true)
  .gte('frequency_hz', 400)
  .lte('frequency_hz', 800)
```

**Brainwave State Tabs:**
```typescript
// Group by brainwave state
const byBrainwave = await supabase
  .from('audio_background_tracks')
  .select('brainwave_state, count(*)')
  .eq('is_binaural', true)
  .not('brainwave_state', 'is', null)
  .group('brainwave_state')
```

### 3. **Smart Recommendations** 🤖

```typescript
// Find similar tracks
async function findSimilar(trackId: string) {
  // Get the current track
  const { data: track } = await supabase
    .from('audio_background_tracks')
    .select('*')
    .eq('id', trackId)
    .single()
  
  // Find tracks with similar frequency (±50Hz) and same brainwave state
  const { data: similar } = await supabase
    .from('audio_background_tracks')
    .select('*')
    .eq('is_binaural', true)
    .eq('brainwave_state', track.brainwave_state)
    .gte('frequency_hz', track.frequency_hz - 50)
    .lte('frequency_hz', track.frequency_hz + 50)
    .neq('id', trackId)
    .limit(5)
  
  return similar
}
```

### 4. **Chakra Frequency Mapping** 🌈

```typescript
const CHAKRA_FREQUENCIES = {
  root: { min: 396, max: 396, color: 'red' },
  sacral: { min: 417, max: 417, color: 'orange' },
  solar: { min: 528, max: 528, color: 'yellow' },
  heart: { min: 639, max: 639, color: 'green' },
  throat: { min: 741, max: 741, color: 'blue' },
  third_eye: { min: 852, max: 852, color: 'indigo' },
  crown: { min: 963, max: 963, color: 'violet' }
}

// Get tracks for specific chakra
async function getChakraTracks(chakra: keyof typeof CHAKRA_FREQUENCIES) {
  const range = CHAKRA_FREQUENCIES[chakra]
  return await supabase
    .from('audio_background_tracks')
    .select('*')
    .eq('is_binaural', true)
    .eq('frequency_hz', range.min)  // Exact Solfeggio match
}
```

### 5. **Data Validation** ✅

The constraints ensure:
- No invalid frequencies (e.g., -100 Hz or 50000 Hz)
- Only valid brainwave states (no typos like "thet" or "alpah")
- Reasonable binaural beat frequencies (0.5-100 Hz range)

### 6. **Analytics & Insights** 📊

```sql
-- Most popular brainwave states
SELECT 
  brainwave_state,
  COUNT(*) as track_count,
  AVG(frequency_hz) as avg_frequency
FROM audio_background_tracks
WHERE is_binaural = true
GROUP BY brainwave_state
ORDER BY track_count DESC;

-- Frequency distribution
SELECT 
  FLOOR(frequency_hz / 100) * 100 as freq_range,
  COUNT(*) as count
FROM audio_background_tracks
WHERE is_binaural = true
GROUP BY FLOOR(frequency_hz / 100)
ORDER BY freq_range;
```

## Example Data

### Solfeggio + Theta Combination

```json
{
  "name": "528hz-theta",
  "display_name": "DNA Repair Theta",
  "category": "solfeggio",
  "file_url": "https://media.vibrationfit.com/site-assets/audio/mixing-tracks/solfeggio/binaural/528hz-theta.mp3",
  "description": "Love frequency, DNA repair, miracles with Deep meditation, creativity",
  "is_binaural": true,
  "frequency_hz": 528,
  "brainwave_state": "theta",
  "binaural_beat_hz": 6.0
}
```

### Pure Delta Binaural

```json
{
  "name": "binaural-delta",
  "display_name": "Delta Sleep",
  "category": "binaural",
  "file_url": "https://media.vibrationfit.com/site-assets/audio/mixing-tracks/binaural/delta-2hz.mp3",
  "description": "Pure delta wave binaural beat for deep sleep",
  "is_binaural": true,
  "frequency_hz": 200,
  "brainwave_state": "delta",
  "binaural_beat_hz": 2.0
}
```

### Non-Binaural Track

```json
{
  "name": "ocean-waves-1",
  "display_name": "Ocean Waves",
  "category": "nature",
  "file_url": "https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ocean-Waves-1.mp3",
  "description": "Gentle ocean waves lapping on shore",
  "is_binaural": false,
  "frequency_hz": null,
  "brainwave_state": null,
  "binaural_beat_hz": null
}
```

## Migration Notes

### Automatic Data Population

The migration automatically populates these fields for existing tracks by parsing the `name` field:

```sql
-- Parse: "528hz-theta" -> frequency_hz=528, brainwave_state='theta'
UPDATE audio_background_tracks
SET 
  is_binaural = true,
  frequency_hz = CAST(SUBSTRING(name FROM '^\d+') AS integer),
  brainwave_state = CASE
    WHEN name ~ '-delta$' THEN 'delta'
    WHEN name ~ '-theta$' THEN 'theta'
    -- ... etc
  END
WHERE category IN ('binaural', 'solfeggio');
```

### API Auto-Population

The generation API (`/api/audio/generate-tracks`) now automatically populates these fields when creating new tracks:

```typescript
await insertIntoDatabase({
  name: `528hz-theta`,
  display_name: `DNA Repair Theta`,
  category: 'solfeggio',
  file_url: s3Url,
  description: `...`,
  sort_order: 200,
  // Binaural metadata ✨
  is_binaural: true,
  frequency_hz: 528,
  brainwave_state: 'theta',
  binaural_beat_hz: 6.0
})
```

## Future Features Enabled

With these structured fields, you can now build:

### 1. **Smart Filters**
- Filter by frequency range (e.g., "Show me 400-600 Hz")
- Filter by brainwave state (e.g., "Only theta tracks")
- Combine filters (e.g., "Theta tracks with frequency > 500 Hz")

### 2. **Visualization**
- Frequency spectrum chart
- Brainwave state distribution pie chart
- Interactive frequency slider

### 3. **Recommendations**
- "Users who liked 528Hz-Theta also liked..."
- "Similar frequencies for heart chakra healing"
- "Progressive journey: Delta → Theta → Alpha"

### 4. **Advanced Mixing**
- "Mix 3 frequencies: 396Hz + 528Hz + 741Hz"
- "Create harmonic progressions"
- "Binaural beat modulation over time"

### 5. **User Preferences**
- Save favorite frequencies
- Create custom frequency playlists
- Track usage analytics by brainwave state

## Deployment Steps

1. **Run the migration:**
   ```sql
   -- In Supabase Dashboard → SQL Editor
   -- Run: 20251226000002_add_binaural_metadata_fields.sql
   ```

2. **Verify data:**
   ```sql
   SELECT 
     name, 
     is_binaural, 
     frequency_hz, 
     brainwave_state, 
     binaural_beat_hz 
   FROM audio_background_tracks 
   WHERE category IN ('binaural', 'solfeggio');
   ```

3. **Generate new tracks:**
   - Go to `/admin/audio-generator`
   - Generate tracks - they'll auto-populate the new fields

4. **Test queries:**
   ```typescript
   // Test the new filtering
   const thetaTracks = await supabase
     .from('audio_background_tracks')
     .select('*')
     .eq('is_binaural', true)
     .eq('brainwave_state', 'theta')
   ```

## See Also

- `THREE_TRACK_MIXING.md` - 3-track audio mixing system
- `SOLFEGGIO_BINAURAL_SYSTEM.md` - Solfeggio frequency details
- `FLEXIBLE_AUDIO_MIXING_SYSTEM.md` - Background track system

---

🎵 **Now your binaural data is fully structured and queryable!** 🧠✨

