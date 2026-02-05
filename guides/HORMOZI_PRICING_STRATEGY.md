# 🚀 VibrationFit: Hormozi Pricing & Onboarding Strategy

**Based on:** Alex Hormozi's $100M Playbook, Offers, Leads, and Money Models  
**Strategy:** Mandatory Intensive + Dripped Credits with 72-Hour Activation

---

## 📊 Executive Summary

### What's Changing

**FROM: One-tier subscription with trial**
- Infinite plan: $99/month or $777/year
- 7-day free trial
- Unlimited tokens (risky COGS)

**TO: Mandatory Intensive + Tiered Continuity**
- $499 Vision Activation Intensive (mandatory entry)
- Vision Pro Annual: $999/year (default)
- Vision Pro 28-Day: $99 every 28 days (13 cycles = $1,287/year)
- Token dripping + storage quotas = controlled COGS

### Why This Works

1. **Big Head ($499)** - Immediate cash, qualifies buyers, funds acquisition
2. **Long Tail ($999-$1,287/year)** - Predictable recurring revenue
3. **COGS Control** - Dripped credits prevent abuse, annual locks in commitment
4. **Higher LTV** - $1,486–$1,786 first year vs. $777–$1,188 current
5. **Faster Activation** - 72-hour intensive creates immediate results

---

## 💰 New Pricing Structure

### Entry Point: Vision Activation Intensive

**Price:** $499 one-time (mandatory for everyone)

**What They Get (in 72 hours):**
- ✅ Life Vision drafted and finalized across 12 categories
- ✅ Vision Board built with templates and images
- ✅ 2 personalized Activation Audios (morning + evening)
- ✅ 7-Day Streak Launcher with journal prompts
- ✅ Small-group calibration session (live)
- ✅ Template Vault + Prompt Library (bonus)

**Payment Options:**
- Pay in full: $499
- 2-pay plan: $249.50 × 2 (same total, no discount)
- 3-pay plan: $166.33 × 3 (same total, no discount)

**Stripe Setup:**
```
Product: Vision Activation Intensive
Type: One-time payment
Price: $499
```

---

### Continuity: Vision Pro Annual (DEFAULT)

**Price:** $999/year (display as $83/month when billed annually)

**Positioning:** "Buy 10 months, get 2 free" vs. monthly

**What They Get:**
- ✅ **5,000,000 tokens granted immediately** (full year upfront)
- ✅ **100GB storage** (full quota day 1)
- ✅ Unlimited life visions
- ✅ VIVA assistant (unlimited conversations)
- ✅ Vibrational assessment
- ✅ Journal & vision board
- ✅ Audio generation
- ✅ PDF exports
- ✅ Actualization blueprints
- ✅ Priority support
- ✅ All future features

**Token Reset:** At renewal (365 days), balance resets to 5M

**Stripe Setup:**
```
Product: Vision Pro Annual
Type: Subscription
Billing: Every 365 days
Price: $999/year
Metadata: grants_tokens: 5000000, storage_gb: 100
```

---

### Continuity: Vision Pro 28-Day (Downsell)

**Price:** $99 every 28 days (13 cycles/year = $1,287 annually)

**Display As:** "$3.54/day" or "$24.75/week" (psychological anchoring)

**What They Get Per Cycle:**
- ✅ **375,000 tokens dripped** (on each billing)
- ✅ **25GB storage base** (expandable with add-ons)
- ✅ All Vision Pro features
- ✅ Standard support

**Token Rollover Rules:**
- ✅ Unused tokens roll over for **up to 3 cycles max**
- ✅ Maximum balance: 1,125,000 tokens (375k × 3)
- ✅ Excess tokens expire after 3 cycles
- ⚠️ Prevents hoarding, protects COGS

**Storage:**
- Base: 25GB
- Add-on: $9.99 per 10GB/month

**Stripe Setup:**
```
Product: Vision Pro 28-Day
Type: Subscription
Billing: Every 28 days
Price: $99
Metadata: drip_tokens: 375000, storage_gb: 25, rollover_max_cycles: 3
```

---

### Add-Ons: Token Packs (Overage Protection)

**Power Pack:** 2M tokens - $99  
**Mega Pack:** 5M tokens - $199  
**Ultra Pack:** 12M tokens - $399

**Auto Top-Up (New Feature):**
- Toggle in settings
- When balance < 20%, auto-purchase selected pack
- Keeps heavy users profitable (3-5x COGS markup)
- Prevents service interruption

---

## 📈 Revenue Comparison

### Current Model (Infinite)

| Plan | Price | First Year | Tokens | Storage |
|------|-------|------------|--------|---------|
| Monthly | $99/mo | $1,188 | Unlimited ⚠️ | Unlimited ⚠️ |
| Yearly | $777/yr | $777 | Unlimited ⚠️ | Unlimited ⚠️ |

**Problems:**
- No upfront qualifier
- Unlimited = uncontrolled COGS
- Lower cash collection
- 7-day trial = tire-kickers

---

### New Model (Hormozi)

| Entry | Continuity | First Year | Tokens | Storage |
|-------|------------|------------|--------|---------|
| $499 Intensive | Annual $999 | **$1,498** | 5M (controlled) | 100GB |
| $499 Intensive | 28-Day $99×13 | **$1,786** | 375k/cycle + rollover | 25GB |

**Wins:**
- ✅ +$721 to +$1,009 more revenue per customer year 1
- ✅ $499 upfront qualifies serious buyers
- ✅ Controlled COGS via dripping/quotas
- ✅ Annual default = higher cash collection
- ✅ 28-day billing = 13 charges instead of 12 (+8.3% revenue)

---

## 🎯 The 72-Hour Activation Intensive

### Strategy: Compress Time-To-Activation

**Goal:** Live in their vibration in 72 hours (3 days)

**Name:** "72-Hour Vision Activation Intensive"

**Promise:** "Vision drafted, board built, audios recorded, daily journal started—live in your routine within 72 hours"

---

### Delivery Blueprint

#### **Hour 0-1: Instant Start**
- ✅ Auto-schedule kickoff within 24 hours
- ✅ Unlock builder + "Vision Draft" prework
- ✅ Welcome email with checklist
- ✅ SMS: "Your 72-hour activation starts now"

#### **Hour 1-24: Draft + Build**
- ✅ 15-min intake form → AI generates first-draft vision
- ✅ AI analyzes responses and creates personalized affirmations
- ✅ 90-min guided builder session (self-guided or small-group live)
- ✅ Pre-built templates for all 12 life categories
- ✅ Vision Board builder with drag-drop templates
- ✅ Export PDF + save to account

#### **Hour 24-36: Record + Calibrate**
- ✅ 30-min live small-group calibration call
- ✅ Tighten language with VIVA assistant
- ✅ Generate 2 personalized Activation Audios:
  - Morning: 5-7 minutes (energizing, future-focused)
  - Evening: 8-10 minutes (reflective, gratitude)
- ✅ Load first 7 daily journal prompts (pre-written)

#### **Hour 36-72: Activate**
- ✅ **Activation Protocol:**
  - 2×/day audio (morning + evening)
  - 10-min journaling (with prompts)
  - 1 visual Vision Board review
- ✅ SMS/email reminders (2×/day for 7 days)
- ✅ 7-day streak tracker installed
- ✅ "Go/No-Go" checklist to confirm activation is live
- ✅ Day 7: Upsell to Annual with momentum

---

### Offer Stack (what they get in 72 hours)

**Core Deliverables:**
1. **Life Vision Draft + Final** ($497 value)  
   - AI-generated first draft
   - 12 life categories completed
   - PDF + app access

2. **Vision Board** ($297 value)  
   - Custom built with templates
   - Export to PNG/PDF
   - Desktop + mobile wallpaper

3. **Two Activation Audios** ($397 value)  
   - Personalized morning track (5-7 min)
   - Personalized evening track (8-10 min)
   - Nature overlays (rain, ocean, forest)

4. **7-Day Streak Launcher** ($197 value)  
   - Pre-written journal prompts
   - SMS + email reminders
   - Streak tracker with rewards

5. **Small-Group Calibration Session** ($197 value)  
   - Live 30-min call with coach
   - Language tightening
   - Q&A and refinement

**Bonuses:**
6. **Template Vault** ($147 value)  
   - 50+ pre-built vision templates
   - 100+ affirmation templates
   - Copy-paste ready

7. **Prompt Library** ($97 value)  
   - VIVA conversation starters
   - Journal prompts (30 days)
   - Reframe templates

**Total Stack Value:** $1,829  
**Your Investment:** $499

---

### Guarantee (Risk Reversal)

**Conditional "Activation in 72 Hours" Guarantee:**

"Complete the checklist (intake form, builder session, calibration call, start 7-day protocol) and if your activation isn't live within 72 hours, get a full refund on your Intensive OR apply it as a credit to Vision Pro Annual."

**Plus: 14-Day Unconditional Window**
- First 14 days: Full refund, no questions asked
- Stacks with the conditional guarantee

**Why This Works:**
- Action-based reduces refund-seekers
- "Or credit to Annual" converts refunds to upgrades
- 72-hour promise is operational, not aspirational

---

## 🏗️ Technical Implementation

### Database Changes Required

#### 1. New `membership_tiers` Table Updates

```sql
-- Update existing tier
UPDATE membership_tiers 
SET tier_type = 'vision_pro_annual',
    name = 'Vision Pro Annual',
    price_monthly = 999,
    billing_cycle = 'annual',
    viva_tokens_per_cycle = 5000000,
    storage_gb = 100,
    features = jsonb_build_array(
      '5M tokens granted immediately',
      '100GB storage',
      'Unlimited visions',
      'VIVA assistant',
      'Priority support',
      'All features'
    )
WHERE tier_type = 'infinite';

-- Add 28-day tier
INSERT INTO membership_tiers (
  tier_type,
  name,
  price_monthly,
  billing_cycle,
  viva_tokens_per_cycle,
  storage_gb,
  features,
  is_active
) VALUES (
  'vision_pro_28day',
  'Vision Pro 28-Day',
  99,
  '28_day',
  375000,
  25,
  jsonb_build_array(
    '375k tokens per cycle',
    '25GB storage',
    'Rollover up to 3 cycles',
    'All Vision Pro features'
  ),
  true
);
```

#### 2. Token Rollover Tracking

```sql
-- Add rollover columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN token_rollover_cycles INTEGER DEFAULT 0,
ADD COLUMN token_last_drip_date TIMESTAMP,
ADD COLUMN auto_topup_enabled BOOLEAN DEFAULT false,
ADD COLUMN auto_topup_pack_id TEXT,
ADD COLUMN storage_quota_gb INTEGER DEFAULT 100;

-- Create token drip tracking
CREATE TABLE token_drips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES customer_subscriptions(id),
  drip_amount INTEGER NOT NULL,
  drip_date TIMESTAMP DEFAULT NOW(),
  cycle_number INTEGER NOT NULL,
  rollover_from_previous INTEGER DEFAULT 0,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. Intensive Purchase Tracking

```sql
-- Track intensive purchases
CREATE TABLE intensive_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- 49900 (cents)
  payment_plan TEXT, -- 'full', '2pay', '3pay'
  installments_total INTEGER,
  installments_paid INTEGER DEFAULT 0,
  completion_status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  activation_deadline TIMESTAMP, -- 72 hours from purchase
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  CONSTRAINT valid_status CHECK (completion_status IN ('pending', 'in_progress', 'completed', 'refunded'))
);

-- Track intensive completion checklist
CREATE TABLE intensive_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intensive_id UUID REFERENCES intensive_purchases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Checklist items
  intake_completed BOOLEAN DEFAULT false,
  intake_completed_at TIMESTAMP,
  
  vision_drafted BOOLEAN DEFAULT false,
  vision_drafted_at TIMESTAMP,
  
  builder_session_completed BOOLEAN DEFAULT false,
  builder_session_completed_at TIMESTAMP,
  
  vision_board_created BOOLEAN DEFAULT false,
  vision_board_created_at TIMESTAMP,
  
  calibration_scheduled BOOLEAN DEFAULT false,
  calibration_attended BOOLEAN DEFAULT false,
  calibration_completed_at TIMESTAMP,
  
  audios_generated BOOLEAN DEFAULT false,
  audios_generated_at TIMESTAMP,
  
  activation_protocol_started BOOLEAN DEFAULT false,
  activation_started_at TIMESTAMP,
  
  streak_day_1 BOOLEAN DEFAULT false,
  streak_day_7_reached BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. Storage Quota Enforcement

```sql
-- Function to check storage quota
CREATE OR REPLACE FUNCTION check_storage_quota(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_quota_gb INTEGER;
  v_used_bytes BIGINT;
  v_used_gb NUMERIC;
  v_percentage NUMERIC;
  v_over_quota BOOLEAN;
BEGIN
  -- Get user's storage quota
  SELECT storage_quota_gb INTO v_quota_gb
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- Calculate current usage (from storage.objects)
  SELECT COALESCE(SUM(metadata->>'size')::BIGINT, 0) INTO v_used_bytes
  FROM storage.objects
  WHERE owner = p_user_id;
  
  v_used_gb := v_used_bytes / 1073741824.0; -- Convert to GB
  v_percentage := (v_used_gb / v_quota_gb) * 100;
  v_over_quota := v_used_gb > v_quota_gb;
  
  RETURN jsonb_build_object(
    'quota_gb', v_quota_gb,
    'used_gb', ROUND(v_used_gb, 2),
    'used_bytes', v_used_bytes,
    'percentage', ROUND(v_percentage, 1),
    'over_quota', v_over_quota,
    'remaining_gb', GREATEST(0, v_quota_gb - v_used_gb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Stripe Product Setup

#### Product 1: Vision Activation Intensive

```typescript
// Full payment
{
  name: "Vision Activation Intensive",
  description: "72-hour vision activation with personalized audios, board, and 7-day streak",
  default_price_data: {
    currency: "usd",
    unit_amount: 49900, // $499
  },
  metadata: {
    product_type: "intensive",
    payment_plan: "full",
  }
}

// 2-pay plan
{
  name: "Vision Activation Intensive (2-Pay Plan)",
  type: "service",
  default_price_data: {
    currency: "usd",
    unit_amount: 24950, // $249.50
    recurring: {
      interval: "month",
      interval_count: 1,
    },
    recurring_count: 2,
  },
  metadata: {
    product_type: "intensive",
    payment_plan: "2pay",
  }
}

// 3-pay plan
{
  name: "Vision Activation Intensive (3-Pay Plan)",
  type: "service",
  default_price_data: {
    currency: "usd",
    unit_amount: 16633, // $166.33
    recurring: {
      interval: "month",
      interval_count: 1,
    },
    recurring_count: 3,
  },
  metadata: {
    product_type: "intensive",
    payment_plan: "3pay",
  }
}
```

#### Product 2: Vision Pro Annual

```typescript
{
  name: "Vision Pro Annual",
  description: "5M tokens + 100GB storage granted immediately. All features included.",
  default_price_data: {
    currency: "usd",
    unit_amount: 99900, // $999
    recurring: {
      interval: "year",
    }
  },
  metadata: {
    product_type: "continuity",
    tier_type: "vision_pro_annual",
    grants_tokens: "5000000",
    storage_gb: "100",
    token_strategy: "grant_upfront",
  }
}
```

#### Product 3: Vision Pro 28-Day

```typescript
{
  name: "Vision Pro 28-Day",
  description: "375k tokens per cycle. Rollover up to 3 cycles. All features.",
  default_price_data: {
    currency: "usd",
    unit_amount: 9900, // $99
    recurring: {
      interval: "day",
      interval_count: 28,
    }
  },
  metadata: {
    product_type: "continuity",
    tier_type: "vision_pro_28day",
    drip_tokens: "375000",
    storage_gb: "25",
    token_strategy: "drip_per_cycle",
    rollover_max_cycles: "3",
  }
}
```

---

### Code Changes Required

#### 1. Webhook Updates (`src/app/api/stripe/webhook/route.ts`)

Add handling for:
- Intensive purchases (grant immediate access)
- 28-day subscription billing (drip tokens with rollover logic)
- Annual subscription (grant 5M tokens immediately)
- Auto top-up purchases

#### 2. Token Drip Function (`src/lib/tokens/token-drip.ts`)

```typescript
export async function dripTokensFor28DayCycle(userId: string) {
  // Check if user is on 28-day plan
  // Calculate rollover (max 3 cycles)
  // Add 375k tokens
  // Update drip tracking
  // Send notification if over quota
}

export async function checkAutoTopUp(userId: string) {
  // If balance < 20% and auto_topup_enabled
  // Create Stripe payment intent for selected pack
  // Grant tokens on success
}
```

#### 3. Storage Quota Middleware

```typescript
// Enforce storage quotas on upload
export async function checkStorageBeforeUpload(userId: string, fileSize: number) {
  const quota = await checkStorageQuota(userId)
  
  if (quota.over_quota) {
    throw new Error('Storage quota exceeded. Upgrade or free space.')
  }
  
  if (quota.used_bytes + fileSize > quota.quota_gb * 1024 * 1024 * 1024) {
    throw new Error('This upload would exceed your storage quota')
  }
  
  return true
}
```

#### 4. Intensive Onboarding Flow (REFINED)

**10-Step Journey** leveraging existing VibrationFit tools:

**Phase 1: Foundation (Hours 0-24)**
1. `/profile/edit?intensive=true` - Complete profile (personal info, goals, values)
2. `/assessment?intensive=true` - Take 4-step Vibration Assessment
3. `/intensive/schedule-call` - Book 1-on-1 Calibration Call

**Phase 2: Vision Creation (Hours 24-48)**
4. `/vision/build?intensive=true` - Build Life Vision with VIVA (existing flow)
5. `/intensive/refine-vision` - Refine Vision with VIVA clarifying questions

**Phase 3: Activation Tools (Hours 48-72)**
6. `/life-vision?intensive=true&action=audio` - Generate personalized vision audio
7. `/vision-board?intensive=true` - Create Vision Board (1 image per life area)
8. `/journal?intensive=true` - First Conscious Creation journal entry

**Phase 4: Calibration & Launch**
9. `/intensive/call-prep` - Attend Calibration Call (Zoom)
10. `/map` - My Activation Plan (MAP) & daily rituals

**Progress Tracker:** `/intensive/dashboard` - Shows countdown timer, completion status, next steps

---

## 📊 Fair-Use Policy

### Token Limits (Prevent Abuse)

**Daily Caps:**
- VIVA chat messages: 100/day
- Vision refinements: 10/day
- Audio generations: 5/day
- Image generations: 20/day
- Transcription minutes: 60/day

**Session Caps:**
- Max conversation length: 50 messages
- Max transcript upload: 2 hours
- Max single refinement: 200k tokens

**Throttling:**
- After hitting 80% of daily cap → show warning
- At 100% → soft block until next day
- Abuse (scripted, API hammering) → hard block + review

### Storage Limits

**Annual Plan:**
- Base: 100GB
- Add-on: $9.99 per 25GB (one-time)

**28-Day Plan:**
- Base: 25GB
- Add-on: $9.99 per 10GB/month

**Over-Quota Enforcement:**
- Warning at 90%
- Read-only at 100% (can view, can't upload)
- Must delete files or upgrade to continue

### Cancellation Terms

**Annual:**
- Access until term end (365 days from start)
- No refund after 14-day window
- Tokens expire at term end
- Storage goes read-only after term

**28-Day:**
- Next cycle stops when canceled
- Access until current period ends
- Tokens expire after grace period (7 days)
- Storage goes read-only if over quota

---

## 🎨 Messaging & Positioning

### Rename "Infinite" → "Vision Pro"

**Why:**
- "Infinite" invites abuse and sets wrong expectation
- "Pro" signals premium, professional, power-user
- Easier to enforce quotas and fair-use

### Display Pricing Psychology

**Annual ($999):**
- Display as: **"$83/month billed annually"**
- Or: **"Buy 10 months, get 2 free"**
- Badge: "Most Popular" or "Best Value"

**28-Day ($99 × 13 = $1,287):**
- Display as: **"$3.54/day"** or **"$24.75/week"**
- Note: "Billed every 4 weeks"
- Position as downsell

**Intensive ($499):**
- Display as: **"$499 to activate"** or **"Less than $7/day for 72-hour transformation"**
- Stack value: "$1,829 value for $499"

### Page Structure (New Pricing Page)

```
┌─────────────────────────────────────────────┐
│  72-Hour Vision Activation Intensive        │
│  $499 • Transform Your Reality in 3 Days    │
│  [See What's Included]                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Then Continue with Vision Pro              │
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ ANNUAL       │  │ 28-DAY       │        │
│  │ BEST VALUE   │  │              │        │
│  │              │  │              │        │
│  │ $999/year    │  │ $99 / 28days │        │
│  │ $83/month    │  │ $3.54/day    │        │
│  │              │  │              │        │
│  │ 5M tokens    │  │ 375k/cycle   │        │
│  │ 100GB        │  │ 25GB         │        │
│  │              │  │              │        │
│  │ [Default]    │  │ [Downsell]   │        │
│  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────┘
```

---

## 🚧 Implementation Roadmap

### Phase 1: Database & Backend (Week 1)
- [ ] Create new membership tier tables
- [ ] Add token rollover columns
- [ ] Create intensive tracking tables
- [ ] Build storage quota functions
- [ ] Write token drip logic
- [ ] Update webhook handlers

### Phase 2: Stripe Setup (Week 1-2)
- [ ] Create 3 intensive products (full, 2-pay, 3-pay)
- [ ] Create Vision Pro Annual product
- [ ] Create Vision Pro 28-Day product
- [ ] Configure 28-day billing cycle
- [ ] Test all payment flows
- [ ] Set up auto top-up products

### Phase 3: Frontend - Pricing Page (Week 2)
- [ ] Redesign `/pricing` with new structure
- [ ] Intensive section at top
- [ ] Annual as default, 28-day as downsell
- [ ] Display psychology (weekly/daily prices)
- [ ] Payment plan options for intensive
- [ ] "Vision Pro" branding throughout

### Phase 4: Intensive Onboarding Flow (Week 2-3)
- [x] `/intensive/dashboard` - Progress tracker with countdown & 10-step checklist
- [x] `/intensive/schedule-call` - Call scheduling interface
- [x] `/intensive/refine-vision` - Vision refinement with VIVA
- [x] `/intensive/call-prep` - Calibration call preparation
- [x] `/map` - My Activation Plan (MAP) & daily rituals
- [ ] Add `?intensive=true` query param handling to existing pages:
  - [ ] `/profile/edit` - Mark profile completion in checklist
  - [ ] `/assessment` - Mark assessment completion
  - [ ] `/vision/build` - Mark vision built
  - [ ] `/life-vision` - Mark audio generated when action=audio
  - [ ] `/vision-board` - Require 1 image per life area, mark completion
  - [ ] `/journal` - Mark first entry completion
- [ ] Automated email/SMS sequences for reminders
- [ ] Checklist tracking

### Phase 5: Token & Storage Management (Week 3-4)
- [ ] Token rollover enforcement (3 cycles max)
- [ ] Storage quota checks on upload
- [ ] Auto top-up toggle in settings
- [ ] Fair-use policy enforcement
- [ ] Read-only mode when over quota
- [ ] Daily cap warnings

### Phase 6: Guarantee & Support (Week 4)
- [ ] Conditional guarantee logic
- [ ] Refund or credit flow
- [ ] Checklist verification
- [ ] 48-hour activation tracking
- [ ] Support documentation
- [ ] Admin dashboard for intensive monitoring

### Phase 7: Migration & Launch (Week 5)
- [ ] Migrate existing "Infinite" users to "Vision Pro Annual"
- [ ] Grant 5M tokens to all annual users
- [ ] Email existing users about changes
- [ ] Update all marketing pages
- [ ] Publish fair-use policy
- [ ] Launch new pricing + intensive

---

## 💡 Key Business Metrics to Track

### Intensive Metrics
- Intensive purchase rate (%)
- Average time to complete checklist
- 72-hour activation success rate
- Calibration call attendance
- Refund/credit conversion rate

### Continuity Metrics
- Annual vs. 28-day selection (target 70% annual)
- Average tokens used per cycle
- Token rollover patterns
- Auto top-up adoption rate
- Churn by plan type

### COGS Tracking
- Avg monthly cost per annual user
- Avg cost per 28-day cycle
- % of users hitting daily caps
- Token pack attach rate
- Storage overage frequency

---

## 🎯 Success Criteria

### Revenue Goals
- ✅ 50%+ increase in first-year LTV ($1,498+ vs. $777-$1,188)
- ✅ 70%+ choose annual (better cash collection)
- ✅ 20%+ buy token packs (profitable overage)
- ✅ <20% monthly churn (vs. <25% current)

### COGS Goals
- ✅ Average AI cost <$20/month for annual users
- ✅ Average AI cost <$15/cycle for 28-day users
- ✅ 80%+ gross margin maintained
- ✅ <5% abuse rate (hitting daily caps repeatedly)

### Activation Goals
- ✅ 90%+ complete intake within 24 hours
- ✅ 80%+ complete full intensive within 72 hours
- ✅ 70%+ attend calibration call
- ✅ 60%+ start 7-day activation protocol

---

## ⚠️ Risks & Mitigations

### Risk 1: $499 Sticker Shock
**Mitigation:**
- Offer payment plans (2-pay, 3-pay)
- Show value stack ($1,829)
- 72-hour promise creates urgency
- Conditional guarantee reduces risk

### Risk 2: Existing Users Revolt
**Mitigation:**
- Grandfather existing annual users
- Grant 5M tokens to all immediately
- Communicate "same price, added value"
- Offer intensive at 50% off ($249) for existing users

### Risk 3: 28-Day Billing Complexity
**Mitigation:**
- Clear display: "Billed every 4 weeks"
- Show annual savings prominently
- Auto-reminder 3 days before charge
- Easy cancel, no surprises

### Risk 4: Operational Intensive Load
**Mitigation:**
- Start with 10 intensives/week max
- Small-group calibration (5-10 people)
- Pre-recorded builder videos
- AI-first, human-touch second

---

## 📚 References

**Alex Hormozi Sources:**
- $100M Playbook: Pricing (Pages 24, 28-29, 40-41)
- $100M Playbook: Retention (Pages 26-27)
- $100M Playbook: Proof Checklist (Page 10)
- $100M Offers (Pages 65, 97, 127, 140)
- $100M Leads (Page 59)
- $100M Money Models (Page 102)

---

## 🚀 Next Steps

### Immediate Actions (This Week)
1. **Review this guide** with your team
2. **Lock the naming:** "Vision Pro" and "72-Hour Vision Activation Intensive"
3. **Create Stripe products** (3 intensive + 2 continuity)
4. **Design pricing page mockup** (intensive + annual default)

### Short-Term (Weeks 1-2)
5. **Build database schema** (intensive tracking, token drip)
6. **Update webhooks** (28-day drip, annual grant)
7. **Create intake form** (Hour 0-1)
8. **Draft email/SMS sequences** (72-hour activation)

### Medium-Term (Weeks 3-4)
9. **Build intensive flow** (intake → builder → calibration → activate)
10. **Implement token rollover** (3-cycle max)
11. **Add storage quotas** (100GB annual, 25GB 28-day)
12. **Test end-to-end** (purchase → intensive → continuity)

### Launch (Week 5)
13. **Migrate existing users** to Vision Pro Annual
14. **Launch new pricing** publicly
15. **Run first intensive cohort** (10 people max)
16. **Monitor metrics** (activation rate, COGS, churn)

---

## 🛒 Guest Checkout Flow (Cold Traffic Conversion)

### The Problem We Solved
Cold users shouldn't have to create an account before purchasing. This creates friction and reduces conversion rates.

### The Solution: Guest Checkout + Magic Link
We implemented a seamless guest checkout flow that creates accounts **after** payment:

#### **Step-by-Step Flow (Dual Auto-Login + Magic Link):**

1. **User visits pricing page** (`/pricing-hormozi`)
   - No login required
   - Can browse and select payment plan

2. **User clicks "Start Your 72-Hour Activation"**
   - Goes directly to Stripe checkout
   - No authentication barrier

3. **User completes payment in Stripe**
   - Enters email and payment info
   - Stripe processes payment

4. **Webhook processes payment** (`checkout.session.completed`)
   - Creates user account in Supabase Auth
   - Generates magic link (sent to email as backup)
   - Creates `intensive_purchases` record
   - Creates `intensive_checklist` record with 72-hour deadline

5. **🚀 AUTO-LOGIN: User redirected to** `/auth/auto-login`
   - Automatically generates and verifies login token
   - Sets session cookies
   - **No email click required!**
   - Redirects to `/auth/setup-password?intensive=true`

6. **User sets password** (`/auth/setup-password`)
   - Creates secure password (8+ characters)
   - Confirms password
   - Account is now fully secured

7. **User redirected to** `/intensive/dashboard`
   - 72-hour countdown starts
   - Shows intensive progress
   - Ready to begin activation

#### **Backup Flow (If Auto-Login Fails):**

5b. **Fallback: User redirected to** `/intensive/check-email`
    - Shows "Check Your Email" page
    - Magic link sent to inbox

6b. **User clicks magic link in email**
    - Automatically logs in
    - Continues to password setup

### **Key Features:**

✅ **Zero friction** - No account creation before purchase  
✅ **Automatic account creation** - Webhook handles everything  
✅ **🚀 Instant auto-login** - No email click required (primary flow)  
✅ **Magic link backup** - Email fallback if auto-login fails  
✅ **Secure password setup** - User creates password after auto-login  
✅ **Seamless redirect** - Goes straight to password setup → intensive dashboard  
✅ **Dual redundancy** - Both auto-login AND magic link for reliability  

### **Technical Implementation:**

#### **API Route:** `/api/stripe/checkout-intensive`
- Allows guest checkout (no authentication required)
- Creates Stripe session with customer email
- Success URL: `/auth/auto-login?session_id={CHECKOUT_SESSION_ID}&email={CHECKOUT_SESSION_CUSTOMER_EMAIL}`

#### **Webhook Handler:** `/api/stripe/webhook`
- Detects `checkout.session.completed` for intensive purchases
- Creates user with `supabase.auth.admin.createUser()`
- Generates magic link with `supabase.auth.admin.generateLink()` (backup)
- Logs magic link URL for testing
- Creates intensive records in database

#### **Auto-Login Route:** `/auth/auto-login` (NEW!)
- Receives session_id and email from Stripe redirect
- Generates fresh magic link for the user
- Extracts token and verifies it
- Sets session cookies (access_token + refresh_token)
- Redirects to `/auth/setup-password?intensive=true`
- **Fallback:** If any step fails, redirects to `/intensive/check-email`

#### **Password Setup Page:** `/auth/setup-password`
- Validates user is logged in (via auto-login or magic link)
- Allows user to set password
- Redirects to intensive dashboard after setup

#### **Check Email Page:** `/intensive/check-email` (Backup)
- Shows success message after payment
- Explains magic link process
- Provides step-by-step instructions
- Only shown if auto-login fails

### **Why This Works:**

1. **Higher Conversion** - No signup friction before purchase
2. **Better UX** - Pay first, set up account second
3. **Secure** - Magic link ensures email ownership
4. **Professional** - Matches best-in-class SaaS onboarding
5. **Scalable** - Works for cold traffic at scale

---

**This is a complete transformation.** The $499 intensive qualifies buyers, the 28-day billing increases revenue 8.3%, and the dripped tokens protect your margins. Combined with the 72-hour activation promise and frictionless guest checkout, you're selling speed + results, not just software.

**Want to start building? Let's begin with Phase 1 database changes.**


