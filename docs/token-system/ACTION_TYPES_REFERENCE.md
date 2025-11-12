# Action Types Reference

## Overview

Action types define what kind of AI operation was performed. They're used for:
- Token tracking and billing
- Usage analytics
- Admin reporting
- User history

## Definition Locations

### 1. TypeScript Interface (Source of Truth)
**File:** `src/lib/tokens/tracking.ts`  
**Line:** 12

```typescript
export interface TokenUsage {
  action_type: 'assessment_scoring' | 'vision_generation' | 'vision_refinement' | 
                'blueprint_generation' | 'chat_conversation' | 'audio_generation' | 
                'image_generation' | 'admin_grant' | 'admin_deduct' | 
                'life_vision_category_summary' | 'life_vision_master_assembly' | 
                'prompt_suggestions' | 'frequency_flip'
}
```

### 2. Database Constraint (Enforced at DB Level)
**File:** `supabase/migrations/20250131000001_update_token_usage_action_types.sql`  
**Constraint:** `token_usage_action_type_check`

⚠️ **Note:** The database constraint is missing `frequency_flip`. See migration `20250203000003_add_frequency_flip_action_type.sql` to fix.

## Complete Action Types List

| Action Type | Description | Typical Token Range | Used In |
|------------|-------------|-------------------|---------|
| `assessment_scoring` | AI scoring of assessment responses | 200-500 | `/api/assessment/ai-score` |
| `vision_generation` | Vision document generation | 1,000-3,000 | `/api/vision/generate`, `/api/vision/chat` |
| `vision_refinement` | Vision refinement operations | 20,000-100,000 | `/api/vibe-assistant/refine-vision`, `/api/viva/refine-category` |
| `blueprint_generation` | Actualization blueprint generation | 150,000-300,000 | `/api/vibe-assistant/generate-blueprint` |
| `chat_conversation` | VIVA chat interactions | 2,000-5,000 | `/api/viva/chat` |
| `audio_generation` | Text-to-speech and transcription | 1-100 (char-based) | `/lib/services/audioService.ts`, `/api/transcribe` |
| `image_generation` | DALL-E image generation | 25 (override) | `/lib/services/imageService.ts` |
| `admin_grant` | Admin token grants | Variable | `/api/admin/users/adjust-tokens` |
| `admin_deduct` | Admin token deductions | Variable | `/api/admin/users/adjust-tokens` |
| `life_vision_category_summary` | Category summaries | 20,000-50,000 | `/api/viva/category-summary`, `/api/viva/merge-clarity` |
| `life_vision_master_assembly` | Master vision assembly | 100,000-200,000 | `/api/viva/master-vision` |
| `prompt_suggestions` | Prompt suggestion generation | 1,000-2,000 | `/api/viva/prompt-suggestions` |
| `frequency_flip` | Frequency flipping operations | 500-2,000 | `/api/viva/flip-frequency` |

## Adding a New Action Type

### Step 1: Update TypeScript Interface

Edit `src/lib/tokens/tracking.ts`:

```typescript
export interface TokenUsage {
  // ... other fields
  action_type: 'existing_type' | 'new_action_type' | // ... other types
}
```

### Step 2: Update Database Constraint

Create a new migration file:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_new_action_type.sql

ALTER TABLE token_usage DROP CONSTRAINT IF EXISTS token_usage_action_type_check;

ALTER TABLE token_usage 
  ADD CONSTRAINT token_usage_action_type_check 
  CHECK (action_type IN (
    -- ... existing types ...
    'new_action_type'
  ));
```

### Step 3: Use in Code

When calling `trackTokenUsage()`:

```typescript
await trackTokenUsage({
  user_id: userId,
  action_type: 'new_action_type', // Use the new type
  model_used: 'gpt-4',
  tokens_used: totalTokens,
  // ... other fields
})
```

### Step 4: Update Documentation

- Update this file (`ACTION_TYPES_REFERENCE.md`)
- Update `TOKEN_TRACKING_AUDIT.md` if needed
- Update admin UI if action type needs special handling

## Current Mismatch Issue

⚠️ **Database constraint is missing `frequency_flip`**

**Status:** Fixed in migration `20250203000003_add_frequency_flip_action_type.sql`

**To apply:**
```bash
# Run the migration
supabase migration up
```

## Action Type Usage by Route

### VIVA Routes
- `/api/viva/chat` → `chat_conversation`
- `/api/viva/category-summary` → `life_vision_category_summary`
- `/api/viva/master-vision` → `life_vision_master_assembly`
- `/api/viva/prompt-suggestions` → `prompt_suggestions`
- `/api/viva/flip-frequency` → `frequency_flip`
- `/api/viva/merge-clarity` → `life_vision_category_summary`
- `/api/viva/refine-category` → `vision_refinement`

### Vision Routes
- `/api/vision/generate` → `vision_generation` (2 calls: main + theme detection)
- `/api/vision/chat` → `vision_generation` (4 calls: insight, patterns, pattern message, vision)

### Vibe Assistant Routes
- `/api/vibe-assistant/refine-vision` → `vision_refinement`
- `/api/vibe-assistant/generate-blueprint` → `blueprint_generation`

### Other Routes
- `/api/assessment/ai-score` → `assessment_scoring`
- `/api/transcribe` → `audio_generation`
- `/lib/services/audioService.ts` → `audio_generation`
- `/lib/services/imageService.ts` → `image_generation`
- `/api/admin/users/adjust-tokens` → `admin_grant` or `admin_deduct`

## Admin Overrides

Some action types have token overrides (for non-tokenized actions):

**Location:** `ai_action_token_overrides` table  
**Admin UI:** `/admin/ai-models`

**Action types with overrides:**
- `image_generation` - Default: 25 tokens
- `audio_generation` - Default: 1 token
- `transcription` - Default: 60 tokens (if added)

## Best Practices

1. **Always update both** TypeScript interface AND database constraint
2. **Use descriptive names** - action types should clearly indicate what they do
3. **Keep them consistent** - use snake_case for all action types
4. **Document new types** - add to this reference when creating new ones
5. **Test migrations** - verify constraint works before deploying

---

**Last Updated:** February 3, 2025  
**Total Action Types:** 13

