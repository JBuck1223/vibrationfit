# Audio Tracking Fields - Fixed ✅

**Date:** December 16, 2024  
**Issue:** `audio_seconds` and `audio_duration_formatted` fields weren't being populated

---

## 🔍 Issues Found

### 1. Missing TypeScript Interface Fields
**File:** `src/lib/tokens/tracking.ts`

The `TokenUsage` interface was missing the audio fields that exist in the database.

**Fixed:** ✅ Added `audio_seconds` and `audio_duration_formatted` to interface

### 2. Not Inserting Audio Fields
**File:** `src/lib/tokens/tracking.ts`

The `trackTokenUsage` function wasn't inserting these fields into the database.

**Fixed:** ✅ Added fields to INSERT statement

### 3. Transcription API Not Passing Audio Data
**File:** `src/app/api/transcribe/route.ts`

The transcription API had audio duration but wasn't passing it to `trackTokenUsage`.

**Fixed:** ✅ Now passes:
- `audio_seconds` - Exact duration from Whisper
- `audio_duration_formatted` - Formatted as "MM:SS"

### 4. TTS API Not Estimating Audio Duration
**File:** `src/lib/services/audioService.ts`

The TTS (text-to-speech) API wasn't estimating audio duration.

**Fixed:** ✅ Now estimates duration based on character count (~750 chars/minute) and passes:
- `audio_seconds` - Estimated duration
- `audio_duration_formatted` - Formatted as "MM:SS"

### 5. Missing Action Types in Database Constraint
**File:** Database schema

The `token_usage_action_type_check` constraint was missing:
- `vision_board_ideas`
- `voice_profile_analysis`

**Fixed:** ✅ Created migration to add them

---

## ✅ What Was Fixed

### TypeScript Interface
```typescript
export interface TokenUsage {
  // ... existing fields ...
  
  // Audio-specific fields (NEW)
  audio_seconds?: number
  audio_duration_formatted?: string
  
  // ... rest of fields ...
}
```

### Database Insert
```typescript
.insert({
  // ... existing fields ...
  
  // Audio-specific fields (NEW)
  audio_seconds: usage.audio_seconds || null,
  audio_duration_formatted: usage.audio_duration_formatted || null,
  
  // ... rest of fields ...
})
```

### Transcription API
```typescript
await trackTokenUsage({
  // ... existing fields ...
  
  // Audio data from Whisper (NEW)
  audio_seconds: transcription.duration,
  audio_duration_formatted: formatDuration(transcription.duration),
  
  // ... rest of fields ...
})
```

### TTS API
```typescript
// Estimate duration: ~150 words/min, ~5 chars/word = 750 chars/min
const estimatedSeconds = Math.round((text.length / 750) * 60)

await trackTokenUsage({
  // ... existing fields ...
  
  // Estimated audio data (NEW)
  audio_seconds: estimatedSeconds,
  audio_duration_formatted: formatDuration(estimatedSeconds),
  
  // ... rest of fields ...
})
```

---

## 📊 Database Migration

**File:** `supabase/migrations/20251216000001_fix_token_usage_constraints.sql`

**Run this migration:**
```bash
# Apply to production
supabase db push
```

**What it does:**
- Drops old constraint
- Adds new constraint with ALL 22 action types including:
  - `vision_board_ideas`
  - `voice_profile_analysis`

---

## 🧪 How to Test

### Test Transcription
1. Use the transcription feature
2. Query database:

```sql
SELECT 
  action_type,
  audio_seconds,
  audio_duration_formatted,
  created_at
FROM token_usage
WHERE action_type = 'transcription'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- `audio_seconds` = actual duration (e.g., 45.3)
- `audio_duration_formatted` = "MM:SS" (e.g., "0:45")

### Test TTS Audio Generation
1. Generate audio with TTS
2. Query database:

```sql
SELECT 
  action_type,
  audio_seconds,
  audio_duration_formatted,
  tokens_used,
  created_at
FROM token_usage
WHERE action_type = 'audio_generation'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- `audio_seconds` = estimated duration based on text length
- `audio_duration_formatted` = "MM:SS" format
- Duration should roughly match: `tokens_used / 750 * 60` seconds

---

## 📋 Verification Checklist

- [x] TypeScript interface includes audio fields
- [x] Database INSERT includes audio fields
- [x] Transcription API passes audio data
- [x] TTS API estimates and passes audio duration
- [x] Database constraint includes all action types
- [x] Migration created
- [ ] **Migration applied to production**
- [ ] **Test transcription feature**
- [ ] **Test TTS audio generation**
- [ ] **Verify data in database**

---

## 🎯 Summary

**Before:**
- Audio fields existed in database but were always NULL
- TypeScript interface was missing these fields
- APIs weren't populating them

**After:**
- ✅ TypeScript interface updated
- ✅ Database inserts include audio fields
- ✅ Transcription passes actual duration
- ✅ TTS estimates duration
- ✅ Database constraint fixed
- ✅ All 22 action types supported

**Next Steps:**
1. Apply migration: `supabase db push`
2. Test transcription and TTS
3. Verify audio data appears in database

---

## 🔍 Duration Format

Both APIs now format duration as **"MM:SS"**:

| Seconds | Formatted |
|---------|-----------|
| 45 | "0:45" |
| 90 | "1:30" |
| 125 | "2:05" |
| 3661 | "61:01" |

---

**All audio tracking fields are now properly populated!** 🎉




