# VibrationFit Token System Guide
**Precise AI Usage Tracking for 80%+ Profit Margins**

---

## 📊 **Pricing Model (Alex Hormozi "Big Head, Long Tail")**

### **Annual Membership: $999/year**
- **Grant: 5,000,000 tokens immediately**
- **COGS Budget: $199.80 (20%)**
- **Actual AI Cost: ~$100 (avg user uses 5M tokens)**
- **Profit: $839 (84% margin)** ✅

### **Monthly Membership: $109/28 days**
- **Grant: 600,000 tokens per cycle**
- **COGS Budget: $21.80 (20%)**
- **Actual AI Cost: ~$12 (avg user)**
- **Profit: $87 (80% margin)** ✅
- **13 cycles/year = $1,417/year** (creates urgency to buy annual)

---

## 💎 **Token Costs (Real OpenAI Pricing)**

### **GPT-5 (Primary Model)**
```
Input:  $10 / 1M tokens
Output: $30 / 1M tokens
Average: ~$20 / 1M tokens
```

### **Action Type Costs:**

| Action | Avg Tokens | Cost per Action | Actions per 5M Tokens |
|--------|------------|-----------------|----------------------|
| **VIVA Chat** | 2,000-5,000 | $0.04-$0.10 | 1,000-2,500 |
| **Vision Refinement (short)** | 20,000-50,000 | $0.40-$1.00 | 100-250 |
| **Vision Refinement (deep)** | 100,000-200,000 | $2.00-$4.00 | 25-50 |
| **Blueprint Generation** | 150,000-300,000 | $3.00-$6.00 | 16-33 |
| **Audio Transcription (10 min)** | 3,000 equiv | $0.06 | 1,666 |
| **Image Generation (DALL-E)** | 2,000 equiv | $0.04 | 2,500 |

---

## 🔧 **Technical Implementation**

### **Database Schema**

```sql
-- Token transactions table (already created in migration)
token_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  action_type token_action_type,  -- 'chat', 'refinement', 'image', etc.
  tokens_used INTEGER,  -- Positive for deductions, negative for grants
  tokens_remaining INTEGER,  -- Snapshot after transaction
  estimated_cost_usd DECIMAL(10, 6),  -- Real $ cost
  openai_model TEXT,  -- e.g., 'gpt-5', 'dall-e-3'
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  metadata JSONB,
  created_at TIMESTAMP
)
```

### **Core Functions**

#### **1. Deduct Tokens (After AI Call)**
```typescript
import { deductTokens } from '@/lib/tokens/token-tracker'

// After OpenAI API call
const response = await openai.chat.completions.create({ ... })

// Get actual usage from OpenAI
const totalTokens = response.usage.total_tokens
const promptTokens = response.usage.prompt_tokens
const completionTokens = response.usage.completion_tokens

// Deduct and log
await deductTokens({
  userId: user.id,
  actionType: 'refinement',  // or 'chat', 'blueprint', etc.
  tokensUsed: totalTokens,
  model: 'gpt-5',
  promptTokens,
  completionTokens,
  metadata: {
    category: 'health',
    instruction_length: 500,
    // ... any context you want to track
  },
})
```

#### **2. Grant Tokens (Subscription/Renewal)**
```typescript
import { grantTokens } from '@/lib/tokens/token-tracker'

// On annual subscription
await grantTokens({
  userId: user.id,
  tokensToGrant: 5_000_000,
  actionType: 'subscription_grant',
  metadata: {
    subscription_id: 'sub_xxx',
    plan: 'annual',
  },
})

// On renewal
await grantTokens({
  userId: user.id,
  tokensToGrant: 5_000_000,
  actionType: 'renewal_grant',
  metadata: {
    renewal_date: new Date().toISOString(),
  },
})
```

#### **3. Check Balance Before Action**
```typescript
import { checkTokenBalance } from '@/lib/tokens/token-tracker'

const { hasEnough, balance } = await checkTokenBalance(
  user.id,
  50000  // Tokens needed for this action
)

if (!hasEnough) {
  return res.json({ 
    error: 'Insufficient tokens',
    balance,
    needed: 50000,
  }, { status: 402 })  // 402 = Payment Required
}
```

---

## 🎨 **User-Facing Display**

### **Dashboard Token Widget:**
```tsx
import { formatTokens } from '@/lib/tokens/token-tracker'

<div className="token-balance">
  <h3>Your Creation Balance</h3>
  <div className="balance">
    {formatTokens(balance, true)} {/* "4.2M" */}
  </div>
  <div className="bar">
    <div style={{ width: `${(balance / 5000000) * 100}%` }} />
  </div>
  <p className="detail">
    {formatTokens(balance)} tokens remaining {/* "4,234,567" */}
  </p>
  <p className="reset">Resets: {resetDate}</p>
</div>
```

### **Before AI Action (Confirmation):**
```tsx
<Dialog>
  <p>Use VIVA to refine your vision?</p>
  <p className="estimate">
    Estimated: 50,000-100,000 tokens
  </p>
  <p className="balance">
    You have {formatTokens(balance, true)} remaining
  </p>
  <Button>Use Tokens</Button>
</Dialog>
```

### **After Action (Toast Notification):**
```tsx
toast.success('Vision refined!', {
  description: `Used ${tokensUsed.toLocaleString()} tokens • ${formatTokens(remaining, true)} remaining`,
})
```

---

## 🔄 **Integration Checklist**

### **Already Integrated:**
- ✅ `refine-vision/route.ts` - Vision refinement tracking
- ✅ `viva/chat/route.ts` - Chat message tracking

### **To Integrate:**
- [ ] `generate-blueprint/route.ts` - Blueprint generation
- [ ] `audio/generate/route.ts` - Audio generation
- [ ] `transcribe/route.ts` - Whisper transcription
- [ ] `images/generate/route.ts` - DALL-E images (DONE - needs testing)

### **Webhook Updates Needed:**
- [ ] Update Stripe webhook to grant tokens on subscription
- [ ] Add token reset on annual renewal
- [ ] Add token pack purchase handling

### **UI Components Needed:**
- [ ] Dashboard token balance widget
- [ ] Token usage history page (`/dashboard/usage`)
- [ ] Low balance warning modal
- [ ] "Add Tokens" purchase flow

---

## 📈 **Business Intelligence**

### **Track These Metrics:**

1. **Average tokens used per user per month**
   - Target: < 500K for monthlies, < 2M for annuals
   - Alert if > 1M monthly or > 8M annually

2. **Most expensive actions**
   - Which features drive highest token usage?
   - Optimize or reprice accordingly

3. **Power user identification**
   - Users using > 80% of allocation
   - Upsell opportunity for token packs

4. **Actual COGS vs budgeted**
   - Monitor real OpenAI costs weekly
   - Adjust allocations if needed

### **Query Examples:**

```sql
-- Average monthly usage per user
SELECT 
  DATE_TRUNC('month', created_at) as month,
  AVG(daily_usage) as avg_tokens_per_user
FROM (
  SELECT 
    user_id,
    DATE(created_at) as day,
    SUM(CASE WHEN tokens_used > 0 THEN tokens_used ELSE 0 END) as daily_usage
  FROM token_transactions
  GROUP BY user_id, DATE(created_at)
) daily
GROUP BY month
ORDER BY month DESC;

-- Top 10 power users this month
SELECT 
  user_id,
  SUM(CASE WHEN tokens_used > 0 THEN tokens_used ELSE 0 END) as total_used,
  SUM(estimated_cost_usd) as total_cost
FROM token_transactions
WHERE created_at >= DATE_TRUNC('month', NOW())
  AND tokens_used > 0
GROUP BY user_id
ORDER BY total_used DESC
LIMIT 10;

-- Most expensive action types
SELECT 
  action_type,
  COUNT(*) as action_count,
  AVG(tokens_used) as avg_tokens,
  SUM(estimated_cost_usd) as total_cost
FROM token_transactions
WHERE tokens_used > 0
GROUP BY action_type
ORDER BY total_cost DESC;
```

---

## 🚨 **Safety Guardrails**

### **1. Rate Limiting**
```typescript
// Prevent abuse: Max 100 API calls per hour
if (userActionsThisHour > 100) {
  return { error: 'Rate limit exceeded' }
}
```

### **2. Maximum Single Action Cost**
```typescript
// No single action should cost > 500K tokens
if (estimatedTokens > 500000) {
  return { 
    error: 'Action too large',
    suggestion: 'Break into smaller refinements',
  }
}
```

### **3. Low Balance Warnings**
```typescript
// Warn when < 10% remaining
if (balance < 500000 && balance > 0) {
  // Show "Running low" banner
}

// Block when depleted
if (balance <= 0) {
  // Show "Add tokens" modal
}
```

---

## 📋 **Next Steps**

### **Phase 1: Tracking Infrastructure** ✅
- [x] Create `token_transactions` table
- [x] Build `token-tracker.ts` utilities
- [x] Integrate with refine-vision route
- [x] Integrate with VIVA chat

### **Phase 2: Image Generation**
- [x] Create `imageService.ts`
- [x] Create `/api/images/generate` route
- [ ] Add UI components for image generation
- [ ] Test DALL-E integration

### **Phase 3: Complete Integration**
- [ ] Update all AI routes to track tokens
- [ ] Update Stripe webhook for token grants
- [ ] Build dashboard token display
- [ ] Build usage history page
- [ ] Add low balance warnings

### **Phase 4: Token Packs**
- [ ] Create Stripe products for packs
- [ ] Build purchase flow
- [ ] Add "Add Tokens" CTA throughout app

---

## 🎯 **Success Criteria**

- ✅ Every AI action tracked with real token counts
- ✅ 80%+ profit margin maintained
- ✅ Users feel abundant (never "running out" anxiety)
- ✅ Power users can buy more (profitable upsell)
- ✅ Real-time cost visibility for business decisions

---

**Last Updated:** October 11, 2025  
**Based on:** Alex Hormozi's $100M Playbook pricing strategies

