# VIVA Streaming Mode Token Tracking Issue

**Date:** November 16, 2025  
**Status:** ⚠️ LIMITATION IDENTIFIED  
**Route:** `/api/viva/chat`

---

## 🔴 The Problem

The `/viva` chat endpoint uses **Vercel AI SDK's `streamText()`** for real-time streaming responses. However, **streaming mode does not return token usage information** in the `onFinish` callback.

### What's Happening

```typescript
const result = streamText({
  model: openai(MODEL),
  system: systemPrompt,
  messages: chatMessages,
  async onFinish({ text, usage }) {
    // usage is undefined or has no token counts in streaming mode ❌
    console.log(usage) // null or {}
  }
})
```

**Result:** Database logs show:
```sql
tokens_used: 3828        -- Estimated total (not accurate)
input_tokens: 0          -- ❌ Not available in streaming
output_tokens: 0         -- ❌ Not available in streaming
calculated_cost_cents: 0 -- ❌ Can't calculate without tokens
```

---

## 🔍 Root Cause

The Vercel AI SDK's `streamText()` function:
- Streams tokens in real-time for better UX
- Does NOT wait for full completion to get usage stats
- The `onFinish` callback receives `text` but **not detailed token counts**

This is **different from**:
- OpenAI's native client (`openai.chat.completions.create()`) which returns `completion.usage`
- Non-streaming API calls that get full usage stats

---

## 📊 Impact

### What Works ✅
1. Model uses admin settings (`/admin/ai-models`)
2. Conversations save correctly
3. Streaming works perfectly
4. User experience is excellent

### What Doesn't Work ❌
1. **No input/output token breakdown**
2. **No accurate cost calculation**
3. **Can't track per-message costs**
4. Token usage must be estimated (inaccurate)

---

## 💡 Solutions

### Option 1: Keep Streaming, Estimate Tokens (CURRENT)

**Pros:**
- ✅ Best user experience (real-time streaming)
- ✅ No code changes needed
- ✅ Fast responses

**Cons:**
- ❌ No accurate token tracking
- ❌ No cost calculation per message
- ❌ Must estimate based on text length

**Implementation:**
```typescript
// Estimate tokens from text length
const estimatedTotal = Math.ceil(text.length / 4) + Math.ceil(systemPrompt.length / 4)

await trackTokenUsage({
  tokens_used: estimatedTotal,
  input_tokens: 0,  // Unknown in streaming
  output_tokens: 0, // Unknown in streaming
  // ...
})
```

---

### Option 2: Switch to Non-Streaming OpenAI Client ⭐ RECOMMENDED

**Pros:**
- ✅ Accurate token tracking (input + output)
- ✅ Accurate cost calculation
- ✅ Matches other VIVA routes (consistency)
- ✅ Full `completion.usage` object

**Cons:**
- ❌ No real-time streaming (waits for full response)
- ❌ Slightly slower perceived response time
- ❌ Requires code refactor

**Implementation:**
```typescript
// Use native OpenAI client like other routes
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const completion = await openai.chat.completions.create({
  model: MODEL,
  messages: [
    { role: 'system', content: systemPrompt },
    ...chatMessages
  ],
  temperature: 0.8,
})

// ✅ Full usage stats available!
if (completion.usage) {
  await trackTokenUsage({
    tokens_used: completion.usage.total_tokens,
    input_tokens: completion.usage.prompt_tokens,
    output_tokens: completion.usage.completion_tokens,
    // Cost will be calculated accurately
  })
}
```

---

### Option 3: Hybrid Approach (Best of Both Worlds)

**Implementation:**
1. Stream the response for UX
2. After streaming completes, make a second lightweight call to get token count
3. Or: Estimate tokens during stream, reconcile with OpenAI billing data later

**Pros:**
- ✅ Streaming UX
- ✅ Eventually accurate tokens

**Cons:**
- ❌ Complex implementation
- ❌ Extra API calls
- ❌ Delayed cost tracking

---

## 🎯 Recommended Solution

### Switch to Non-Streaming OpenAI Client

**Why:**
1. **Consistency:** All other VIVA routes use OpenAI client directly
2. **Accuracy:** Business needs accurate cost tracking
3. **Simplicity:** Proven pattern that works
4. **Performance:** With GPT-4o/5, response time is < 2 seconds anyway

**Impact:**
- User types message
- ⏳ Waits 1-3 seconds (no streaming dots)
- ✅ Full response appears at once
- ✅ Tokens tracked accurately
- ✅ Costs calculated correctly

---

## 📝 Implementation Plan

### Step 1: Replace AI SDK with OpenAI Client

```typescript
// Remove
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

// Add
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})
```

### Step 2: Update API Call

```typescript
// Replace streamText() with chat.completions.create()
const completion = await openai.chat.completions.create({
  model: MODEL,
  messages: [
    { role: 'system', content: systemPrompt },
    ...chatMessages.map(m => ({
      role: m.role,
      content: m.content
    }))
  ],
  temperature: 0.8,
  max_tokens: 2000,
})

const assistantMessage = completion.choices[0]?.message?.content || ''
```

### Step 3: Track Tokens

```typescript
if (completion.usage) {
  await trackTokenUsage({
    user_id: user.id,
    action_type: 'chat_conversation',
    model_used: MODEL,
    tokens_used: completion.usage.total_tokens,
    input_tokens: completion.usage.prompt_tokens,
    output_tokens: completion.usage.completion_tokens,
    openai_request_id: completion.id,
    system_fingerprint: completion.system_fingerprint,
    success: true,
    metadata: { ... }
  })
}
```

### Step 4: Return Response

```typescript
// Return full message (not streamed)
return new Response(assistantMessage, {
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Conversation-Id': currentConversationId || ''
  }
})
```

### Step 5: Update Frontend

```typescript
// Frontend expects text, not stream
const response = await fetch('/api/viva/chat', { ... })
const text = await response.text()

// Display immediately (no streaming needed)
setMessages(prev => [...prev, {
  id: Date.now().toString(),
  role: 'assistant',
  content: text
}])
```

---

## 🧪 Testing

After implementing:

1. **Verify token tracking:**
   ```sql
   SELECT tokens_used, input_tokens, output_tokens 
   FROM token_usage 
   WHERE action_type = 'chat_conversation'
   ORDER BY created_at DESC LIMIT 1;
   ```
   
   Should show:
   ```
   tokens_used: 4127
   input_tokens: 2543   ✅
   output_tokens: 1584  ✅
   ```

2. **Verify cost calculation:**
   ```sql
   SELECT calculated_cost_cents 
   FROM token_usage 
   WHERE action_type = 'chat_conversation'
   ORDER BY created_at DESC LIMIT 1;
   ```
   
   Should show actual cost (not 0)

3. **Test user experience:**
   - Message sends
   - Brief wait (1-3 seconds)
   - Full response appears
   - No streaming dots (expected)

---

## 📈 Performance Comparison

| Aspect | Streaming (Current) | Non-Streaming (Proposed) |
|--------|-------------------|------------------------|
| **Token Tracking** | ❌ None | ✅ Accurate |
| **Cost Calculation** | ❌ None | ✅ Accurate |
| **UX Perception** | ⚡ Instant | ⏳ 1-3 sec wait |
| **Total Time** | ~3 seconds | ~3 seconds |
| **Code Complexity** | Medium | Simple |
| **Consistency** | Different from other routes | ✅ Same as all routes |

**Note:** Total time is same - streaming just *feels* faster because tokens appear incrementally.

---

## 🎯 Decision Time

**Recommendation:** Implement Option 2 (Non-Streaming OpenAI Client)

**Reason:**
- Business needs accurate cost tracking
- Consistency with existing codebase
- Proven pattern that works
- Minor UX trade-off for major data accuracy gain

**Timeline:** 30-45 minutes to implement and test

---

## 📚 Reference Files

- **Current Implementation:** `/src/app/api/viva/chat/route.ts`
- **Working Example:** `/src/app/api/viva/master-vision/route.ts` (uses OpenAI client, tracks tokens correctly)
- **Token Tracking:** `/src/lib/tokens/tracking.ts`
- **Admin Config:** `/admin/ai-models`

---

**Status:** ⚠️ Awaiting decision on implementation approach

**Next Steps:**
1. Choose solution (Option 1, 2, or 3)
2. Implement changes
3. Test thoroughly
4. Deploy

---

**Questions?** Check `/docs/viva/VIVA_EXPERT_SUMMARY.md` for complete system documentation.




