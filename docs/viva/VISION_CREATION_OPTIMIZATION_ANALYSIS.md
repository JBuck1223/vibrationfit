# Life Vision Creation Flow - Optimization Analysis

**Last Updated:** November 16, 2024

## Current State: `/life-vision/new`

### The Good News ✅

The vision creation flow is **already optimized** compared to `/viva` chat!

**Key differences:**

1. **Data is passed from frontend** (not fetched every API call)
2. **Caching exists** (prompt suggestions cached in database)
3. **No massive system prompts** (simpler, focused prompts per category)
4. **Uses flattened data** (via `prompt-flatteners.ts`)

---

## Vision Creation API Routes Analysis

### 1. Category Summary Route
**File:** `src/app/api/viva/category-summary/route.ts`

**What it loads:**
```typescript
// ✅ Loads once per category (not per message)
const profile = await supabase.from('user_profiles').select('*')...
const assessment = await supabase.from('assessment_results').select('*')...
```

**Context size:**
- Profile: ~200 tokens
- Assessment: ~500 tokens  
- Transcript: ~200-1000 tokens (user's voice input)
- **Total: ~900-1700 tokens**

**Optimization: ✅ Already Good**
- Only loads profile/assessment **once per category**
- Uses category-specific fields (via `getCategoryProfileFields()`)
- Doesn't load full vision document
- Doesn't load journey state

---

### 2. Prompt Suggestions Route
**File:** `src/app/api/viva/prompt-suggestions/route.ts`

**What it loads:**
```typescript
// ⚠️ Profile and assessment passed from frontend (not fetched!)
const { categoryKey, categoryLabel, profileData, assessmentData } = await request.json()
```

**Context size:**
- Uses PASSED data (not fetched)
- **Total: ~500-800 tokens**

**Optimization: ✅ Excellent!**
- Data is **already in memory** on frontend
- No database queries per suggestion
- Uses caching table: `prompt_suggestions_cache`

---

### 3. Master Vision Assembly
**File:** `src/app/api/viva/master-vision/route.ts`

**What it loads:**
```typescript
// ✅ Data passed from frontend (not fetched!)
const { categorySummaries, categoryTranscripts, profile, assessment, activeVision } = await request.json()
```

**Context size:**
- All 12 category summaries: ~2000-3000 tokens
- Profile (flattened): ~200 tokens
- Assessment (flattened): ~300 tokens
- **Total: ~2500-3500 tokens**

**Optimization: ✅ Great!**
- Only called **ONCE** (at the end of flow)
- Uses flattened data (via `flattenProfile()`, `flattenAssessment()`)
- No redundant fetching

---

### 4. Context Route (Rolling Context Object)
**File:** `src/app/api/viva/context/route.ts`

**What it loads:**
```typescript
// ⚠️ This is the HEAVYWEIGHT route
const profile = await supabase.from('user_profiles').select('*')
const vision = await supabase.from('vision_versions').select('*')
const assessment = await supabase.from('assessment_results').select('*')
const recentJournals = await supabase.from('journal_entries').select('*')
const vibrationalLinks = await supabase.from('vibrational_links').select('*')
const categoryStates = await supabase.from('life_vision_category_state').select('*')
```

**Context size:**
- Profile: ~200 tokens
- Vision (full): ~1500 tokens
- Assessment: ~500 tokens
- Journals: ~500 tokens
- Vibrational links: ~300 tokens
- **Total: ~3000 tokens**

**When it's called:**
- GET endpoint (for analysis/overview pages)
- **NOT** called during vision creation flow

**Optimization: ⚠️ Could be improved**
- This is like the "master context builder"
- Should have caching like `/viva` chat
- Should support partial loading (e.g., skip journals if not needed)

---

## Comparison: `/viva` Chat vs `/life-vision/new`

| Metric | `/viva` Chat (BEFORE) | `/life-vision/new` |
|--------|----------------------|-------------------|
| **Data loading** | Fetched on EVERY message | Fetched ONCE, passed around |
| **Context size** | ~2300 tokens per message | ~900-1700 per category |
| **Database queries** | 6+ queries per message | 2 queries per category |
| **Caching** | None (now added ✅) | Prompt suggestions cached |
| **System prompt** | Massive (2000+ tokens) | Focused (200-500 tokens) |
| **Flattening** | None (full objects) | Yes (via `prompt-flatteners.ts`) |

---

## Token Usage Per User Journey

### Vision Creation Flow (12 Categories)

**For one complete vision:**

```
1. Prompt Suggestions (×12 categories):
   - Cached after first call
   - ~500 tokens × 12 = ~6,000 tokens
   
2. Category Summaries (×12):
   - Profile + Assessment + Transcript
   - ~1,500 tokens × 12 = ~18,000 tokens
   
3. Master Assembly (×1):
   - All summaries + profile + assessment
   - ~3,500 tokens × 1 = ~3,500 tokens

Total: ~27,500 tokens per complete vision
Cost: ~$0.28 (gpt-4-turbo at $0.01/1K input tokens)
```

**This is reasonable!** Each category is processed once, and the data is intelligently reused.

---

### Chat Conversation (10 Messages)

**Before optimization:**
```
10 messages × 2,300 tokens = 23,000 tokens
Cost: ~$0.23
```

**After caching:**
```
1st message: 2,300 tokens
9 messages: 9 × 50 = 450 tokens
Total: 2,750 tokens
Cost: ~$0.03
Savings: 87%
```

**After context-aware loading + caching:**
```
1st message (minimal): 110 tokens
9 messages: 9 × 50 = 450 tokens
Total: 560 tokens
Cost: ~$0.006
Savings: 98%
```

---

## Recommendations

### ✅ Vision Creation Flow: KEEP AS-IS

The `/life-vision/new` flow is **already well-optimized**:

1. ✅ Data is fetched once and passed around
2. ✅ Prompt suggestions are cached
3. ✅ Uses data flattening (`prompt-flatteners.ts`)
4. ✅ Category-specific field selection
5. ✅ Master assembly only runs once

**No changes needed!**

---

### ⚠️ Context Route: OPTIMIZE

**File:** `src/app/api/viva/context/route.ts`

This route loads EVERYTHING and could benefit from:

1. **Caching:** Cache the Rolling Context Object per user
2. **Partial loading:** Allow requesting specific parts only
3. **Stale-while-revalidate:** Return cached + refresh in background

**Implementation:**

```typescript
// Add cached_context column to user_profiles
ALTER TABLE user_profiles ADD COLUMN cached_context JSONB;
ALTER TABLE user_profiles ADD COLUMN cached_context_updated_at TIMESTAMP;

// Check cache first
const cacheAge = Date.now() - cached_context_updated_at
if (cacheAge < 5 * 60 * 1000) { // 5 minutes
  return cached_context
}

// Build fresh context
const context = await buildRollingContext(...)

// Update cache
await supabase
  .from('user_profiles')
  .update({ 
    cached_context: context,
    cached_context_updated_at: new Date()
  })
  .eq('user_id', userId)
```

**Savings:**
- Reduce from 6 DB queries to 1 cache lookup
- Save ~3000 tokens on repeated calls
- Faster response times

---

### 🚀 Chat Route: IMPLEMENT CONTEXT-AWARE LOADING

**File:** `src/app/api/viva/chat/route.ts`

We've already added caching ✅, now add smart loading:

```typescript
const contextNeeds = detectContextNeeds(userMessage, isInitialGreeting)

// Only load what's needed
if (contextNeeds.profile === 'minimal') {
  // Just get name
}

if (contextNeeds.vision === 'section') {
  // Only load ONE section, not all 14!
}
```

**Savings:**
- 50-95% reduction on first message
- 98% total savings when combined with caching

---

## Data Flattening: Best Practice

**File:** `src/lib/viva/prompt-flatteners.ts`

The vision creation flow uses **data flattening** to reduce tokens:

```typescript
// ❌ BAD: Send full objects
const profile = { id: 123, user_id: 456, created_at: '...', first_name: 'John', ... }
// ~500 tokens of metadata

// ✅ GOOD: Flatten to essentials
const profileText = flattenProfile(profile)
// "First Name: John, Age: 30, Occupation: Engineer"
// ~100 tokens
```

**Available flatteners:**
- `flattenProfile()` - Full profile to key:value
- `flattenAssessment()` - Assessment without scores
- `flattenAssessmentWithScores()` - Assessment with green line
- `flattenProfileStories()` - Category-specific narratives

**Should `/viva` chat use flattening?**

Yes! But only AFTER implementing context-aware loading:

1. First: Avoid loading unnecessary data
2. Then: Flatten what you do load

---

## Summary

| System | Current State | Optimization | Priority |
|--------|--------------|--------------|----------|
| **Vision Creation** | ✅ Already optimized | None needed | Low |
| **Chat (Caching)** | ✅ Implemented | Working | Done |
| **Chat (Context-Aware)** | ⏳ Documented | Ready to implement | **HIGH** |
| **Context Route** | ⚠️ Heavy | Add caching | Medium |
| **Data Flattening** | ✅ Used in vision | Consider for chat | Low |

---

## Cost Impact at Scale

**Assumptions:**
- 1,000 users per day
- Each creates 1 vision (~27,500 tokens)
- Each has 5 chat messages (~2,750 tokens with caching)

**Current state (with chat caching):**
```
Vision: 1,000 × 27,500 = 27.5M tokens/day
Chat: 1,000 × 2,750 = 2.75M tokens/day
Total: 30.25M tokens/day

Cost: ~$300/day = $9,000/month
```

**With context-aware chat:**
```
Vision: 1,000 × 27,500 = 27.5M tokens/day
Chat: 1,000 × 560 = 0.56M tokens/day
Total: 28.06M tokens/day

Cost: ~$280/day = $8,400/month
Savings: $600/month
```

---

## Key Takeaways

1. ✅ **Vision creation is already optimized** - don't touch it!
2. ✅ **Chat caching is live** - saves 87% on messages 2+
3. 🎯 **Context-aware loading is next** - will save 50-95% on message 1
4. 💡 **Data flattening is a pattern to learn from** - vision flow does this well
5. ⚠️ **Context route needs caching** - but lower priority (less frequently used)

**Bottom line:** The vision creation flow is a **model of efficiency**. The chat system was the problem child, and we're fixing it! 🚀





