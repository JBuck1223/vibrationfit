# Binaural Track Query Examples

**Last Updated:** December 26, 2024

## Track Type Detection

Since there's no `is_binaural` boolean, you determine track type by checking which fields are populated:

| Fields Set | Track Type | Example |
|------------|------------|---------|
| `frequency_hz` + `brainwave_state` | Solfeggio + Binaural | 528Hz Theta |
| Only `frequency_hz` | Pure Solfeggio | 528Hz Tone |
| Only `brainwave_state` | Pure Binaural | Theta Binaural |
| Neither | Regular Track | Ocean Waves |

## Query Examples

### 1. Get All Binaural-Related Tracks

```typescript
// Any track with frequency OR brainwave state
const { data } = await supabase
  .from('audio_background_tracks')
  .select('*')
  .or('frequency_hz.not.is.null,brainwave_state.not.is.null')
  .eq('is_active', true)
```

### 2. Get Solfeggio + Binaural Combos Only

```typescript
// Both fields must be set
const { data } = await supabase
  .from('audio_background_tracks')
  .select('*')
  .not('frequency_hz', 'is', null)
  .not('brainwave_state', 'is', null)
  .eq('is_active', true)
```

### 3. Get Pure Solfeggio Tones

```typescript
// Has frequency but NO brainwave state
const { data } = await supabase
  .from('audio_background_tracks')
  .select('*')
  .not('frequency_hz', 'is', null)
  .is('brainwave_state', null)
  .eq('is_active', true)
```

### 4. Get Pure Binaural Beats

```typescript
// Has brainwave state but NO frequency
const { data } = await supabase
  .from('audio_background_tracks')
  .select('*')
  .is('frequency_hz', null)
  .not('brainwave_state', 'is', null)
  .eq('is_active', true)
```

### 5. Get Regular Background Tracks

```typescript
// Neither field is set
const { data } = await supabase
  .from('audio_background_tracks')
  .select('*')
  .is('frequency_hz', null)
  .is('brainwave_state', null)
  .eq('is_active', true)
```

### 6. Filter by Specific Brainwave State

```typescript
// All Theta tracks (pure binaural OR Solfeggio+Theta combos)
const { data } = await supabase
  .from('audio_background_tracks')
  .select('*')
  .eq('brainwave_state', 'theta')
  .eq('is_active', true)
```

### 7. Filter by Frequency Range

```typescript
// Heart chakra frequencies (400-700 Hz)
const { data } = await supabase
  .from('audio_background_tracks')
  .select('*')
  .gte('frequency_hz', 400)
  .lte('frequency_hz', 700)
  .eq('is_active', true)
```

### 8. Filter by Both

```typescript
// All Solfeggio frequencies with Theta state
const { data } = await supabase
  .from('audio_background_tracks')
  .select('*')
  .not('frequency_hz', 'is', null)
  .eq('brainwave_state', 'theta')
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
  brainwave_state?: string
  binaural_beat_hz?: number
  // ... other fields
}

// Determine track type
function getTrackType(track: AudioTrack): 'solfeggio-binaural' | 'solfeggio' | 'binaural' | 'regular' {
  if (track.frequency_hz && track.brainwave_state) {
    return 'solfeggio-binaural'
  }
  if (track.frequency_hz) {
    return 'solfeggio'
  }
  if (track.brainwave_state) {
    return 'binaural'
  }
  return 'regular'
}

// Check if track is binaural-related
function isBinauralRelated(track: AudioTrack): boolean {
  return !!(track.frequency_hz || track.brainwave_state)
}

// Get track icon based on type
function getTrackIcon(track: AudioTrack): string {
  const type = getTrackType(track)
  switch (type) {
    case 'solfeggio-binaural': return '🧠✨' // Both
    case 'solfeggio': return '✨' // Frequency only
    case 'binaural': return '🧠' // Brainwave only
    case 'regular': return '🎵' // Neither
  }
}

// Get track description
function getTrackDescription(track: AudioTrack): string {
  const type = getTrackType(track)
  switch (type) {
    case 'solfeggio-binaural':
      return `${track.frequency_hz}Hz Solfeggio + ${track.brainwave_state} binaural`
    case 'solfeggio':
      return `${track.frequency_hz}Hz Solfeggio frequency`
    case 'binaural':
      return `${track.brainwave_state} binaural beat (${track.binaural_beat_hz}Hz)`
    case 'regular':
      return track.description || 'Background track'
  }
}
```

## React Component Example

```tsx
export function TrackCard({ track }: { track: AudioTrack }) {
  const type = getTrackType(track)
  const isBinaural = isBinauralRelated(track)
  
  return (
    <Card>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{getTrackIcon(track)}</span>
        <div>
          <h3>{track.display_name}</h3>
          <p className="text-sm text-neutral-400">
            {getTrackDescription(track)}
          </p>
        </div>
      </div>
      
      {/* Show metadata badges */}
      <div className="flex gap-2 mt-2">
        {track.frequency_hz && (
          <Badge variant="outline">{track.frequency_hz} Hz</Badge>
        )}
        {track.brainwave_state && (
          <Badge variant="outline" className="capitalize">
            {track.brainwave_state}
          </Badge>
        )}
      </div>
    </Card>
  )
}
```

## SQL View (Optional)

You can create a view to make queries easier:

```sql
CREATE VIEW audio_tracks_with_type AS
SELECT 
  *,
  CASE
    WHEN frequency_hz IS NOT NULL AND brainwave_state IS NOT NULL THEN 'solfeggio-binaural'
    WHEN frequency_hz IS NOT NULL THEN 'solfeggio'
    WHEN brainwave_state IS NOT NULL THEN 'binaural'
    ELSE 'regular'
  END as track_type,
  (frequency_hz IS NOT NULL OR brainwave_state IS NOT NULL) as is_binaural_related
FROM audio_background_tracks;
```

Then query the view:

```typescript
// Get all binaural-related tracks using the view
const { data } = await supabase
  .from('audio_tracks_with_type')
  .select('*')
  .eq('is_binaural_related', true)
```

## Benefits of This Approach

### ✅ Cleaner Schema
- No redundant boolean field
- Metadata fields are self-documenting
- Easy to understand: has frequency? has brainwave? both?

### ✅ Flexible Queries
- Can filter by presence of either field
- Can filter by specific values (e.g., only theta)
- Can combine filters easily

### ✅ Future-Proof
- Can add more brainwave states without schema changes
- Can add frequency ranges or other metadata
- No need to maintain boolean consistency

### ✅ Type Safety
- TypeScript can check for field presence
- Helper functions centralize logic
- Easy to test and maintain

---

**Summary:** Use `frequency_hz` and `brainwave_state` presence to determine track type. This is simpler, more flexible, and more maintainable than a boolean flag!

