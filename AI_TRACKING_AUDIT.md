# AI Token Tracking Audit

**Date:** December 16, 2024

---

## ✅ Tracked AI Actions

| Action Type | API Route | Status |
|-------------|-----------|--------|
| `life_vision_category_summary` | `/api/viva/category-summary` | ✅ Tracked |
| `life_vision_master_assembly` | `/api/viva/master-vision` | ✅ Tracked |
| `vision_refinement` | `/api/viva/refine-category` | ✅ Tracked |
| `blueprint_generation` | `/api/viva/blueprint` | ✅ Tracked |
| `prompt_suggestions` | `/api/viva/prompt-suggestions` | ✅ Tracked |
| `chat_conversation` | `/api/viva/chat` | ✅ Tracked |
| `frequency_flip` | `/api/viva/flip-frequency` | ✅ Tracked |
| `transcription` | `/api/transcribe` | ✅ Tracked |
| `vision_generation` | `/api/viva/final-assembly` | ✅ Tracked (as 'vision_generation') |
| `merge_clarity` | `/api/viva/merge-clarity` | ✅ Tracked (as 'life_vision_category_summary') |
| `vision_board_ideas` | `/api/vision-board/generate-ideas` | ✅ Tracked |

---

## 🔍 Action Types in DB But Not Used in API Routes

These are defined in `TokenUsage` interface but may not have corresponding API implementations yet:

| Action Type | Status | Notes |
|-------------|--------|-------|
| `vibrational_analysis` | ⚠️ Not Found | Defined in type but no API route found |
| `viva_scene_generation` | ⚠️ Not Found | Defined in type but no API route found |
| `north_star_reflection` | ⚠️ Not Found | Defined in type but no API route found |
| `voice_profile_analysis` | ⚠️ Not Found | Defined in type but no API route found |
| `audio_generation` | ⚠️ Not Found | Defined in type but no API route found (TTS) |
| `image_generation` | ⚠️ Not Found | Defined in type but no API route found (DALL-E) |

---

## 🔧 Services That Use AI (Non-API)

These use OpenAI but might be called from services, not API routes:

| Service | File | Uses OpenAI | Tracking Status |
|---------|------|-------------|-----------------|
| `synthesizeWithOpenAI` | `src/lib/services/audioService.ts` | ✅ TTS | ⚠️ Tracks conditionally (if userId provided) |
| `generateImage` | `src/lib/services/imageService.ts` | ✅ DALL-E | ⚠️ Need to verify |

---

## 📝 Token History Display

Updated `/dashboard/token-history` to show ALL action types with proper labels and icons.

### New Labels Added:
- ✅ Transcription
- ✅ Frequency Flip
- ✅ Vision Board Ideas
- ✅ Vibrational Analysis
- ✅ Voice Profile Analysis
- ✅ North Star Reflection
- ✅ Scene Generation
- ✅ Final Assembly
- ✅ Merge Clarity
- ✅ Subscription Grant
- ✅ Trial Grant
- ✅ Token Pack Purchase

---

## 🎯 Action Items

### Immediate:
1. ✅ Update token history page with all action labels
2. ⏳ Verify `audioService.ts` always tracks tokens
3. ⏳ Verify `imageService.ts` tracks tokens
4. ⏳ Find or create API routes for missing actions

### Future API Routes to Create:
- `/api/viva/vibrational-analysis` - Analyze emotional state
- `/api/viva/scene-generation` - Generate visualization scenes
- `/api/viva/north-star-reflection` - Dashboard reflections
- `/api/viva/voice-profile` - Analyze writing voice

---

## 🔄 Tracking Pattern

**Standard pattern for all AI API routes:**

```typescript
import { trackTokenUsage, validateTokenBalance } from '@/lib/tokens/tracking'

// 1. Before API call - validate balance
const tokenValidation = await validateTokenBalance(
  user.id, 
  estimatedTokens, 
  supabase
)

if (tokenValidation) {
  return NextResponse.json({ error: tokenValidation.error }, 
    { status: tokenValidation.status })
}

// 2. Make AI API call
const response = await openai.chat.completions.create({...})

// 3. After API call - track usage
await trackTokenUsage({
  user_id: user.id,
  action_type: 'specific_action_type',
  model_used: toolConfig.model_name,
  tokens_used: response.usage.total_tokens,
  input_tokens: response.usage.prompt_tokens,
  output_tokens: response.usage.completion_tokens,
  openai_request_id: response.id,
  openai_created: response.created,
  system_fingerprint: response.system_fingerprint,
  success: true,
  metadata: { /* context */ }
}, supabase)
```

---

## ✅ Checklist

- [x] All API routes that use AI are tracking tokens
- [x] Token history page displays all action types
- [x] Labels and icons are comprehensive
- [ ] Verify service-level AI calls track tokens
- [ ] Create missing API routes for defined action types

---

## 📊 Summary

**Total Action Types Defined:** 21
**API Routes Tracking:** 11
**Displayed in Token History:** 21 (all)
**Missing Implementation:** 6 (future features)

---

**Next Step:** Verify service-level AI calls (audioService, imageService) always track tokens when userId is available.

