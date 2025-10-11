# 🎁 VibrationFit Referral System Guide

## ✅ What's Built

A complete **"Refer 3, Get Yours Free"** referral system with:

- ✅ Automatic referral code generation for every user
- ✅ URL-based tracking (no signup forms needed)
- ✅ Conversion tracking (clicks → paying customers)
- ✅ Automatic rewards (every 3 referrals = 1 free month)
- ✅ Dashboard to see referral stats and rewards
- ✅ No promo code input field (all URL-based)

---

## 🎯 How It Works

### For Test Users (URL-Based Promo)
Send them a special link with a promo code:
```
https://vibrationfit.com/pricing?promo=testuser30
```

When they click "Start Creating", the promo code is automatically applied at checkout.

### For Referrals
1. Jordan signs up → Automatically gets referral code `jordan`
2. Jordan shares link: `https://vibrationfit.com/pricing?ref=jordan`
3. Friend clicks link → Tracked in database
4. Friend subscribes → Jordan gets credit
5. After 3 friends subscribe → Jordan gets 1 free month automatically

---

## 📊 Database Structure

### Tables Created (Migration: `20250113000000_create_referral_system.sql`)

1. **`user_referrals`** - User referral codes & stats
   - `referral_code` - Unique code (e.g., "jordan", "sarah123")
   - `total_referrals` - Total clicks
   - `successful_conversions` - Paying customers referred
   - `reward_tier` - Current reward level

2. **`referral_clicks`** - Track every click
   - `referrer_id` - Who sent the link
   - `referred_user_id` - Who clicked
   - `converted` - Did they subscribe?
   - `converted_at` - When

3. **`referral_rewards`** - Earned rewards
   - `reward_type` - `free_month`, `discount`, `tokens`, `free_forever`
   - `reward_value` - Details (e.g., `{"months": 1}`)
   - `is_claimed` - Has user used it?

---

## 🚀 Setup Steps

### 1. Apply Migration

```bash
# Via Supabase Dashboard
# Copy: supabase/migrations/20250113000000_create_referral_system.sql
# Paste into: SQL Editor → Run
```

### 2. Create Promo Codes in Stripe

For test users, create special promo codes:

```bash
# Via Stripe Dashboard
# Products → Coupons → Create Coupon

# Example: 30-day trial for test users
ID: testuser30
Duration: once
Trial days: 30
Max redemptions: 50
```

Or programmatically:

```typescript
import { createCoupon } from '@/lib/stripe/promotions'

await createCoupon({
  code: 'testuser30',
  percentOff: 100, // Free
  duration: 'once',
  maxRedemptions: 50,
})
```

### 3. Test It

**Test Promo Link:**
```
http://localhost:3000/pricing?promo=testuser30
```

**Test Referral Link:**
```
http://localhost:3000/pricing?ref=jordan
```

---

## 🎁 Referral Rewards Logic

### Current Setup: "Refer 3, Get 1 Free"

Every 3 successful conversions = 1 free month

Implemented in the migration trigger:
```sql
-- Every 3rd referral = 1 free month
IF referrer_conversions % 3 = 0 THEN
  INSERT INTO referral_rewards (reward_type, reward_value)
  VALUES ('free_month', '{"months": 1}')
END IF
```

### Other Reward Options

You can easily change the logic:

**Option 1: Refer 5, Get Yours Free Forever**
```sql
IF referrer_conversions = 5 THEN
  INSERT INTO referral_rewards (reward_type, reward_value)
  VALUES ('free_forever', '{"tier": "starter"}')
END IF
```

**Option 2: Progressive Rewards**
```sql
-- 1 referral = 500 VIVA tokens
IF referrer_conversions = 1 THEN
  INSERT INTO referral_rewards VALUES ('tokens', '{"tokens": 500}')
END IF

-- 3 referrals = 1 free month
IF referrer_conversions = 3 THEN
  INSERT INTO referral_rewards VALUES ('free_month', '{"months": 1}')
END IF

-- 10 referrals = Free forever
IF referrer_conversions = 10 THEN
  INSERT INTO referral_rewards VALUES ('free_forever', '{"tier": "pro"}')
END IF
```

**Option 3: Both Parties Get Discount**
```sql
-- When conversion happens, give both referrer and referee a discount
INSERT INTO referral_rewards (user_id, reward_type, reward_value)
VALUES 
  (referrer_id, 'discount', '{"percent": 20, "duration": "forever"}'),
  (referred_user_id, 'discount', '{"percent": 20, "duration": "forever"}');
```

---

## 📱 API Routes

### Get Referral Code & Stats
```typescript
GET /api/referral/generate

Response:
{
  "referralCode": "jordan",
  "referralLink": "https://vibrationfit.com/pricing?ref=jordan",
  "stats": {
    "totalClicks": 15,
    "conversions": 4,
    "successfulConversions": 4
  }
}
```

### Get Referral Rewards
```typescript
GET /api/referral/rewards

Response:
{
  "rewards": [
    {
      "id": "...",
      "reward_type": "free_month",
      "reward_value": { "months": 1 },
      "is_claimed": false,
      "created_at": "2025-01-11T..."
    }
  ],
  "summary": {
    "total": 2,
    "unclaimed": 1,
    "freeMonths": 1
  }
}
```

---

## 🎨 UI Examples

### Referral Dashboard Component

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Button, Card } from '@/lib/design-system/components'
import { Copy, Users, Gift } from 'lucide-react'
import { toast } from 'sonner'

export default function ReferralDashboard() {
  const [referralData, setReferralData] = useState(null)
  const [rewards, setRewards] = useState(null)

  useEffect(() => {
    // Fetch referral code & stats
    fetch('/api/referral/generate')
      .then(res => res.json())
      .then(setReferralData)

    // Fetch rewards
    fetch('/api/referral/rewards')
      .then(res => res.json())
      .then(setRewards)
  }, [])

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralData?.referralLink || '')
    toast.success('Referral link copied!')
  }

  return (
    <div className="space-y-6">
      {/* Referral Link Card */}
      <Card variant="elevated" className="p-6">
        <h3 className="text-xl font-bold mb-4">Share & Earn</h3>
        <p className="text-neutral-400 mb-4">
          Refer 3 friends who subscribe, get 1 month free!
        </p>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={referralData?.referralLink || ''}
            readOnly
            className="flex-1 px-4 py-2 bg-neutral-800 rounded-lg text-sm"
          />
          <Button onClick={copyReferralLink} variant="primary">
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card variant="elevated" className="p-4 text-center">
          <Users className="w-6 h-6 text-primary-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{referralData?.stats.totalClicks || 0}</div>
          <div className="text-xs text-neutral-400">Clicks</div>
        </Card>

        <Card variant="elevated" className="p-4 text-center">
          <Users className="w-6 h-6 text-secondary-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{referralData?.stats.conversions || 0}</div>
          <div className="text-xs text-neutral-400">Conversions</div>
        </Card>

        <Card variant="elevated" className="p-4 text-center">
          <Gift className="w-6 h-6 text-energy-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{rewards?.summary.freeMonths || 0}</div>
          <div className="text-xs text-neutral-400">Free Months</div>
        </Card>
      </div>

      {/* Unclaimed Rewards */}
      {rewards?.summary.unclaimed > 0 && (
        <Card variant="elevated" className="p-6 border-2 border-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-lg mb-1">🎉 You have {rewards.summary.unclaimed} reward(s)!</h4>
              <p className="text-sm text-neutral-400">Contact support to claim your free month</p>
            </div>
            <Button variant="primary">Claim Now</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
```

### Add to Dashboard

```tsx
// In src/app/dashboard/page.tsx

import ReferralDashboard from '@/components/ReferralDashboard'

<section>
  <h2 className="text-2xl font-bold mb-6">Refer & Earn</h2>
  <ReferralDashboard />
</section>
```

---

## 🔗 URL Patterns

### Promo Code (Test Users)
```
https://vibrationfit.com/pricing?promo=testuser30
https://vibrationfit.com/pricing?promo=launch50
https://vibrationfit.com/pricing?promo=vip100
```

### Referral Code
```
https://vibrationfit.com/pricing?ref=jordan
https://vibrationfit.com/pricing?ref=sarah123
```

### Combined (Referral + Promo)
```
https://vibrationfit.com/pricing?ref=jordan&promo=launch50
```

The referral tracks attribution, the promo applies a discount.

---

## 🧪 Testing Workflow

### 1. Create Test User #1
```bash
# Sign up as Jordan
# Check database: SELECT * FROM user_referrals WHERE user_id = 'jordan_id'
# Should see: referral_code = 'jordan'
```

### 2. Get Referral Link
```bash
curl http://localhost:3000/api/referral/generate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response: { "referralLink": "http://localhost:3000/pricing?ref=jordan" }
```

### 3. Test Referral Click
```bash
# Open link in incognito: http://localhost:3000/pricing?ref=jordan
# Sign up as Friend #1
# Subscribe with test card: 4242 4242 4242 4242
```

### 4. Verify Conversion
```sql
-- Check referral_clicks table
SELECT * FROM referral_clicks WHERE referrer_id = 'jordan_id';
-- Should show: converted = true

-- Check referral stats
SELECT * FROM user_referrals WHERE user_id = 'jordan_id';
-- Should show: successful_conversions = 1
```

### 5. Complete 3 Referrals
```bash
# Repeat step 3 with 2 more friends
# After 3rd conversion, check rewards:
SELECT * FROM referral_rewards WHERE user_id = 'jordan_id';
-- Should show: reward_type = 'free_month', reward_value = '{"months": 1}'
```

---

## 📊 Analytics Queries

### Top Referrers
```sql
SELECT 
  ur.referral_code,
  ur.successful_conversions,
  up.first_name,
  up.email
FROM user_referrals ur
JOIN user_profiles up ON ur.user_id = up.user_id
ORDER BY ur.successful_conversions DESC
LIMIT 10;
```

### Conversion Rate
```sql
SELECT 
  referral_code,
  total_referrals as clicks,
  successful_conversions as conversions,
  ROUND((successful_conversions::FLOAT / NULLIF(total_referrals, 0)) * 100, 2) as conversion_rate
FROM user_referrals
WHERE total_referrals > 0
ORDER BY conversion_rate DESC;
```

### Recent Conversions
```sql
SELECT 
  rc.converted_at,
  referrer.first_name as referrer_name,
  referred.first_name as referred_name
FROM referral_clicks rc
JOIN user_profiles referrer ON rc.referrer_id = referrer.user_id
JOIN user_profiles referred ON rc.referred_user_id = referred.user_id
WHERE rc.converted = true
ORDER BY rc.converted_at DESC
LIMIT 20;
```

---

## 🎯 Distribution Strategies

### For Test Users
Create personalized promo links:
```
youremail@gmail.com → https://vibrationfit.com/pricing?promo=testuser30
friend@gmail.com    → https://vibrationfit.com/pricing?promo=testuser30
```

Send via email:
> "Hi! Here's your exclusive 30-day trial link: [link]"

### For Referrals
Users can share their link:
- Copy/paste into email
- Share on social media
- Send via text message

You can display it in:
- Dashboard
- Profile page
- Email signature suggestion
- Post-purchase thank you page

---

## 💡 Advanced Features (Future)

### 1. Email Notifications
```typescript
// When someone uses your referral link
await sendEmail({
  to: referrer.email,
  subject: 'Someone clicked your referral link!',
  body: `Great news! Someone just used your referral link to sign up.`
})

// When you earn a reward
await sendEmail({
  to: referrer.email,
  subject: '🎉 You earned a free month!',
  body: `Congrats! 3 friends subscribed. You got 1 month free.`
})
```

### 2. Social Sharing Buttons
```tsx
<button onClick={() => shareToTwitter(referralLink)}>
  Share on Twitter
</button>
<button onClick={() => shareToFacebook(referralLink)}>
  Share on Facebook
</button>
```

### 3. Leaderboard
```tsx
<Card>
  <h3>Top Referrers This Month</h3>
  <ol>
    <li>Jordan - 12 referrals</li>
    <li>Sarah - 8 referrals</li>
    <li>Mike - 5 referrals</li>
  </ol>
</Card>
```

### 4. Tiered Rewards
```
1 referral  = 500 VIVA tokens
3 referrals = 1 free month
5 referrals = Pro tier upgrade
10 referrals = Free forever
```

---

## 🎉 You're All Set!

### What You Have:
- ✅ URL-based promo codes (no input field needed)
- ✅ Automatic referral system (refer 3, get 1 free)
- ✅ Full tracking & analytics
- ✅ Automatic reward distribution
- ✅ API endpoints for dashboard UI

### Next Steps:
1. Apply migration: `20250113000000_create_referral_system.sql`
2. Create test promo code in Stripe: `testuser30`
3. Build referral dashboard UI (see examples above)
4. Share test links with your beta users!

**Test Link Examples:**
```
https://vibrationfit.com/pricing?promo=testuser30
https://vibrationfit.com/pricing?ref=jordan
```

---

**Questions?** Refer to this guide or check the migration file for implementation details! 🚀

