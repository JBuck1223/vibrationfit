# Binaural Numeric Schema

**Last Updated:** December 26, 2024  
**Status:** ✅ Active

## Overview

All binaural/Solfeggio metadata is stored as **numeric values only** for maximum flexibility and queryability. This allows for range queries, custom frequencies, and future experimentation.

## Schema (2 Fields)

```sql
frequency_hz    integer         -- Base/carrier frequency (e.g., 528)
brainwave_hz    numeric(5,2)    -- Brainwave entrainment frequency (e.g., 6.0)
```

## Track Types

| Fields Set | Type | Example | Use Case |
|------------|------|---------|----------|
| **Both** | Solfeggio + Binaural | `528Hz` + `6.0Hz` | DNA Repair + Theta meditation |
| **Only frequency** | Pure Solfeggio | `528Hz` only | Pure healing tone |
| **Only brainwave** | Pure Binaural | `6.0Hz` only | Pure theta brainwave entrainment |
| **Neither** | Regular Track | `null` + `null` | Ocean waves, rain, music |

## Brainwave Frequency Ranges

| State | Frequency Range | Standard Value | Description |
|-------|----------------|----------------|-------------|
| **Delta** | 0.5 - 4 Hz | 2.0 Hz | Deep sleep, healing |
| **Theta** | 4 - 8 Hz | 6.0 Hz | Deep meditation, creativity |
| **Alpha** | 8 - 13 Hz | 10.0 Hz | Relaxed focus, learning |
| **Beta** | 13 - 30 Hz | 15.0 Hz | Alert focus, concentration |
| **Gamma** | 30 - 100 Hz | 40.0 Hz | Peak awareness, cognition |

### Future Flexibility

With numeric values, you can now create:
- **Delta Low:** 1.0 Hz
- **Delta High:** 3.5 Hz
- **Theta Low:** 4.5 Hz
- **Theta Mid:** 6.0 Hz
- **Theta High:** 7.5 Hz
- **Delta-Theta Transition:** 3.0 Hz
- **Alpha-Beta Transition:** 12.5 Hz
- **Custom:** ANY value you want to experiment with!

## Solfeggio Frequencies

| Frequency | Chakra | Purpose |
|-----------|--------|---------|
| 174 Hz | Root | Pain relief, grounding |
| 285 Hz | Sacral | Tissue healing, cellular repair |
| 396 Hz | Root | Liberation from fear/guilt |
| 417 Hz | Sacral | Facilitate change |
| 528 Hz | Solar Plexus | DNA repair, love frequency |
| 639 Hz | Heart | Connection, relationships |
| 741 Hz | Throat | Awakening, intuition |
| 852 Hz | Third Eye | Spiritual order |
| 963 Hz | Crown | Divine connection |

## Example Data

### Solfeggio + Theta Combo

```json
{
  "name": "528hz-theta",
  "display_name": "DNA Repair Theta",
  "category": "solfeggio",
  "frequency_hz": 528,
  "brainwave_hz": 6.0,
  "description": "528Hz Solfeggio with 6Hz theta binaural beat"
}
```

### Pure Solfeggio Tone

```json
{
  "name": "528hz-pure",
  "display_name": "DNA Repair Pure",
  "category": "solfeggio",
  "frequency_hz": 528,
  "brainwave_hz": null,
  "description": "Pure 528Hz Solfeggio frequency"
}
```

### Pure Theta Binaural

```json
{
  "name": "theta-6hz",
  "display_name": "Theta 6Hz",
  "category": "binaural",
  "frequency_hz": null,
  "brainwave_hz": 6.0,
  "description": "Pure 6Hz theta binaural beat"
}
```

### Regular Background Track

```json
{
  "name": "ocean-waves-1",
  "display_name": "Ocean Waves",
  "category": "nature",
  "frequency_hz": null,
  "brainwave_hz": null,
  "description": "Gentle ocean waves"
}
```

## Query Examples

### Get all tracks with Theta range (4-8 Hz)

```typescript
const { data } = await supabase
  .from('audio_background_tracks')
  .select('*')
  .gte('brainwave_hz', 4.0)
  .lte('brainwave_hz', 8.0)
  .eq('is_active', true)
```

### Get heart chakra frequencies (500-700 Hz)

```typescript
const { data } = await supabase
  .from('audio_background_tracks')
  .select('*')
  .gte('frequency_hz', 500)
  .lte('frequency_hz', 700)
  .eq('is_active', true)
```

### Get Solfeggio + Binaural combos only

```typescript
const { data } = await supabase
  .from('audio_background_tracks')
  .select('*')
  .not('frequency_hz', 'is', null)
  .not('brainwave_hz', 'is', null)
  .eq('is_active', true)
```

### Get tracks by exact frequency

```typescript
const { data } = await supabase
  .from('audio_background_tracks')
  .select('*')
  .eq('frequency_hz', 528)
  .eq('is_active', true)
```

### Get low-frequency brainwave tracks (< 4 Hz delta)

```typescript
const { data } = await supabase
  .from('audio_background_tracks')
  .select('*')
  .lt('brainwave_hz', 4.0)
  .eq('is_active', true)
```

## TypeScript Helper Functions

```typescript
interface AudioTrack {
  id: string
  name: string
  display_name: string
  category: string
  frequency_hz?: number
  brainwave_hz?: number
}

// Get brainwave state name from Hz
function getBrainwaveState(hz: number): string {
  if (hz < 4) return 'delta'
  if (hz < 8) return 'theta'
  if (hz < 13) return 'alpha'
  if (hz < 30) return 'beta'
  return 'gamma'
}

// Get track type
function getTrackType(track: AudioTrack): 'combo' | 'solfeggio' | 'binaural' | 'regular' {
  if (track.frequency_hz && track.brainwave_hz) return 'combo'
  if (track.frequency_hz) return 'solfeggio'
  if (track.brainwave_hz) return 'binaural'
  return 'regular'
}

// Get track description
function getTrackDescription(track: AudioTrack): string {
  const type = getTrackType(track)
  
  switch (type) {
    case 'combo':
      const state = getBrainwaveState(track.brainwave_hz!)
      return `${track.frequency_hz}Hz + ${track.brainwave_hz}Hz ${state}`
    case 'solfeggio':
      return `${track.frequency_hz}Hz Solfeggio`
    case 'binaural':
      const stateName = getBrainwaveState(track.brainwave_hz!)
      return `${track.brainwave_hz}Hz ${stateName} binaural`
    default:
      return track.description || 'Background track'
  }
}

// Find tracks in brainwave range
async function getTracksByBrainwaveRange(
  minHz: number, 
  maxHz: number
): Promise<AudioTrack[]> {
  const { data } = await supabase
    .from('audio_background_tracks')
    .select('*')
    .gte('brainwave_hz', minHz)
    .lte('brainwave_hz', maxHz)
    .eq('is_active', true)
    .order('brainwave_hz', { ascending: true })
  
  return data || []
}

// Find tracks in frequency range
async function getTracksByFrequencyRange(
  minHz: number,
  maxHz: number
): Promise<AudioTrack[]> {
  const { data } = await supabase
    .from('audio_background_tracks')
    .select('*')
    .gte('frequency_hz', minHz)
    .lte('frequency_hz', maxHz)
    .eq('is_active', true)
    .order('frequency_hz', { ascending: true })
  
  return data || []
}
```

## Benefits

### ✅ Range Queries
```typescript
// Get all variations of theta (4-8 Hz)
.gte('brainwave_hz', 4.0).lte('brainwave_hz', 8.0)

// Get heart chakra range (500-700 Hz)
.gte('frequency_hz', 500).lte('frequency_hz', 700)
```

### ✅ Custom Frequencies
- Create theta variations: 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5 Hz
- Create transition frequencies: 3.5 Hz (delta-theta), 12.5 Hz (alpha-beta)
- Experiment with uncommon frequencies

### ✅ Sorting & Analytics
```sql
-- Average brainwave frequency by category
SELECT category, AVG(brainwave_hz)
FROM audio_background_tracks
WHERE brainwave_hz IS NOT NULL
GROUP BY category;

-- Distribution of frequencies
SELECT FLOOR(frequency_hz / 100) * 100 as range, COUNT(*)
FROM audio_background_tracks
WHERE frequency_hz IS NOT NULL
GROUP BY range
ORDER BY range;
```

### ✅ Future-Proof
- No schema changes needed for new brainwave states
- Can add any frequency value
- Easy to create progressive journeys (e.g., 10Hz → 8Hz → 6Hz → 4Hz)

## Constraints

```sql
-- Frequency must be positive and reasonable
CHECK (frequency_hz IS NULL OR (frequency_hz > 0 AND frequency_hz <= 10000))

-- Brainwave frequency must be in entrainment range
CHECK (brainwave_hz IS NULL OR (brainwave_hz >= 0.5 AND brainwave_hz <= 100))
```

## Migration Notes

### Run This Migration

Since you already ran the first migration with text fields, run this cleanup:

```sql
-- supabase/migrations/20251226000003_remove_is_binaural_column.sql
ALTER TABLE public.audio_background_tracks
DROP COLUMN IF EXISTS is_binaural,
DROP COLUMN IF EXISTS brainwave_state,
DROP COLUMN IF EXISTS binaural_beat_hz;
```

Then your schema will be clean with just:
- ✅ `frequency_hz` (integer)
- ✅ `brainwave_hz` (numeric)

## Future Possibilities

### Progressive Journeys
```typescript
// Create a sleep journey: 10Hz → 8Hz → 6Hz → 4Hz → 2Hz
const journey = [
  { name: 'alpha-start', brainwave_hz: 10.0 },
  { name: 'alpha-theta-transition', brainwave_hz: 8.0 },
  { name: 'theta-mid', brainwave_hz: 6.0 },
  { name: 'theta-delta-transition', brainwave_hz: 4.0 },
  { name: 'delta-deep', brainwave_hz: 2.0 }
]
```

### Frequency Sliders
```tsx
// UI slider for brainwave frequency
<RangeSlider
  min={0.5}
  max={40}
  value={brainwaveHz}
  onChange={setBrainwaveHz}
  marks={{
    2: 'Delta',
    6: 'Theta',
    10: 'Alpha',
    15: 'Beta',
    40: 'Gamma'
  }}
/>
```

### Binaural Beat Ramps
```typescript
// Start at 10Hz, ramp down to 2Hz over 20 minutes
const rampDuration = 20 * 60 // seconds
const startHz = 10.0
const endHz = 2.0
const steps = 12 // Generate 12 tracks

for (let i = 0; i <= steps; i++) {
  const progress = i / steps
  const currentHz = startHz - (startHz - endHz) * progress
  // Generate track at currentHz...
}
```

---

**Summary:** Numeric values give you infinite flexibility for experimentation, range queries, and progressive journeys! 🎵✨

