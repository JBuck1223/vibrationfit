# VIVA Context-Aware Loading

**Last Updated:** November 16, 2024

## The Next Level of Optimization 🚀

We already added **system prompt caching** (saves 78-93% on messages 2+).

Now we can add **context-aware loading** (saves 50-90% on message 1!).

---

## Problem with Current Approach

Even with caching, the **first message** still loads everything:

```typescript
// Current: ALWAYS load all this on first message
const [profile, vision, assessment, journeyState] = await Promise.all([
  fetchFullProfile(),           // 200 tokens
  fetchFullVision(),            // 1500 tokens (all 14 sections!)
  fetchFullAssessment(),        // 500 tokens
  fetchJourneyState()           // 100 tokens
])
// Total: ~2300 tokens + 6 database queries
```

**But what if the user just says "Hi"?**

We don't need:
- ❌ Their complete life vision (1500 tokens)
- ❌ Their assessment results (500 tokens)  
- ❌ Their journey stats (100 tokens)

We only need:
- ✅ Their name (10 tokens)

**Savings: ~2,190 tokens (95%!) + 5 database queries**

---

## Solution: Context-Aware Loading

**Analyze the user's message → Load only what's needed**

```typescript
// NEW: Smart loading based on user intent
const contextNeeds = detectContextNeeds(userMessage, isInitialGreeting)

// Only load what's needed!
if (contextNeeds.profile === 'minimal') {
  // Just get their name - skip full profile
}

if (contextNeeds.vision === 'section') {
  // Only load ONE section, not all 14!
}

if (contextNeeds.assessment === 'none') {
  // Skip assessment entirely
}
```

---

## Context Detection Examples

### 1. Minimal Context (Name Only)

**User messages:**
- "Hi"
- "Hello"
- "Hey there"
- "Good morning"
- "Tell me a joke"
- "Ok"
- "Thanks"

**Load:**
- ✅ Name only (minimal profile)
- ❌ Skip vision
- ❌ Skip assessment
- ❌ Skip journey state

**Savings:** ~2,190 tokens + 5 DB queries

---

### 2. Profile Focus

**User messages:**
- "Tell me about my profile"
- "What's my info?"
- "Who am I?"

**Load:**
- ✅ Full profile
- ❌ Skip vision
- ❌ Skip assessment
- ❌ Skip journey state

**Savings:** ~2,100 tokens + 5 DB queries

---

### 3. Journey State Only

**User messages:**
- "How am I doing?"
- "What's my progress?"
- "Show me my stats"

**Load:**
- ✅ Name only
- ❌ Skip vision
- ❌ Skip assessment
- ✅ Journey state counts

**Savings:** ~2,000 tokens + 3 DB queries

---

### 4. Specific Vision Section

**User messages:**
- "Help me with my health vision"
- "Work on my career section"
- "Tell me about my relationships"

**Load:**
- ✅ Name only
- ✅ ONLY health section (not all 14!)
- ❌ Skip assessment
- ❌ Skip journey state

**Savings:** ~1,200 tokens + 3 DB queries

---

### 5. Assessment Focus

**User messages:**
- "What did my assessment say?"
- "Show me my results"
- "What were my quiz answers?"

**Load:**
- ✅ Name only
- ❌ Skip vision
- ✅ Full assessment
- ❌ Skip journey state

**Savings:** ~1,600 tokens + 4 DB queries

---

### 6. Full Context (Deep Discussion)

**User messages:**
- "Show me my complete vision"
- "Give me the full picture"
- "Help me with everything"

**Load:**
- ✅ Full profile
- ✅ Full vision (all 14 sections)
- ✅ Full assessment
- ✅ Journey state

**Savings:** None (but it's intentional)

---

## Token Savings Breakdown

| User Intent | Load | Tokens Used | Tokens Saved | DB Queries Saved |
|-------------|------|-------------|--------------|------------------|
| **Greeting** | Name only | ~110 | ~2,190 (95%) | 5 |
| **Profile** | Profile | ~300 | ~2,000 (87%) | 5 |
| **Journey** | Name + Stats | ~210 | ~2,090 (91%) | 3 |
| **Vision Section** | Name + 1 Section | ~450 | ~1,850 (80%) | 3 |
| **Assessment** | Name + Assessment | ~700 | ~1,600 (70%) | 4 |
| **Full Context** | Everything | ~2,300 | 0 (0%) | 0 |

---

## Combined with Caching

**Scenario: User has 10-message conversation starting with "Hi"**

### Without Any Optimization
```
Message 1: "Hi"         → 2,300 tokens
Message 2: "How are you?" → 2,300 tokens
Message 3: "Tell me more" → 2,300 tokens
...
Message 10: "Thanks"    → 2,300 tokens

Total: 23,000 tokens
```

### With Caching Only
```
Message 1: "Hi"         → 2,300 tokens (build & cache)
Message 2: "How are you?" → 50 tokens (cached)
Message 3: "Tell me more" → 50 tokens (cached)
...
Message 10: "Thanks"    → 50 tokens (cached)

Total: 2,750 tokens
Savings: 20,250 tokens (88%)
```

### With Context-Aware Loading + Caching 🔥
```
Message 1: "Hi"         → 110 tokens (minimal context, build & cache)
Message 2: "How are you?" → 50 tokens (cached minimal context)
Message 3: "Tell me more" → 50 tokens (cached minimal context)
...
Message 10: "Thanks"    → 50 tokens (cached minimal context)

Total: 560 tokens
Savings: 22,440 tokens (98%!) 🚀
```

---

## Implementation

### 1. Context Detector

**File:** `src/lib/viva/context-detector.ts`

```typescript
export function detectContextNeeds(
  userMessage: string, 
  isInitialGreeting: boolean
): ContextNeeds {
  // Analyze message and return what to load
  // Returns: { profile, vision, assessment, journeyState, sectionKey? }
}
```

### 2. Update Chat Route

**File:** `src/app/api/viva/chat/route.ts`

**Before:**
```typescript
// Always load everything
const [profile, vision, assessment, journeyState] = await Promise.all([...])
```

**After:**
```typescript
// Detect what's needed
const contextNeeds = detectContextNeeds(lastUserMessage, isInitialGreeting)

// Conditionally load
let profileData = null
let visionData = null
let assessmentData = null
let journeyState = null

if (contextNeeds.profile !== 'none') {
  profileData = await fetchProfile(contextNeeds.profile === 'full')
}

if (contextNeeds.vision !== 'none') {
  if (contextNeeds.vision === 'section') {
    visionData = await fetchVisionSection(contextNeeds.sectionKey)
  } else {
    visionData = await fetchFullVision()
  }
}

if (contextNeeds.assessment === 'full') {
  assessmentData = await fetchAssessment()
}

if (contextNeeds.journeyState) {
  journeyState = await fetchJourneyState()
}
```

### 3. Build Appropriate System Prompt

```typescript
// Build system prompt with only loaded context
const systemPrompt = buildVivaSystemPrompt({
  userName,
  profileData,      // Could be minimal or full
  visionData,       // Could be null, section, or full
  assessmentData,   // Could be null or full
  journeyState,     // Could be null or full
  currentPhase: visionBuildPhase,
  context: { ...context, requestedSection }
})
```

### 4. Track Savings

```typescript
const savings = estimateContextSavings(contextNeeds)
console.log(`[VIVA CHAT] Context optimization saved ~${savings.tokens_saved} tokens`)
console.log(`[VIVA CHAT] ${savings.description}`)

// Log to token_usage metadata
metadata: {
  context_optimization: true,
  tokens_saved: savings.tokens_saved,
  queries_saved: savings.db_queries_saved,
  context_loaded: contextNeeds
}
```

---

## Progressive Context Loading

**Smart enhancement:** If conversation evolves, load more context!

```typescript
// Start with minimal
Message 1: "Hi" → Load: name only

// User asks about vision
Message 2: "Tell me about my health" → Load: health section (not cached, add to context)

// User wants full picture
Message 3: "Show me everything" → Load: full vision (not cached, add to context)
```

**Implementation:**
- Check what's already in `cached_system_prompt`
- If user needs MORE context, fetch additional data
- Append to cached prompt
- Update cache

---

## Edge Cases

### 1. User Updates Their Vision Mid-Chat

**Problem:** Cache is stale

**Solution:** Invalidate cache when vision updates

```typescript
// After vision update
await supabase
  .from('conversation_sessions')
  .update({ cached_system_prompt: null })
  .eq('user_id', userId)
  .eq('created_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24h
```

### 2. Ambiguous User Intent

**Problem:** Can't determine what they need

**Solution:** Default to reasonable context

```typescript
// Default: profile + vision, skip assessment
return {
  profile: 'full',
  vision: 'full',
  assessment: 'none',  // Skip unless explicitly needed
  journeyState: false  // Skip unless explicitly needed
}
```

### 3. Context Switching Mid-Conversation

**Problem:** User starts with "Hi" then asks about vision

**Solution:** Progressive loading (see above)

---

## Monitoring

### Track Context Optimization Effectiveness

```sql
-- See how often we save tokens with context optimization
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_messages,
  COUNT(*) FILTER (WHERE metadata->>'context_optimization' = 'true') as optimized,
  AVG((metadata->>'tokens_saved')::int) as avg_tokens_saved,
  SUM((metadata->>'tokens_saved')::int) as total_tokens_saved
FROM token_usage
WHERE action_type = 'chat_conversation'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### See Most Common Context Types

```sql
-- What context do users typically need?
SELECT 
  metadata->'context_loaded'->>'profile' as profile_level,
  metadata->'context_loaded'->>'vision' as vision_level,
  metadata->'context_loaded'->>'assessment' as assessment_level,
  COUNT(*) as frequency
FROM token_usage
WHERE action_type = 'chat_conversation'
  AND metadata->>'context_optimization' = 'true'
GROUP BY 1, 2, 3
ORDER BY frequency DESC;
```

---

## Cost Impact at Scale

**Assumptions:**
- 1,000 users per day
- Average 5 messages per conversation
- 50% of first messages can use minimal context

**Current (with caching only):**
```
1,000 users × 2,300 tokens (first message) = 2.3M tokens/day
1,000 users × (4 × 50 tokens) (cached messages) = 200K tokens/day
Total: 2.5M tokens/day
Cost: $25/day = $750/month
```

**With Context-Aware Loading:**
```
500 users × 110 tokens (minimal) = 55K tokens/day
500 users × 2,300 tokens (full) = 1.15M tokens/day
1,000 users × (4 × 50 tokens) (cached) = 200K tokens/day
Total: 1.4M tokens/day
Cost: $14/day = $420/month

Savings: $330/month
```

---

## Rollout Plan

1. ✅ **Create:** `src/lib/viva/context-detector.ts`
2. ⏳ **Update:** `src/app/api/viva/chat/route.ts` (integrate detection)
3. ⏳ **Update:** `src/lib/viva/prompts/chat-system-prompt.ts` (handle partial context)
4. ⏳ **Test:** Send various message types, verify context loading
5. ⏳ **Monitor:** Track `context_optimization` in `token_usage` metadata
6. ⏳ **Optimize:** Refine detection rules based on usage patterns

---

## Testing Checklist

| User Message | Expected Context | Tokens Saved |
|--------------|------------------|--------------|
| "Hi" | Name only | ~2,190 |
| "How am I doing?" | Name + Journey | ~2,000 |
| "My health vision" | Name + Health section | ~1,200 |
| "Show me everything" | Full context | 0 |
| "Tell me a joke" | Name only | ~2,190 |
| "My assessment results" | Name + Assessment | ~1,600 |

---

## Summary

✅ **Problem:** First message loads unnecessary context (2,300 tokens)  
✅ **Solution:** Detect user intent → Load only what's needed  
✅ **Result:** Save 50-95% of tokens on first message  
✅ **Combined:** With caching = 98% total savings! 🚀  
✅ **Bonus:** Faster responses (fewer DB queries)  

**This is the future of VIVA optimization!** 💡




