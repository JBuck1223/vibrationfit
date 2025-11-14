# Audio Transcription Cost Tracking

**Last Updated:** November 15, 2025

## 🎯 Overview

This guide shows how to properly track costs for audio transcription using Whisper, which charges per second of audio rather than per token.

---

## 📊 Database Fields

### New Fields in `token_usage`

```sql
ALTER TABLE token_usage ADD COLUMN:
- audio_seconds numeric(10,2)           -- Duration in seconds (e.g., 123.45)
- audio_duration_formatted text         -- Human-readable (e.g., "2m 3s")
```

---

## 💰 Pricing

### Whisper-1 Pricing (as of Nov 2024)

```sql
SELECT * FROM ai_model_pricing WHERE model_name = 'whisper-1';
```

| Model | Price | Unit |
|-------|-------|------|
| whisper-1 | $0.006 | per second |

**Example:**
- 2 minute audio = 120 seconds
- Cost = 120 × $0.006 = $0.72

---

## 🔧 How To Track Audio Transcription

### TypeScript Example

```typescript
import { trackTokenUsage } from '@/lib/tokens/tracking'

// After Whisper transcription
const audioFile = await fetch('audio.mp3')
const audioBuffer = await audioFile.arrayBuffer()

// Get audio duration (in seconds)
const audioDuration = getAudioDuration(audioBuffer) // e.g., 123.45 seconds

// Transcribe with Whisper
const transcript = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-1'
})

// Track usage with audio_seconds
await trackTokenUsage({
  userId: user.id,
  action_type: 'transcription',
  model_used: 'whisper-1',
  audio_seconds: audioDuration,  // ✅ NEW: Audio duration
  success: true,
  metadata: {
    file_name: 'audio.mp3',
    transcript_length: transcript.text.length
  }
})
```

### Direct Supabase RPC Call

```typescript
const { error } = await supabase.rpc('apply_token_usage', {
  p_user_id: userId,
  p_action_type: 'transcription',
  p_model_used: 'whisper-1',
  p_tokens_used: 0,              // Not applicable for audio
  p_input_tokens: 0,             // Not applicable for audio
  p_output_tokens: 0,            // Not applicable for audio
  p_cost_estimate_cents: 0,      // Let it calculate
  p_metadata: {},
  p_audio_seconds: 123.45        // ✅ Audio duration in seconds
})

// Backend automatically:
// 1. Looks up Whisper pricing: $0.006/second
// 2. Calculates: 123.45 × $0.006 = $0.74 = 74 cents
// 3. Formats duration: "2m 3s"
// 4. Stores all in token_usage table
```

---

## 📈 Querying Audio Costs

### Total Audio Transcription Costs

```sql
SELECT 
  COUNT(*) as transcription_count,
  SUM(audio_seconds) as total_seconds,
  ROUND(SUM(audio_seconds) / 60.0, 2) as total_minutes,
  SUM(calculated_cost_cents) / 100.0 as total_cost_usd,
  AVG(calculated_cost_cents) / 100.0 as avg_cost_per_file
FROM token_usage
WHERE action_type = 'transcription'
  AND audio_seconds IS NOT NULL
  AND calculated_cost_cents IS NOT NULL;
```

### Audio vs Text Costs

```sql
SELECT 
  CASE
    WHEN audio_seconds IS NOT NULL THEN 'Audio (Whisper)'
    WHEN input_tokens > 0 THEN 'Text (GPT)'
    ELSE 'Other'
  END as usage_category,
  COUNT(*) as requests,
  SUM(calculated_cost_cents) / 100.0 as total_cost_usd
FROM token_usage
WHERE calculated_cost_cents IS NOT NULL
GROUP BY usage_category
ORDER BY total_cost_usd DESC;
```

### Recent Audio Transcriptions

```sql
SELECT 
  audio_duration_formatted as duration,
  audio_seconds,
  calculated_cost_cents / 100.0 as cost_usd,
  metadata->>'file_name' as file_name,
  created_at
FROM token_usage
WHERE action_type = 'transcription'
  AND audio_seconds IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Using the Analysis View

```sql
SELECT 
  audio_duration_formatted,
  accurate_cost_usd,
  usage_type,
  created_at
FROM token_usage_with_costs
WHERE usage_type = 'audio'
ORDER BY created_at DESC;
```

---

## 🎨 Admin Dashboard Display

### Example Stats Card

```typescript
// Fetch audio transcription stats
const { data: audioStats } = await supabase
  .from('token_usage')
  .select('audio_seconds, calculated_cost_cents')
  .eq('action_type', 'transcription')
  .not('audio_seconds', 'is', null)

const totalMinutes = audioStats?.reduce((sum, r) => sum + (r.audio_seconds || 0), 0) / 60
const totalCost = audioStats?.reduce((sum, r) => sum + (r.calculated_cost_cents || 0), 0) / 100

// Display
<Card>
  <h3>Audio Transcriptions</h3>
  <div>
    <span>{audioStats?.length || 0} files</span>
    <span>{totalMinutes.toFixed(1)} minutes</span>
    <span>${totalCost.toFixed(2)}</span>
  </div>
</Card>
```

---

## 🔄 Helper Function: Get Audio Duration

### Client-Side (Browser)

```typescript
export async function getAudioDuration(audioBuffer: ArrayBuffer): Promise<number> {
  const audioContext = new AudioContext()
  const audioBufferData = await audioContext.decodeAudioData(audioBuffer)
  return audioBufferData.duration // Returns seconds (e.g., 123.45)
}
```

### Server-Side (Node.js)

```typescript
import { getAudioDurationInSeconds } from 'get-audio-duration'

export async function getAudioDuration(filePath: string): Promise<number> {
  const duration = await getAudioDurationInSeconds(filePath)
  return duration
}
```

---

## ✅ Complete Transcription Example

```typescript
import { createClient } from '@/lib/supabase/server'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import { getAudioDuration } from '@/lib/audio/utils'
import OpenAI from 'openai'

export async function transcribeAudio(
  userId: string,
  audioFile: File
) {
  const openai = new OpenAI()
  const supabase = await createClient()
  
  try {
    // 1. Get audio duration
    const audioBuffer = await audioFile.arrayBuffer()
    const audioDuration = await getAudioDuration(audioBuffer)
    
    // 2. Transcribe with Whisper
    const transcript = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en'
    })
    
    // 3. Track usage with accurate cost
    await trackTokenUsage({
      userId,
      action_type: 'transcription',
      model_used: 'whisper-1',
      audio_seconds: audioDuration,
      success: true,
      metadata: {
        file_name: audioFile.name,
        file_size_bytes: audioFile.size,
        transcript_length: transcript.text.length,
        language: 'en'
      }
    })
    
    return {
      text: transcript.text,
      duration: audioDuration,
      cost: audioDuration * 0.006 // $0.006/second
    }
    
  } catch (error) {
    // Track failed attempt
    await trackTokenUsage({
      userId,
      action_type: 'transcription',
      model_used: 'whisper-1',
      audio_seconds: 0,
      success: false,
      metadata: { error: error.message }
    })
    
    throw error
  }
}
```

---

## 📊 Cost Calculation Logic

### SQL Function

The `calculate_ai_cost()` function handles audio pricing:

```sql
-- For audio models (Whisper)
IF v_unit_price IS NOT NULL AND p_units IS NOT NULL THEN
  v_total_cost := v_unit_price * p_units
  -- Example: $0.006 × 120 seconds = $0.72
END IF

-- Return cost in cents
RETURN ROUND(v_total_cost * 100)
-- Example: $0.72 × 100 = 72 cents
```

---

## 🎯 Summary

| Feature | Status |
|---------|--------|
| **Audio Duration Tracking** | ✅ `audio_seconds` field |
| **Human-Readable Format** | ✅ `audio_duration_formatted` (e.g., "2m 30s") |
| **Accurate Cost Calculation** | ✅ Via `ai_model_pricing` table |
| **Cost Per Second** | ✅ $0.006 for Whisper-1 |
| **Automatic Formatting** | ✅ Duration auto-formatted in DB |
| **Analysis View** | ✅ `token_usage_with_costs` includes audio |

---

## 📚 Related Files

- Migration: `supabase/migrations/20251115000001_integrate_cost_tracking.sql`
- Pricing Table: `supabase/migrations/20251115000000_create_ai_model_pricing.sql`
- Cost Guide: `docs/AI_COST_TRACKING_GUIDE.md`
- Integration: `docs/AI_COST_INTEGRATION_SUMMARY.md`

---

**Now you can accurately track both text (GPT) and audio (Whisper) costs!** 🎯

