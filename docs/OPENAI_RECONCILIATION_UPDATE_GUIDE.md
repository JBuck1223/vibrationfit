# OpenAI Reconciliation - API Route Update Guide

**Last Updated:** November 16, 2025

---

## ✅ What's Already Done

1. ✅ TypeScript interfaces updated (`src/lib/tokens/tracking.ts`)
2. ✅ AI client updated to capture OpenAI metadata (`src/lib/ai/client.ts`)
3. ✅ Tracking function updated to save reconciliation fields

---

## 🔄 Routes That Need Updates

### 📍 Routes Using `generateText` (Easy - Already Works!)

These routes use our `generateText` function from `src/lib/ai/client.ts` which now automatically returns OpenAI metadata:

```typescript
// Example of routes that use generateText:
// - Routes that import { generateText } from '@/lib/ai/client'
// - Just need to pass response.openai_request_id to trackTokenUsage
```

**Update Pattern:**
```typescript
const response = await generateText({...})

await trackTokenUsage({
  // ... existing fields ...
  openai_request_id: response.openai_request_id,        // ADD
  openai_created: response.openai_created,               // ADD
  system_fingerprint: response.system_fingerprint,      // ADD
  success: true
})
```

### 🚧 Routes Using Vercel AI SDK `streamText` (Need Different Approach)

**Files:**
- `src/app/api/viva/chat/route.ts`
- Other streaming routes

**Problem:** Vercel AI SDK's `streamText` doesn't expose OpenAI's raw response metadata.

**Solutions:**

#### Option 1: Use Raw Response Headers (Preferred)
OpenAI includes request ID in response headers:

```typescript
import { openai } from '@ai-sdk/openai'

const result = streamText({
  model: openai('gpt-4-turbo'),
  messages: messages,
  onFinish: async ({usage, rawResponse}) => {
    // Try to get request ID from headers
    const openaiRequestId = rawResponse?.headers?.get('x-request-id')
    
    await trackTokenUsage({
      user_id: user.id,
      action_type: 'chat_conversation',
      model_used: MODEL,
      tokens_used: usage.totalTokens,
      input_tokens: usage.promptTokens,
      output_tokens: usage.completionTokens,
      // Reconciliation fields
      openai_request_id: openaiRequestId || undefined,
      openai_created: Date.now() / 1000, // Unix timestamp
      success: true
    })
  }
})
```

#### Option 2: Switch to Direct OpenAI API (Full Control)

For routes where exact cost tracking is critical, use `generateText` instead of `streamText`:

```typescript
// Before (streaming):
const result = streamText({...})

// After (non-streaming but with full metadata):
import { generateText } from '@/lib/ai/client'

const response = await generateText({
  messages: messages,
  feature: 'VIVA_CHAT'
})

await trackTokenUsage({
  // All fields automatically available
  openai_request_id: response.openai_request_id,
  openai_created: response.openai_created,
  system_fingerprint: response.system_fingerprint,
  // ...rest
})
```

---

## 📋 Update Checklist By Route

### ✅ Easy Updates (Uses generateText)

#### 1. `/api/viva/category-summary`
```bash
grep -A 20 "trackTokenUsage" src/app/api/viva/category-summary/route.ts
```

**Update:** Add 3 lines to trackTokenUsage call

#### 2. `/api/viva/prompt-suggestions`
**Update:** Add 3 lines to trackTokenUsage call

#### 3. `/api/viva/merge-clarity`
**Update:** Add 3 lines to trackTokenUsage call

#### 4. `/api/viva/refine-category`
**Update:** Add 3 lines to trackTokenUsage call

#### 5. `/api/viva/final-assembly`
**Update:** Add 3 lines to trackTokenUsage call

#### 6. `/api/viva/flip-frequency`
**Update:** Add 3 lines to trackTokenUsage call

#### 7. `/api/viva/ideal-state`
**Update:** Add 3 lines to trackTokenUsage call

#### 8. `/api/viva/master-vision`
**Update:** Add 3 lines to trackTokenUsage call

#### 9. `/api/viva/blueprint`
**Update:** Add 3 lines to trackTokenUsage call

### 🟡 Medium Updates (Need Investigation)

#### 10. `/api/transcribe`
Check if this uses OpenAI Whisper API (has request IDs)

#### 11. `/api/viva/chat` (Streaming)
Uses Vercel AI SDK - see Option 1 above

---

## 🎯 Quick Update Script

For routes that use `generateText`, here's the pattern:

**Find this:**
```typescript
await trackTokenUsage({
  user_id: userId,
  action_type: 'some_action',
  model_used: response.model,
  tokens_used: response.usage?.total_tokens || 0,
  input_tokens: response.usage?.prompt_tokens || 0,
  output_tokens: response.usage?.completion_tokens || 0,
  success: true
})
```

**Replace with:**
```typescript
await trackTokenUsage({
  user_id: userId,
  action_type: 'some_action',
  model_used: response.model,
  tokens_used: response.usage?.total_tokens || 0,
  input_tokens: response.usage?.prompt_tokens || 0,
  output_tokens: response.output_tokens || 0,
  // OpenAI reconciliation fields
  openai_request_id: response.openai_request_id,
  openai_created: response.openai_created,
  system_fingerprint: response.system_fingerprint,
  success: true
})
```

---

## 🧪 Testing After Updates

1. **Make one AI request** through each updated route
2. **Check the database:**

```sql
SELECT 
  action_type,
  openai_request_id,
  openai_created,
  system_fingerprint,
  reconciliation_status,
  created_at
FROM token_usage
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

3. **Expected Results:**
   - ✅ `openai_request_id` populated (e.g., `chatcmpl-abc123`)
   - ✅ `reconciliation_status` = `pending`
   - ✅ `openai_created` = Unix timestamp

---

## 🚀 Priority Order

1. **HIGH:** Routes that use `generateText` (9 routes) - Easy 3-line additions
2. **MEDIUM:** Transcribe route - Check implementation
3. **LOW:** Chat route - Works but won't have perfect reconciliation unless we add header capture

---

## 💡 Next Steps

1. Start with one route to test the pattern
2. Verify data is captured correctly
3. Apply to remaining routes
4. Run migration on production
5. Monitor for 24 hours

---

**Ready to update?** Start with any route that imports `generateText` from `@/lib/ai/client` - those are the easiest!

