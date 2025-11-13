# Membership Tiers Table - How It Actually Works

**Last Updated:** November 13, 2025  
**Purpose:** Explain the relationship between `membership_tiers` table and your actual pricing/billing

---

## 🤔 The Confusion

You have a `membership_tiers` table with **23 columns**, but your pricing page only shows:
- **$499 Intensive** (one-time)
- **$999/year** OR **$99/28-days** (continuity)

**Why the disconnect?** The table was designed for a complex multi-tier system, but you're now using a simple **Hormozi-style single offer + continuity** model.

---

## 📊 Your Current Pricing Model (From #pricing on Home Page)

### What Users Actually See & Pay

**Step 1: Activation Intensive**
```
Price: $499
Payment Options:
  - Pay in Full: $499 today
  - 2 Payments: $249.50 × 2
  - 3 Payments: $166.33 × 3
  
Includes:
  - 72-Hour Activation Intensive
  - 8 weeks of Vision Pro access (56-day trial)
  - 1,000,000 tokens for intensive
```

**Step 2: Continuity (Starts Day 56)**
```
Option A: Vision Pro Annual
  - $999/year
  - 5,000,000 tokens granted annually
  - Billed once per year
  - Save 22% vs. 28-day plan
  - tier_type: 'vision_pro_annual'

Option B: Vision Pro 28-Day
  - $99 every 28 days
  - 375,000 tokens per cycle
  - Billed every 4 weeks
  - Flexible cancellation
  - tier_type: 'vision_pro_28day'
```

---

## 🗄️ The `membership_tiers` Table Structure

### Full Column List (23 columns)

| Column | Type | Used? | Purpose |
|--------|------|-------|---------|
| `id` | uuid | ✅ Yes | Primary key |
| `name` | varchar(100) | ✅ Yes | Display name ("Vision Pro Annual") |
| `tier_type` | membership_tier_type | ✅ Yes | Identifier ('vision_pro_annual', 'vision_pro_28day') |
| `description` | text | ⚠️ Barely | Long description (not shown on pricing page) |
| `monthly_vibe_assistant_tokens` | integer | ❌ **Legacy** | **NOT USED** - Old token system |
| `monthly_vibe_assistant_cost_limit` | numeric | ❌ **Legacy** | **NOT USED** - Old cost tracking |
| `price_per_month` | numeric | ❌ **Legacy** | **NOT USED** - Old pricing field |
| `price_monthly` | integer | ⚠️ Sort of | Stored in cents, but not primary source |
| `price_yearly` | integer | ⚠️ Sort of | Stored in cents, but not primary source |
| `is_active` | boolean | ✅ Yes | Whether tier is available |
| `created_at` | timestamptz | ✅ Yes | Creation timestamp |
| `updated_at` | timestamptz | ✅ Yes | Last update |
| `features` | jsonb | ⚠️ Barely | Feature list (not displayed on pricing page) |
| `viva_tokens_monthly` | integer | ❌ **Legacy** | **NOT USED** - Duplicate of token tracking |
| `max_visions` | integer | ❌ **Unused** | Vision limits (you allow unlimited) |
| `is_popular` | boolean | ❌ **Unused** | "Most Popular" badge (not in current design) |
| `display_order` | integer | ❌ **Unused** | Sort order (only 2 tiers, hardcoded in UI) |
| `stripe_product_id` | text | ⚠️ Sort of | Stripe product ID (could be used) |
| `stripe_price_id` | text | ⚠️ Sort of | Stripe price ID (could be used) |
| `annual_token_grant` | integer | ❌ **Legacy** | **NOT USED** - Use `token_transactions` instead |
| `monthly_token_grant` | integer | ❌ **Legacy** | **NOT USED** - Use `token_transactions` instead |
| `billing_interval` | text | ⚠️ Sort of | 'month' or 'year' |

### Key Fields Currently Used

**Only these fields matter:**
1. ✅ `id` - Referenced by `customer_subscriptions.membership_tier_id`
2. ✅ `name` - Display name (not shown on pricing page, but used in dashboard)
3. ✅ `tier_type` - The **most important** identifier ('vision_pro_annual', 'vision_pro_28day')
4. ✅ `is_active` - Whether tier is available for purchase

**Everything else is either legacy or minimally used.**

---

## 🔌 How It Actually Works: The Real Flow

### Your Actual Billing System (Stripe + Supabase)

```mermaid
User clicks "Start Journey" on pricing page
  ↓
1. Checkout page (/checkout)
   - Hardcoded Stripe Price IDs from ENV vars
   - Creates Stripe checkout session
   - No membership_tiers table lookup!
  ↓
2. Stripe processes payment
   - Intensive: One-time payment
   - Continuity: Creates subscription with 56-day trial
  ↓
3. Webhook receives event (stripe/webhook/route.ts)
   - Looks up tier_type from metadata
   - Queries membership_tiers table to get tier.id
   - Inserts record into customer_subscriptions
   - Grants tokens via token_transactions table
  ↓
4. customer_subscriptions table
   - Links user_id → membership_tier_id
   - Stores stripe_subscription_id
   - Tracks billing periods
   - This is the source of truth for active subscriptions
```

### Where Prices Really Live

**Not in `membership_tiers`!** They live in:

1. **Your pricing page UI** (`src/app/pricing/page.tsx`)
   - Hardcoded: `$999/year` and `$99/28 days`
   - Hardcoded feature lists
   - Hardcoded token amounts

2. **Environment variables**
   ```bash
   NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=price_xxx  # $999/year
   NEXT_PUBLIC_STRIPE_PRICE_28DAY=price_yyy   # $99/28-days
   STRIPE_PRICE_INTENSIVE_FULL=price_zzz      # $499 one-time
   STRIPE_PRICE_INTENSIVE_2PAY=price_aaa      # $249.50 subscription
   STRIPE_PRICE_INTENSIVE_3PAY=price_bbb      # $166.33 subscription
   ```

3. **Stripe Dashboard**
   - The actual prices (in cents)
   - Billing intervals
   - Product descriptions
   - Tax settings

### What `membership_tiers` Actually Does

**It's basically a lookup table** that maps `tier_type` → `tier.id` so:

```typescript
// In webhook
const tierType = 'vision_pro_annual'
const { data: tier } = await supabase
  .from('membership_tiers')
  .select('id')
  .eq('tier_type', tierType)
  .single()

// Then insert into customer_subscriptions
await supabase.from('customer_subscriptions').insert({
  user_id: userId,
  membership_tier_id: tier.id,  // ← Only reason we need membership_tiers
  stripe_subscription_id: subscriptionId,
  // ...
})
```

**That's it.** It's just a reference table.

---

## 🆕 Adding Household Plans

### New Tier Types Needed

You're adding these via the household migration:

```sql
INSERT INTO membership_tiers (
  tier_type,
  name,
  // ...
) VALUES
  ('household_28day', 'Vision Pro Household 28-Day', ...),
  ('household_annual', 'Vision Pro Household Annual', ...);
```

### How Household Fits In

**Same pattern:**
1. Pricing page shows Solo vs. Household options
2. User selects Household → goes to checkout
3. Checkout creates Stripe session with household price ID
4. Webhook receives event, looks up `tier_type: 'household_28day'`
5. Creates subscription record with `membership_tier_id` pointing to household tier
6. Household-specific logic handled in separate `households` and `household_members` tables

---

## 🧹 Fields You Can Ignore

### Legacy Fields (From Old Multi-Tier System)

These were from when you had "Free/Starter/Pro/Elite" tiers:

- ❌ `monthly_vibe_assistant_tokens` - Old token system
- ❌ `monthly_vibe_assistant_cost_limit` - Old cost tracking
- ❌ `price_per_month` - Old pricing (use `price_monthly` instead, or better yet, Stripe)
- ❌ `viva_tokens_monthly` - Duplicate of token tracking
- ❌ `annual_token_grant` - Use `token_transactions` instead
- ❌ `monthly_token_grant` - Use `token_transactions` instead

### Unused UI Fields

- ❌ `is_popular` - You don't show "Most Popular" badges
- ❌ `display_order` - Only 2 tiers, order is hardcoded
- ❌ `max_visions` - You allow unlimited visions

### Possibly Useful Later

- ⚠️ `features` (jsonb) - Could be used to dynamically generate feature lists
- ⚠️ `stripe_product_id` - Could be used to link to Stripe
- ⚠️ `stripe_price_id` - Could be used instead of ENV vars
- ⚠️ `description` - Could be shown on pricing page

---

## 📋 Summary: How Your System Really Works

### Source of Truth for Pricing

| What | Where It Lives | Why |
|------|----------------|-----|
| **Actual prices** | Stripe Dashboard | Real billing happens here |
| **Price IDs** | Environment variables | Connect code to Stripe |
| **Display prices** | Pricing page UI (hardcoded) | What users see |
| **Tier references** | `membership_tiers.tier_type` | Maps tier names to IDs |
| **Active subscriptions** | `customer_subscriptions` | Who has what plan |
| **Token balances** | `token_transactions` | Current token counts |

### The `membership_tiers` Table Role

**Purpose:** Reference table to map `tier_type` → `tier.id`

**Used for:**
1. Looking up tier ID in webhook when creating subscriptions
2. Joining `customer_subscriptions` → `membership_tiers` to get tier name
3. That's basically it

**Not used for:**
- ❌ Displaying prices (hardcoded in UI)
- ❌ Storing actual billing info (that's in Stripe)
- ❌ Token management (that's in `token_transactions`)
- ❌ Feature gates (features are universal for Vision Pro)

---

## 🎯 Recommendation: Simplify the Schema

### Option A: Minimal Approach (Keep Current)

**Keep `membership_tiers` as a simple lookup table:**

```sql
CREATE TABLE membership_tiers (
  id UUID PRIMARY KEY,
  tier_type membership_tier_type UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Pros:**
- Simple, clear purpose
- Less maintenance
- Prices live where they belong (Stripe + UI)

**Cons:**
- Can't query tiers to get prices
- Need to update UI and Stripe separately

### Option B: Keep Full Schema (Current)

**Keep all 23 columns, but document which are used:**

**Pros:**
- Flexible for future use
- Can store metadata in `features` jsonb
- Don't have to migrate data

**Cons:**
- Confusing (lots of unused fields)
- Maintenance overhead
- Multiple sources of truth for pricing

### Option C: Hybrid (Recommended)

**Keep useful fields, remove legacy:**

```sql
ALTER TABLE membership_tiers
  DROP COLUMN monthly_vibe_assistant_tokens,
  DROP COLUMN monthly_vibe_assistant_cost_limit,
  DROP COLUMN price_per_month,
  DROP COLUMN viva_tokens_monthly,
  DROP COLUMN annual_token_grant,
  DROP COLUMN monthly_token_grant,
  DROP COLUMN max_visions,
  DROP COLUMN is_popular,
  DROP COLUMN display_order;
```

**Keep:**
- `id`, `tier_type`, `name`, `description`
- `features` (jsonb - useful for metadata)
- `stripe_product_id`, `stripe_price_id` (for reference)
- `is_active`, `created_at`, `updated_at`

---

## ✅ Next Steps

### For Your Current Question

**Q: "Does the household system work with how I currently handle memberships?"**

**A: Yes!** The household plans will work exactly like your current Vision Pro plans:

1. Add `'household_28day'` and `'household_annual'` to `membership_tier_type` enum ✅ (done in migration)
2. Insert household tiers into `membership_tiers` table ✅ (done in migration)
3. Update pricing page to show Solo vs. Household options (TODO)
4. Add household Stripe prices to ENV vars (TODO)
5. Webhook handles household subscriptions same as current (TODO)
6. Additional household logic (members, seats, token sharing) handled in separate `households` tables ✅ (done)

### For the Migration Error

The `max_users` error happened because:
- ❌ `membership_tiers` table doesn't have a `max_users` column
- ✅ You tried to INSERT into it
- ✅ **Fixed:** Moved max_seats info into `features` jsonb instead

---

**Key Takeaway:** Your `membership_tiers` table is bloated with legacy fields, but the household system will work fine because it follows the same pattern: `tier_type` → lookup → create subscription.


