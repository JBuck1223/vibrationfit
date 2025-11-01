# Stripe Intensive Product Metadata Guide

## Required Metadata for Each Payment Plan

### ✅ Full Payment ($499) - Recurring Product

**In Stripe Dashboard → Your Product → Price Metadata:**

```json
{
  "payment_plan": "full",
  "max_installments": "1",
  "product_type": "intensive"
}
```

**Why:** Even though it's a recurring price, we use `iterations: 1` in the subscription phase to ensure it only charges once (today). The metadata helps identify it in webhooks.

---

### ✅ 2-Pay Plan ($249.50 × 2) - Your Current Setup

**Current Metadata (Keep This):**
```json
{
  "payment_plan": "2pay",
  "max_installments": "2",
  "product_type": "intensive_split"
}
```

**✅ This is correct!** No changes needed. The metadata matches what the code expects:
- `payment_plan: "2pay"` → Used in checkout phase to set `iterations: 2`
- `max_installments: 2` → Documents it's a 2-payment plan
- `product_type: "intensive_split"` → Identifies it as a split payment intensive

---

### ✅ 3-Pay Plan ($166.33 × 3) - Recommended Metadata

**Should match:**
```json
{
  "payment_plan": "3pay",
  "max_installments": "3",
  "product_type": "intensive_split"
}
```

---

## How It Works

### The Code Uses Phase Configuration (Not Metadata)

The checkout code controls billing via subscription phases:

```typescript
// For full payment
iterations: 1,  // ← This makes it charge only once
end_date: 56 days from now

// For 2pay
iterations: 2,  // ← This makes it charge twice
end_date: 56 days from now

// For 3pay
iterations: 3,  // ← This makes it charge three times
end_date: 56 days from now
```

### Metadata is for Identification (Optional but Recommended)

The price metadata helps:
1. **Identify the product** in webhooks
2. **Document the configuration** in Stripe Dashboard
3. **Debug issues** if subscriptions behave unexpectedly
4. **Consistency** across all intensive products

---

## Summary

### New $499 Full Payment Product:

✅ **Add Metadata:**
```
payment_plan = "full"
max_installments = "1"
product_type = "intensive"
```

### 2-Pay Product:

✅ **Current Metadata is Good!** Keep as-is:
```
payment_plan = "2pay"
max_installments = "2"
product_type = "intensive_split"
```

### 3-Pay Product:

✅ **Ensure Metadata Matches:**
```
payment_plan = "3pay"
max_installments = "3"
product_type = "intensive_split"
```

---

## Important Notes

1. **The `iterations` in phase config controls billing** - This is what makes it charge once/twice/thrice
2. **Metadata is optional but recommended** - Helps with identification and debugging
3. **Product must be recurring type** - Even full payment needs to be a recurring price (not one-time) to work with subscription phases
4. **Billing interval** - Set to "28 days" (Custom interval) for 2pay/3pay plans to match Vision Pro 28-day. This allows both products to be in the same checkout. Full payment is one-time.

---

**Your 2pay metadata is perfect - no edits needed!** Just add the same structure to your new $499 full payment product.

