# Household Integration Plan - Fits Existing System

## ✅ How Households Work with Current Membership System

Your current system:
- `customer_subscriptions` → `membership_tiers` (vision_pro_annual, vision_pro_28day)
- Stripe manages billing
- Admin has ONE subscription

## 🎯 Household Feature Overview

### Option 1: Household as Add-On (Recommended)
**Keep your existing subscription system intact.**

**Pricing:**
- **Admin**: Pays for Vision Pro (Annual $999 or 28-Day $99)
- **Add Members**: +$29/month per additional household member (max 5)
- **Members get**: Full platform access, individual token allocation (100 tokens/month)
- **Token sharing**: Optional (admin can enable/disable)

**Example:**
```
Admin: $999/year (Vision Pro Annual) + 5M tokens
Member 1: +$29/month + 100 tokens/month
Member 2: +$29/month + 100 tokens/month

Total: $999/year + $58/month for 2-member household
Household tokens: 5M + (100 × 12 × 2) = 5,002,400 tokens/year
```

### Option 2: Household-Specific Tiers (Alternative)
**Add new membership tiers for households.**

**New tiers in `membership_tiers` table:**
- `household_annual` - $1,297/year (saves vs $999 + $348)
- `household_28day` - $149/28-days

---

## 🏗️ Implementation with Option 1 (Recommended)

### 1. Keep ALL Existing Tables

No changes to:
- ✅ `customer_subscriptions`
- ✅ `membership_tiers`
- ✅ Stripe integration
- ✅ Webhook handling
- ✅ Pricing page flow

### 2. Add Household Tables (Simplified)

```sql
-- Simplified households table - just for grouping
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'My Household',
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  shared_tokens_enabled BOOLEAN DEFAULT FALSE,
  max_members INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(admin_user_id)
);

-- Track household members
CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  allow_shared_tokens BOOLEAN DEFAULT TRUE,
  monthly_fee_cents INTEGER DEFAULT 2900, -- $29/month add-on
  stripe_subscription_item_id TEXT, -- For per-member billing
  status TEXT CHECK (status IN ('active', 'removed')) DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id),
  UNIQUE(user_id) -- One household at a time
);

-- Invitations (same as before)
CREATE TABLE household_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invitation_token TEXT NOT NULL UNIQUE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Link to User Profiles (Simplified)

```sql
-- Just add household link to user_profiles
ALTER TABLE user_profiles 
  ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  ADD COLUMN is_household_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN allow_shared_tokens BOOLEAN DEFAULT TRUE,
  ADD COLUMN monthly_tokens_granted INTEGER DEFAULT 100; -- Individual allocation
```

### 4. Stripe Integration for Member Add-Ons

When admin adds a member:
```typescript
// Add a subscription item to admin's existing subscription
await stripe.subscriptions.update(adminSubscriptionId, {
  items: [
    ...existingItems,
    {
      price: 'price_household_member', // $29/month price ID
      quantity: 1
    }
  ]
})

// Store the subscription_item_id in household_members table
```

When admin removes a member:
```typescript
// Remove the subscription item
await stripe.subscriptions.deleteItem(subscriptionItemId)
```

---

## 💡 User Experience Flow

### Admin Journey:

1. **Signs up for Vision Pro** (current flow - unchanged)
   - Pays $499 intensive + chooses annual/28-day
   - Gets full Vision Pro access

2. **Adds household member** (new feature)
   - Goes to `/household/settings`
   - Clicks "Add Member" → enters email
   - Stripe adds $29/month to their subscription
   - Invitation sent

3. **Member accepts** (new flow)
   - Member creates account (if new user)
   - Joins household, no payment required
   - Gets 100 tokens/month allocation
   - Can use admin's tokens if sharing enabled

### Member Journey:

1. **Receives invitation email**
   - Clicks link → `/invite/{token}`
   - Signs up or logs in
   - Accepts invitation

2. **Gets full platform access**
   - No payment required (admin pays $29/month)
   - Individual token allocation (100/month)
   - Can opt into shared tokens

3. **If removed**
   - Option to become solo user
   - Must subscribe to Vision Pro to continue

---

## 📊 Pricing Page Updates

### Current Pricing (Keep):
```
Vision Activation Intensive: $499 (3 payment options)
↓ 56-day trial ↓
Annual: $999/year (5M tokens)
28-Day: $99/28-days (375k tokens)
```

### Add Household Option:
```tsx
// After selecting Vision Pro plan
<Card>
  <h3>Add Household Members?</h3>
  <p>Invite up to 5 family members or partners</p>
  <p>+$29/month per member</p>
  <p>Each member gets: Full platform access + 100 tokens/month</p>
  <Toggle>Enable token sharing across household</Toggle>
  <Input placeholder="How many members?" type="number" max="5" />
</Card>
```

---

## 🔧 Technical Implementation Checklist

### Phase 1: Database (1 day)
- [ ] Create households, household_members, household_invitations tables
- [ ] Add household_id to user_profiles
- [ ] Create RLS policies
- [ ] Create helper functions

### Phase 2: Stripe Integration (2 days)
- [ ] Create Stripe price for household member ($29/month)
- [ ] Update webhook to handle household member subscriptions
- [ ] Add/remove subscription items when members join/leave
- [ ] Handle proration

### Phase 3: API Routes (2 days)
- [ ] POST /api/household/invite
- [ ] POST /api/household/invite/accept
- [ ] DELETE /api/household/members/:id
- [ ] PATCH /api/household/settings

### Phase 4: UI (3 days)
- [ ] Household settings page
- [ ] Invitation flow
- [ ] Member management
- [ ] Token sharing toggle
- [ ] Household selector in header

### Phase 5: Token System (1 day)
- [ ] Update validateTokenBalance() for household sharing
- [ ] Update trackTokenUsage() for household deduction
- [ ] Monthly token grants for members

### Phase 6: Testing (2 days)
- [ ] End-to-end invitation flow
- [ ] Stripe billing verification
- [ ] Token sharing scenarios
- [ ] Member removal flows

**Total: ~11 days development**

---

## 💰 Revenue Impact

### Example Scenarios:

**Solo User (Current):**
- Annual: $999/year = $83.25/month
- 28-Day: $99/28-days = ~$128/month

**Household (2 members):**
- Admin: $999/year ($83.25/month)
- Member 1: +$29/month
- **Total: $112.25/month** (35% increase)

**Household (4 members):**
- Admin: $999/year ($83.25/month)
- 3 Members: +$87/month
- **Total: $170.25/month** (104% increase!)

### Projected Impact:
- **10% of users add 1 member** → +2.9% MRR
- **5% of users add 2+ members** → +3.5% MRR
- **Total:** +6.4% MRR increase

---

## 🎯 Why This Approach Works

### ✅ Pros:
1. **No disruption** to existing subscription flow
2. **Incremental revenue** via member add-ons
3. **Stripe handles billing** automatically
4. **Simple to implement** - just add features on top
5. **Easy to market** - "Add family for $29/month"

### ⚠️ Considerations:
1. Need Stripe subscription_items API
2. Prorated billing when adding/removing members
3. Token allocations per member (100/month)
4. Webhook updates for member billing events

---

## 📋 Alternative: Option 2 (Household Tiers)

If you prefer dedicated household tiers:

### New Membership Tiers:
```sql
INSERT INTO membership_tiers (
  name,
  tier_type,
  stripe_product_id,
  stripe_price_id,
  monthly_vibe_assistant_tokens,
  features
) VALUES
  ('Vision Pro Household Annual', 'household_annual', 'prod_xxx', 'price_xxx', 5100000, '{"household_enabled": true, "max_members": 6}'),
  ('Vision Pro Household 28-Day', 'household_28day', 'prod_yyy', 'price_yyy', 400000, '{"household_enabled": true, "max_members": 6}');
```

### Pricing:
- **Household Annual**: $1,297/year (vs $999 solo) = +$298/year for 5 extra members
- **Household 28-Day**: $149/28-days (vs $99 solo) = +$50/28-days for 5 extra members

**Pros:**
- Simpler billing (one subscription)
- Better for marketing ("Household Plan")

**Cons:**
- Less flexible (fixed member count)
- Can't add members incrementally

---

## 🚀 Recommendation

**Go with Option 1 (Add-On Model)**:
- More flexible for users
- Higher lifetime value (incremental adds)
- Easier to implement (no new tiers)
- Better fits your current system

---

**Next Steps:**
1. Approve this plan
2. I'll update the migration to match this simpler approach
3. We'll build the Stripe integration
4. Launch household feature as add-on

Let me know if you want me to proceed with this approach!

