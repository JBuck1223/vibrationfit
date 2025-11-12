# Household Pricing Structure

## 💰 Pricing Overview

### Solo Plan
- **Intensive**: $499
- **Continuity**: $99/28-days
- **Seats**: 1
- **Tokens**: 375k/28-days

### Household Plan
- **Intensive**: $699
- **Continuity**: $149/28-days
- **Seats**: 2 included (perfect for couples)
- **Tokens**: 750k/28-days (375k × 2)

### Add-On Members
- **28-Day Billing**: $19/28-days per additional member
- **Annual Billing**: $192/year per additional member
- **Max Additional**: 4 members (seats 3-6)
- **Total Max Household**: 6 people

---

## 🎯 Pricing Examples

### Couple (2 people) - Included Seats
```
Intensive: $699
Continuity: $149/28-days

Seats: 2 (Seat 1 + Seat 2)
Tokens: 750k/28-days total
Cost per person: $74.50/28-days
```

### Family of 3 (Couple + 1 Child)
```
Intensive: $699
Continuity: $149/28-days
Add-on Member: +$19/28-days

Total: $168/28-days
Seats: 3 (2 included + 1 add-on)
Tokens: 850k/28-days
Cost per person: $56/28-days
```

### Family of 6 (Max Capacity)
```
Intensive: $699
Continuity: $149/28-days
Add-on Members: +$76/28-days (4 × $19)

Total: $225/28-days
Seats: 6 (2 included + 4 add-ons)
Tokens: 1,350k/28-days
Cost per person: $37.50/28-days
```

---

## 📊 Comparison

### Solo vs. Household Value

| Plan | Cost/28-Days | Seats | Tokens | Cost/Person | Savings |
|------|--------------|-------|--------|-------------|---------|
| Solo | $99 | 1 | 375k | $99.00 | - |
| Household (2) | $149 | 2 | 750k | $74.50 | 25% |
| Household (3) | $168 | 3 | 850k | $56.00 | 43% |
| Household (6) | $225 | 6 | 1,350k | $37.50 | 62% |

**Value increases with family size!**

---

## 🔧 How It Works

### 1. Admin Subscribes to Household Plan

**At Purchase:**
```
Admin pays: $699 (Intensive)
Selects: Household Plan (28-day or Annual)
Gets: 2 seats immediately
Can invite: 1 person right away (spouse/partner)
```

**After 56-day trial:**
```
Billing starts: $149/28-days
Includes: 2 full seats
Can add: Up to 4 more members at $19/28-days each
```

### 2. Adding Additional Members (Seats 3-6)

**Admin adds member:**
1. Goes to `/household/settings`
2. Clicks "Add Member"
3. Chooses billing: 28-day ($19) or Annual ($192)
4. Enters member email
5. Stripe adds subscription item (pro-rated)

**Member receives:**
- Full platform access
- Individual token allocation (100 tokens/month)
- Option to use shared tokens (if enabled)

**Admin billing:**
```
Base household: $149/28-days
Member 1 (add-on): +$19/28-days
Member 2 (add-on): +$19/28-days

Total next billing: $187/28-days
(Pro-rated on first billing cycle)
```

### 3. Token Distribution

**Default Allocation:**
- Admin (Seat 1): Full access to base tokens
- Spouse (Seat 2): Full access to base tokens
- Add-on members (Seats 3-6): 100 tokens/month each

**With Token Sharing Enabled:**
- All members can pull from household token pool
- Members use their own tokens first
- Then pull from admin if needed and enabled

---

## 💳 Billing Implementation

### Stripe Structure

**Household Subscription:**
```typescript
// Admin's subscription in customer_subscriptions
{
  membership_tier_id: "household_28day" // or "household_annual"
  stripe_subscription_id: "sub_xxx"
  stripe_customer_id: "cus_xxx"
  
  // Subscription has multiple items:
  items: [
    { price: "price_household_base", quantity: 1 }, // Base $149/28-days
    { price: "price_member_addon", quantity: 2 }    // 2 add-ons at $19 each
  ]
}
```

**Adding a Member:**
```typescript
// Add subscription item to admin's subscription
await stripe.subscriptions.update(subscriptionId, {
  items: [
    ...existingItems,
    { price: "price_member_addon_28day", quantity: 1 } // $19/28-days
  ],
  proration_behavior: 'create_prorations' // Pro-rate the charge
})
```

**Removing a Member:**
```typescript
// Remove subscription item
await stripe.subscriptionItems.del(itemId, {
  proration_behavior: 'create_prorations' // Pro-rate the credit
})
```

---

## 🎨 Pricing Page Updates

### Current Pricing Section

**Update to include Household option:**

```tsx
// Solo Plan (Existing)
<PricingCard>
  <h3>Solo</h3>
  <p>$499 Intensive + $99/28-days</p>
  <Badge>1 Seat</Badge>
  <ul>
    <li>Full platform access</li>
    <li>375k AI tokens/28-days</li>
    <li>All Vision Pro features</li>
  </ul>
</PricingCard>

// Household Plan (NEW)
<PricingCard featured>
  <Badge variant="premium">Best for Couples</Badge>
  <h3>Household</h3>
  <p>$699 Intensive + $149/28-days</p>
  <Badge>2 Seats Included</Badge>
  <ul>
    <li>Full platform access for 2</li>
    <li>750k AI tokens/28-days</li>
    <li>All Vision Pro features</li>
    <li>Optional token sharing</li>
    <li>Add up to 4 more members</li>
    <li>$19/28-days per additional member</li>
  </ul>
</PricingCard>
```

### Add-On Info Section

```tsx
<Card>
  <h4>Need More Seats?</h4>
  <p>Add additional family members to your Household plan:</p>
  <ul>
    <li>$19/28-days per member</li>
    <li>OR $192/year per member (save $56/year)</li>
    <li>Add up to 4 additional members (6 total)</li>
    <li>Pro-rated billing on first charge</li>
    <li>Cancel individual add-ons anytime</li>
  </ul>
</Card>
```

---

## 📈 Revenue Impact

### Pricing Comparison

**1 Year Revenue:**

| Scenario | Intensive | Annual Continuity | Total Year 1 |
|----------|-----------|-------------------|--------------|
| Solo | $499 | $1,287 (13 × $99) | **$1,786** |
| Household (2) | $699 | $1,937 (13 × $149) | **$2,636** |
| Household (3) | $699 | $2,184 (13 × $168) | **$2,883** |
| Household (6) | $699 | $2,925 (13 × $225) | **$3,624** |

### Average Revenue Increase

- **2-person household**: +47.6% vs. solo
- **3-person household**: +61.4% vs. solo
- **6-person household**: +102.9% vs. solo

### Market Opportunity

**Target Audience:**
- **Couples** (42% of US adults) - natural fit for 2-seat plan
- **Families with teens** - add 1-2 teen/young adult members
- **Multi-generational** - elderly parents + adult children

**Projected Adoption:**
- 25% of new customers choose Household
- Average household size: 3 members
- Effective pricing: ~$168/28-days
- **+42% increase in average customer value**

---

## 🚀 Implementation Checklist

### Phase 1: Database (Complete)
- [x] Create household tables
- [x] Add membership_tiers for household plans
- [x] Link to user_profiles
- [x] Seat tracking system

### Phase 2: Stripe Integration
- [ ] Create Stripe prices
  - [ ] `price_household_28day_base`: $149/28-days
  - [ ] `price_household_annual_base`: TBD
  - [ ] `price_member_addon_28day`: $19/28-days
  - [ ] `price_member_addon_annual`: $192/year
- [ ] Update webhook to handle household subscriptions
- [ ] Add/remove subscription items for add-on members
- [ ] Handle proration

### Phase 3: Pricing Page
- [ ] Add Household plan card
- [ ] Highlight "2 seats included"
- [ ] Add add-on member info section
- [ ] Update checkout flow

### Phase 4: Household Management
- [ ] Household settings page
- [ ] Invite member flow
- [ ] Add-on billing selection (28-day vs annual)
- [ ] Remove member flow
- [ ] Token sharing toggle

### Phase 5: Member Experience
- [ ] Invitation acceptance page
- [ ] Household dashboard header
- [ ] Token balance display (individual + household)
- [ ] Settings: Opt in/out of shared tokens

---

## 📝 Key Technical Notes

### Seat Management

**Seat Assignment:**
- Seat 1: Always admin
- Seat 2: First invited member (included)
- Seats 3-6: Add-on members ($19/28-days or $192/annual)

**Tracking:**
```sql
household_members {
  seat_number: 1-6
  is_addon_seat: false (seats 1-2), true (seats 3-6)
  addon_billing_cycle: '28day' or 'annual' (for add-ons only)
  stripe_subscription_item_id: (for add-ons only)
}
```

### Token Allocation

**Base Household Plan:**
- Total tokens: 750k/28-days
- Distribution: Admin controls
- Sharing: Optional (admin enables)

**Add-On Members:**
- Individual allocation: 100 tokens/month (13 × 100 = 1,300/year)
- Can use shared tokens if enabled
- Pulls from household pool when individual runs out

### Billing Cycles

**Aligning Add-Ons to Admin Billing:**
- Admin on 28-day cycle → Add-ons billed every 28 days
- Admin on annual cycle → Add-ons can choose 28-day or annual
- First charge: Pro-rated to next billing date
- Subsequent charges: Aligned with admin's billing

---

## ✅ Summary

**Household Plan Benefits:**
1. ✅ **2 seats included** - perfect for couples
2. ✅ **Flexible add-ons** - grow family as needed
3. ✅ **Better value** - 25-62% savings per person
4. ✅ **Single billing** - one payment for whole family
5. ✅ **Token sharing** - optional across household
6. ✅ **Pro-rated** - fair billing when adding/removing

**Perfect For:**
- Married couples working on alignment together
- Families with teens/young adults
- Multi-generational households
- Business partners/co-founders

---

**Last Updated:** November 12, 2025

