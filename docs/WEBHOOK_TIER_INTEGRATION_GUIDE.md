# Stripe Webhook Integration with Membership Tiers

**Date:** November 15, 2025  
**Status:** Implementation Guide  
**File:** `/src/app/api/stripe/webhook/route.ts`

---

## 🎯 Goal

Replace hardcoded token grant logic with dynamic tier-based grants using the new `grant_tokens_by_stripe_price_id()` database function.

---

## ❌ OLD APPROACH (Hardcoded)

```typescript
// OLD: Check tier_type and call specific function with hardcoded values
if (tierType === 'vision_pro_annual') {
  await supabase.rpc('grant_annual_tokens', {
    p_user_id: userId,
    p_subscription_id: newSubscription?.id,
  })
} else if (tierType === 'vision_pro_28day') {
  await supabase.rpc('drip_tokens_28day', {
    p_user_id: userId,
    p_subscription_id: newSubscription?.id,
    p_cycle_number: 1,
  })
}
```

**Problems:**
- Hardcoded tier logic
- Need to update code for new tiers
- Doesn't work with household plans
- Token amounts in multiple places

---

## ✅ NEW APPROACH (Dynamic)

```typescript
// NEW: Get Stripe price ID and call universal function
const priceId = subscription.items.data[0].price.id

const { data: result, error: grantError } = await supabase
  .rpc('grant_tokens_by_stripe_price_id', {
    p_user_id: userId,
    p_stripe_price_id: priceId,
    p_subscription_id: newSubscription?.id || null,
  })

if (grantError) {
  console.error('❌ Failed to grant tokens:', grantError)
} else {
  console.log('✅ Tokens granted:', result)
}
```

**Benefits:**
- No hardcoded tier logic
- Works with all current and future tiers
- Token amounts from database
- Automatic household support
- Single source of truth

---

## 📝 Required Changes

### 1. Remove Hardcoded Import

```typescript
// ❌ REMOVE:
import { TOKEN_GRANTS, STORAGE_QUOTAS } from '@/lib/billing/config'
```

### 2. Update `checkout.session.completed` Event

**Location:** Line ~115-148

**Replace:**
```typescript
// HORMOZI PRICING: Grant tokens based on plan type
if (tierType === 'vision_pro_annual') {
  // Annual: Grant 5M tokens immediately
  const { data: result, error: grantError } = await supabase
    .rpc('grant_annual_tokens', {
      p_user_id: userId,
      p_subscription_id: newSubscription?.id || null,
    })
  
  if (grantError) {
    console.error('❌ Failed to grant annual tokens:', grantError)
  } else {
    console.log('✅ Annual tokens granted:', result)
  }
  
  // Storage quota is now granted by grant_annual_tokens function
} 
else if (tierType === 'vision_pro_28day') {
  // 28-Day: Drip 375k tokens on first cycle
  const { data: result, error: dripError } = await supabase
    .rpc('drip_tokens_28day', {
      p_user_id: userId,
      p_subscription_id: newSubscription?.id || null,
      p_cycle_number: 1,
    })
  
  if (dripError) {
    console.error('❌ Failed to drip tokens:', dripError)
  } else {
    console.log('✅ First cycle tokens dripped:', result)
  }
  
  // Storage quota is now granted by drip_tokens_28day function (first cycle only)
}
```

**With:**
```typescript
// Grant tokens based on Stripe price ID (dynamic tier lookup)
const priceId = subscription.items.data[0].price.id

const { data: result, error: grantError } = await supabase
  .rpc('grant_tokens_by_stripe_price_id', {
    p_user_id: userId,
    p_stripe_price_id: priceId,
    p_subscription_id: newSubscription?.id || null,
  })

if (grantError) {
  console.error('❌ Failed to grant tokens:', grantError)
  console.error('Price ID:', priceId)
} else {
  console.log('✅ Tokens and storage granted:', result)
  console.log('Tier:', result.tier)
}
```

### 3. Update Intensive Trial Token Grants

**Location:** Multiple places (~359-374, ~609-638)

**Replace:**
```typescript
// Grant trial tokens
if (tierType === 'vision_pro_annual') {
  await supabase.rpc('grant_trial_tokens', {
    p_user_id: userId,
    p_subscription_id: newSubscription?.id || null,
    p_tokens: TOKEN_GRANTS.INTENSIVE_TRIAL,
    p_trial_period_days: 56,
  })
  // Storage quota is now granted by grant_trial_tokens function
} else if (tierType === 'vision_pro_28day') {
  await supabase.rpc('grant_trial_tokens', {
    p_user_id: userId,
    p_subscription_id: newSubscription?.id || null,
    p_tokens: TOKEN_GRANTS.INTENSIVE_TRIAL,
    p_trial_period_days: 56,
  })
  // Storage quota is now granted by grant_trial_tokens function
}
```

**With:**
```typescript
// Grant intensive trial tokens (1M for 56 days)
const { data: result, error: grantError } = await supabase
  .rpc('grant_trial_tokens', {
    p_user_id: userId,
    p_intensive_id: intensivePurchase?.id || null,
  })

if (grantError) {
  console.error('❌ Failed to grant intensive trial tokens:', grantError)
} else {
  console.log('✅ Intensive trial tokens granted:', result)
}
```

### 4. Update `invoice.payment_succeeded` (Renewals)

**Location:** Line ~873-888

**Replace:**
```typescript
const cycleNumber = (count || 0) + 1

const { data: result, error: dripError } = await supabase
  .rpc('drip_tokens_28day', {
    p_user_id: subscription.user_id,
    p_subscription_id: subscription.id,
    p_cycle_number: cycleNumber,
  })

if (dripError) {
  console.error('❌ Failed to drip tokens on renewal:', dripError)
} else {
  console.log('✅ Cycle', cycleNumber, 'tokens dripped:', result)
}
```

**With:**
```typescript
// Grant tokens for renewal (dynamic tier lookup)
const { data: result, error: grantError } = await supabase
  .rpc('grant_tokens_by_stripe_price_id', {
    p_user_id: subscription.user_id,
    p_stripe_price_id: subscription.stripe_price_id,
    p_subscription_id: subscription.id,
  })

if (grantError) {
  console.error('❌ Failed to grant tokens on renewal:', grantError)
} else {
  console.log('✅ Renewal tokens granted:', result)
}
```

---

## 🔍 Testing Checklist

After making changes:

1. ✅ **Solo Annual Subscription**
   - Create subscription with Vision Pro Annual
   - Verify 5M tokens + 100GB granted
   - Check token expiration (365 days)

2. ✅ **Solo 28-Day Subscription**
   - Create subscription with Vision Pro 28-Day
   - Verify 375k tokens + 25GB granted
   - Check token expiration (90 days)
   - Test renewal (should grant another 375k)

3. ✅ **Household Annual Subscription**
   - Create subscription with Household Annual
   - Verify 5M tokens + 100GB granted (shared)
   - Check household record created

4. ✅ **Household 28-Day Subscription**
   - Create subscription with Household 28-Day
   - Verify 750k tokens + 100GB granted (shared)
   - Check household record created

5. ✅ **Intensive Purchase**
   - Create intensive purchase
   - Verify 1M trial tokens granted
   - Check expiration (56 days)
   - Verify Vision Pro subscription created with trial_end

6. ✅ **Intensive Household Purchase**
   - Create intensive household purchase
   - Verify 2M trial tokens granted
   - Check household record created with 2 seats

---

## 🎯 Summary

**Before:**
- 3 separate grant functions
- Hardcoded tier logic
- 4+ if/else blocks
- Token amounts in multiple places

**After:**
- 1 universal grant function
- Dynamic tier lookup from Stripe price ID
- 0 if/else blocks for tiers
- Token amounts in database only

**Lines Removed:** ~150  
**Lines Added:** ~30  
**Complexity Reduction:** ~80%

---

## 🚀 Next Steps

1. Update the webhook file
2. Deploy to staging
3. Test all subscription types
4. Add Stripe price IDs to membership_tiers
5. Deploy to production





