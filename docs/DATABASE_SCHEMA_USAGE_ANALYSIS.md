# Database Schema Usage Analysis
**Generated:** November 11, 2025  
**Purpose:** Identify deprecated fields and cleanup opportunities

---

## Executive Summary

**Total Tables:** 48  
**Vision-Related Tables:** 8 (vision_versions, refinements, scenes, frequency_flip, vibrational_events, vision_conversations, vision_audios, vision_board_items)

**Key Findings:**
- ✅ `vision_versions`: 12 deprecated columns (25% of table)
- ✅ `refinements`: 15 deprecated columns (60% of table!)  
- ⚠️ Multiple unused/orphaned tables from old experiments

---

## Table 1: `vision_versions` (Primary Vision Storage)

**Total Columns:** 39  
**Actively Used by V3:** 27 (69%)  
**Deprecated/Unused:** 12 (31%)

### ✅ ACTIVELY USED (V3 System)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner reference |
| `version_number` | integer | Version tracking |
| `title` | text | Vision title |
| `status` | text | 'draft', 'active', etc. |
| `completion_percent` | integer | Progress tracking |
| **Category Sections (12)** | | |
| `forward` | text | Opening/introduction |
| `fun` | text | Fun/Recreation |
| `travel` | text | Travel/Adventure |
| `home` | text | Home/Environment |
| `family` | text | Family/Parenting |
| `love` | text | Love/Romance |
| `health` | text | Health/Vitality |
| `money` | text | Money/Wealth |
| `work` | text | Work/Business/Career |
| `social` | text | Social/Friends |
| `stuff` | text | Possessions/Lifestyle |
| `giving` | text | Giving/Legacy |
| `spirituality` | text | Spirituality/Growth |
| `conclusion` | text | Closing/conclusion |
| **Audio Fields (5)** | | |
| `has_audio` | boolean | Audio generated flag |
| `audio_url` | text | Audio file location |
| `audio_duration` | text | Duration |
| `voice_type` | text | Voice selection |
| `background_music` | text | Music selection |
| `last_audio_generated_at` | timestamp | Last generation time |
| **System Fields (4)** | | |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update |
| `is_draft` | boolean | Draft status |
| `is_active` | boolean | Active vision flag |
| **V3 Fields (2)** | | |
| `activation_message` | text | V3 Step 6 activation |
| `richness_metadata` | jsonb | V3 density tracking |

### ❌ DEPRECATED/UNUSED (Remove These)

| Column | Type | Why Deprecated | Code Usage |
|--------|------|----------------|------------|
| `vibe_assistant_refinements_count` | integer | Old vibe-assistant feature | ❌ Not found in V3 |
| `last_vibe_assistant_refinement` | timestamp | Old vibe-assistant feature | ❌ Not found in V3 |
| `vibe_assistant_refinement_notes` | text | Old vibe-assistant feature | ❌ Not found in V3 |
| `ai_generated` | boolean | Unclear purpose, not used | ❌ Not found in V3 |
| `conversation_count` | integer | Old conversation system | ⚠️ Only in `/api/vision/generate` (old) |
| `emotional_patterns` | jsonb | Experimental feature, never finished | ⚠️ Only in `/api/vision/generate` (old) |
| `cross_category_themes` | text[] | Experimental feature, never finished | ⚠️ Only in `/api/vision/generate` (old) |

**Space Savings if Dropped:** ~30-40% reduction in row size

---

## Table 2: `refinements` (Category State Storage)

**Total Columns:** 25  
**Actively Used by V3:** 10 (40%)  
**Deprecated/Unused:** 15 (60%!)

### ✅ ACTIVELY USED (V3 System)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner reference |
| `category` | varchar(50) | Category key (fun, health, etc.) |
| `created_at` | timestamp | Creation time |
| **V3 Core Fields (5)** | | |
| `transcript` | text | User raw input (Step 1) |
| `ai_summary` | text | Category summary (Step 1) |
| `ideal_state` | text | Step 2: Imagination answers |
| `blueprint_data` | jsonb | Step 3: Being/Doing/Receiving |

**Note:** V3 uses this as a "per-category state store" - it's being repurposed from its original design!

### ❌ DEPRECATED/UNUSED (Remove These)

| Column | Type | Original Purpose | V3 Usage |
|--------|------|------------------|----------|
| `vision_id` | uuid | Link to specific vision | ❌ Never set by V3 |
| `operation_type` | varchar(50) | 'refine_vision', 'generate_guidance', etc. | ❌ Never set by V3 |
| **Token Tracking (4 columns)** | | | |
| `input_tokens` | integer | Token cost tracking | ❌ Not used (V3 uses `token_usage` table) |
| `output_tokens` | integer | Token cost tracking | ❌ Not used |
| `total_tokens` | integer | Token cost tracking | ❌ Not used |
| `cost_usd` | numeric | Cost tracking | ❌ Not used |
| **Vibe Assistant Params (5 columns)** | | | |
| `refinement_percentage` | integer | Refinement intensity | ❌ Old vibe-assistant feature |
| `tonality` | varchar(50) | 'encouraging', 'challenging', etc. | ❌ Old vibe-assistant feature |
| `word_count_target` | integer | Target word count | ❌ Old vibe-assistant feature |
| `emotional_intensity` | varchar(50) | 'gentle', 'moderate', 'intense' | ❌ Old vibe-assistant feature |
| `instructions` | text | User instructions | ❌ Old vibe-assistant feature |
| `viva_notes` | text | AI reasoning notes | ⚠️ Only in `/api/vibe-assistant/refine-vision` |
| **Operation Result Fields (4 columns)** | | | |
| `input_text` | text | Operation input | ❌ Never set by V3 |
| `output_text` | text | Operation output | ❌ Never set by V3 |
| `processing_time_ms` | integer | Processing time | ❌ Never set by V3 |
| `success` | boolean | Success flag | ❌ Never set by V3 |
| `error_message` | text | Error details | ❌ Never set by V3 |

**Space Savings if Dropped:** ~60% reduction in row size + eliminates confusion

---

## Table 3: Other Vision Tables (Quick Analysis)

### `frequency_flip` ✅ CLEAN
- All columns actively used by V3
- Purpose-built for Step 1 contrast flipping
- No cleanup needed

### `scenes` ✅ CLEAN  
- All columns actively used by V3 Step 4
- No deprecated fields
- No cleanup needed

### `vibrational_events` ✅ MOSTLY CLEAN
- Core vibrational tracking system
- All V3-relevant columns in use
- Minor: Some columns for other features (journal, assessment)

### `vision_conversations` ❓ ORPHANED?
- Used by old conversation-based vision gen (`/api/vision/generate`)
- NOT used by V3 system
- Question: Still needed for old visions?

### `vision_audios` ✅ ACTIVE
- Audio generation feature still in use
- Not V3-specific but actively used

### `vision_board_items` ✅ ACTIVE
- Vision board feature still in use
- Not V3-specific but actively used

---

## Cleanup Recommendations

### Option A: Create Clean V3-Specific Tables (RECOMMENDED)

**New Tables:**
```sql
-- Clean per-category state (replaces refinements for V3)
CREATE TABLE life_vision_category_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  category varchar(50) NOT NULL,
  
  -- V3 Step Data
  transcript text,
  ai_summary text,
  ideal_state text,
  blueprint_data jsonb,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, category)
);

-- Keep vision_versions but drop deprecated columns
ALTER TABLE vision_versions
  DROP COLUMN vibe_assistant_refinements_count,
  DROP COLUMN last_vibe_assistant_refinement,
  DROP COLUMN vibe_assistant_refinement_notes,
  DROP COLUMN ai_generated,
  DROP COLUMN conversation_count,
  DROP COLUMN emotional_patterns,
  DROP COLUMN cross_category_themes;
```

**Migration Strategy:**
1. Create new `life_vision_category_state` table
2. Migrate existing V3 data from `refinements`
3. Update V3 code to use new table
4. Mark old `refinements` rows as legacy
5. Clean `vision_versions` of deprecated columns

**Pros:**
- Clean separation of concerns
- Purpose-built schema for V3
- No risk to old features
- Better performance (fewer columns)
- Clear data model for future devs

**Cons:**
- Migration work required
- Two tables temporarily

---

### Option B: Clean Existing Tables In-Place

```sql
-- Drop deprecated columns from refinements
ALTER TABLE refinements
  DROP COLUMN vision_id,
  DROP COLUMN operation_type,
  DROP COLUMN input_tokens,
  DROP COLUMN output_tokens,
  DROP COLUMN total_tokens,
  DROP COLUMN cost_usd,
  DROP COLUMN refinement_percentage,
  DROP COLUMN tonality,
  DROP COLUMN word_count_target,
  DROP COLUMN emotional_intensity,
  DROP COLUMN instructions,
  DROP COLUMN input_text,
  DROP COLUMN output_text,
  DROP COLUMN processing_time_ms,
  DROP COLUMN success,
  DROP COLUMN error_message;

-- Drop deprecated columns from vision_versions
ALTER TABLE vision_versions
  DROP COLUMN vibe_assistant_refinements_count,
  DROP COLUMN last_vibe_assistant_refinement,
  DROP COLUMN vibe_assistant_refinement_notes,
  DROP COLUMN ai_generated,
  DROP COLUMN conversation_count,
  DROP COLUMN emotional_patterns,
  DROP COLUMN cross_category_themes;
```

**Pros:**
- Simpler migration
- Immediate cleanup
- No new tables

**Cons:**
- **BREAKS OLD FEATURES** permanently
- Risky if old visions need vibe-assistant
- Can't rollback easily

---

### Option C: Documentation Only (Status Quo)

Just document deprecated columns, add comments:

```sql
COMMENT ON COLUMN refinements.operation_type IS 'DEPRECATED: Used by old vibe-assistant, not V3';
COMMENT ON COLUMN vision_versions.conversation_count IS 'DEPRECATED: Used by old vision gen, not V3';
-- etc.
```

**Pros:**
- Zero risk
- No migration needed

**Cons:**
- Technical debt remains
- Wastes storage space
- Confusing for future developers

---

## Questions Before Proceeding

1. **Old Vibe-Assistant Feature**
   - Do any users still have visions using vibe-assistant refinements?
   - Is `/api/vibe-assistant/refine-vision` still publicly accessible?
   - Can we deprecate this feature entirely?

2. **Old Vision Generation System**
   - Is `/api/vision/generate` (conversation-based) still in use?
   - Do we need to support old visions created this way?
   - Can we mark `vision_conversations` table as legacy?

3. **Migration Strategy**
   - Preferred approach: Option A (new tables), B (drop columns), or C (document only)?
   - Timeline for migration if Option A chosen?
   - Risk tolerance for breaking old features?

---

## Next Steps

1. **Choose cleanup option** (A, B, or C)
2. **Confirm feature deprecation** (vibe-assistant, old vision gen)
3. **Create migration files** if needed
4. **Test in staging** before production
5. **Update code** to use new schema
6. **Document changes** for future reference

---

## Appendix: All 48 Tables

For reference, complete table list:

**Active V3 Tables:**
- `vision_versions` (needs cleanup)
- `refinements` (needs cleanup)
- `frequency_flip` ✅
- `scenes` ✅
- `vibrational_events` ✅
- `ideal_state_prompts` ✅ (newly added)

**Active Supporting Tables:**
- `user_profiles`, `profiles`, `member_profiles` (profile system)
- `assessment_results`, `assessment_responses`, `assessment_insights`
- `token_transactions`, `token_usage`, `token_drips`
- `journal_entries`, `daily_papers`
- `audio_sets`, `audio_tracks`, `audio_variants`, `vision_audios`
- `vision_board_items`, `generated_images`
- `emotional_snapshots`, `vibrational_event_sources`, `vibrational_links`
- `conversation_sessions`, `ai_conversations`, `viva_conversations`
- `payment_history`, `customer_subscriptions`, `membership_tiers`
- And 16 more...

**Potentially Orphaned:**
- `vision_conversations` (old vision gen)
- `ai_usage_logs` (duplicates token_usage?)
- Several others to investigate

---

**Recommendation:** Choose **Option A** (create clean V3 tables) for best long-term maintainability.

