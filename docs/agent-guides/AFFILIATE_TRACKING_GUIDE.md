# 🎯 Affiliate & Promo Code Tracking Guide

**Last Updated:** December 13, 2025  
**Status:** Active  
**Related:** Activation Intensive, Stripe Integration

---

## 📊 Overview

The system now tracks promo codes, referral sources, and campaigns for every intensive purchase. This enables:
- ✅ Affiliate commission tracking
- ✅ Marketing campaign ROI analysis
- ✅ Partner performance metrics
- ✅ A/B testing different promo codes

---

## 🔗 URL Parameters

### Basic Promo Code
```
https://vibrationfit.com/?promo=FREEINTENSIVE#pricing
```

### With Affiliate Tracking
```
https://vibrationfit.com/?promo=BETA2024&ref=partner_john#pricing
```

### Full Tracking (Recommended)
```
https://vibrationfit.com/?promo=LAUNCH100&ref=partner_sarah&campaign=holiday_2024#pricing
```

### All Supported Parameters

| Parameter | Aliases | Purpose | Example |
|-----------|---------|---------|---------|
| `promo` | - | Promo/coupon code | `FREEINTENSIVE` |
| `ref` | `source`, `affiliate` | Affiliate/partner ID | `partner_john` |
| `campaign` | `utm_campaign` | Campaign name | `holiday_2024` |
| `continuity` | - | Pre-select plan | `annual` or `28day` |

---

## 💾 Database Storage

### Schema

```sql
-- intensive_purchases table
CREATE TABLE intensive_purchases (
  id UUID PRIMARY KEY,
  user_id UUID,
  amount INTEGER,
  payment_plan TEXT,
  
  -- Tracking fields
  promo_code TEXT,           -- e.g., 'FREEINTENSIVE', 'BETA2024'
  referral_source TEXT,      -- e.g., 'partner_john', 'facebook_ad'
  campaign_name TEXT,        -- e.g., 'Beta Launch 2024', 'Holiday Sale'
  
  created_at TIMESTAMP
);
```

### Indexes

```sql
-- Fast lookups by promo code
CREATE INDEX idx_intensive_purchases_promo_code 
ON intensive_purchases(promo_code) WHERE promo_code IS NOT NULL;

-- Fast lookups by referral source
CREATE INDEX idx_intensive_purchases_referral_source 
ON intensive_purchases(referral_source) WHERE referral_source IS NOT NULL;
```

---

## 📈 Analytics Queries

### 1. Promo Code Performance

```sql
-- See which promo codes are converting
SELECT 
  promo_code,
  COUNT(*) as total_uses,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_order_value,
  COUNT(CASE WHEN amount = 0 THEN 1 END) as free_uses,
  COUNT(CASE WHEN amount > 0 THEN 1 END) as paid_uses
FROM intensive_purchases
WHERE promo_code IS NOT NULL
GROUP BY promo_code
ORDER BY total_uses DESC;
```

**Example Output:**
```
promo_code      | total_uses | total_revenue | avg_order_value | free_uses | paid_uses
----------------|------------|---------------|-----------------|-----------|----------
FREEINTENSIVE   | 47         | $0            | $0              | 47        | 0
BETA2024        | 32         | $0            | $0              | 32        | 0
LAUNCH50        | 18         | $4,491        | $249.50         | 0         | 18
```

### 2. Affiliate Performance

```sql
-- See which affiliates are driving conversions
SELECT 
  referral_source,
  COUNT(*) as total_conversions,
  SUM(amount) as total_revenue,
  COUNT(DISTINCT promo_code) as unique_promo_codes,
  ARRAY_AGG(DISTINCT promo_code) as promo_codes_used
FROM intensive_purchases
WHERE referral_source IS NOT NULL
GROUP BY referral_source
ORDER BY total_conversions DESC;
```

**Example Output:**
```
referral_source | total_conversions | total_revenue | unique_promo_codes | promo_codes_used
----------------|-------------------|---------------|--------------------|------------------
partner_john    | 23                | $11,477       | 2                  | {BETA2024, LAUNCH50}
partner_sarah   | 15                | $7,485        | 1                  | {VIPACCESS}
facebook_ad     | 8                 | $3,992        | 1                  | {LAUNCH50}
```

### 3. Campaign Performance

```sql
-- See which campaigns are most effective
SELECT 
  campaign_name,
  COUNT(*) as total_conversions,
  SUM(amount) as total_revenue,
  COUNT(DISTINCT referral_source) as unique_affiliates,
  AVG(amount) as avg_order_value
FROM intensive_purchases
WHERE campaign_name IS NOT NULL
GROUP BY campaign_name
ORDER BY total_revenue DESC;
```

### 4. Combined Attribution Report

```sql
-- Full attribution breakdown
SELECT 
  promo_code,
  referral_source,
  campaign_name,
  COUNT(*) as conversions,
  SUM(amount) as revenue,
  MIN(created_at) as first_use,
  MAX(created_at) as last_use
FROM intensive_purchases
WHERE promo_code IS NOT NULL 
   OR referral_source IS NOT NULL 
   OR campaign_name IS NOT NULL
GROUP BY promo_code, referral_source, campaign_name
ORDER BY conversions DESC;
```

### 5. Time-Based Analysis

```sql
-- Conversions by promo code over time
SELECT 
  DATE_TRUNC('day', created_at) as date,
  promo_code,
  COUNT(*) as conversions,
  SUM(amount) as revenue
FROM intensive_purchases
WHERE promo_code IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), promo_code
ORDER BY date DESC, conversions DESC;
```

---

## 🎁 Affiliate Program Setup

### Example: Partner Program

**1. Create Unique Links for Each Partner:**

```
Partner John:
https://vibrationfit.com/?promo=PARTNER_JOHN&ref=partner_john&campaign=partner_program#pricing

Partner Sarah:
https://vibrationfit.com/?promo=PARTNER_SARAH&ref=partner_sarah&campaign=partner_program#pricing
```

**2. Create Stripe Coupons:**

```
Stripe Dashboard → Coupons:
- PARTNER_JOHN: 50% off (or 100% for beta)
- PARTNER_SARAH: 50% off (or 100% for beta)
```

**3. Track Performance:**

```sql
-- Partner John's performance
SELECT 
  COUNT(*) as total_conversions,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_order
FROM intensive_purchases
WHERE referral_source = 'partner_john';
```

**4. Calculate Commissions:**

```sql
-- 20% commission example
SELECT 
  referral_source as partner,
  COUNT(*) as conversions,
  SUM(amount) as total_revenue,
  SUM(amount) * 0.20 as commission_owed
FROM intensive_purchases
WHERE referral_source LIKE 'partner_%'
  AND created_at >= '2024-12-01'
  AND created_at < '2025-01-01'
GROUP BY referral_source;
```

---

## 🔍 Admin Dashboard Queries

### Quick Stats for Admin Panel

```sql
-- Overall promo code stats
SELECT 
  COUNT(DISTINCT promo_code) as total_promo_codes,
  COUNT(DISTINCT referral_source) as total_affiliates,
  COUNT(DISTINCT campaign_name) as total_campaigns,
  COUNT(*) as total_tracked_purchases,
  SUM(amount) as total_tracked_revenue
FROM intensive_purchases
WHERE promo_code IS NOT NULL 
   OR referral_source IS NOT NULL 
   OR campaign_name IS NOT NULL;
```

### Top Performers (Last 30 Days)

```sql
-- Top promo codes
SELECT 
  promo_code,
  COUNT(*) as uses,
  SUM(amount) as revenue
FROM intensive_purchases
WHERE promo_code IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY promo_code
ORDER BY uses DESC
LIMIT 10;

-- Top affiliates
SELECT 
  referral_source,
  COUNT(*) as conversions,
  SUM(amount) as revenue
FROM intensive_purchases
WHERE referral_source IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY referral_source
ORDER BY conversions DESC
LIMIT 10;
```

---

## 🎯 Use Cases

### 1. Beta Program Tracking

```
Link: ?promo=BETA2024&ref=beta_list&campaign=beta_launch
```

Track:
- How many beta users signed up
- Which beta users converted to paid
- Beta program ROI

### 2. Influencer Partnerships

```
Link: ?promo=INFLUENCER_NAME&ref=influencer_name&campaign=influencer_q1_2024
```

Track:
- Each influencer's conversion rate
- Calculate commissions automatically
- Compare influencer performance

### 3. Paid Advertising

```
Facebook: ?promo=LAUNCH50&ref=facebook_ad&campaign=fb_retargeting
Google: ?promo=LAUNCH50&ref=google_ad&campaign=google_search
```

Track:
- Which ad platform converts better
- ROI per platform
- Campaign performance

### 4. Email Campaigns

```
Newsletter: ?promo=EMAIL20&ref=newsletter&campaign=weekly_newsletter
Abandoned Cart: ?promo=COMEBACK&ref=abandoned_cart&campaign=cart_recovery
```

Track:
- Email campaign effectiveness
- Abandoned cart recovery rate
- Segment performance

---

## 🚀 Best Practices

### 1. Naming Conventions

**Promo Codes:**
- `FREEINTENSIVE` - General free access
- `BETA2024` - Beta program
- `PARTNER_NAME` - Partner-specific
- `LAUNCH50` - Campaign-specific
- `Q1SALE` - Time-based

**Referral Sources:**
- `partner_firstname` - Partner/affiliate
- `facebook_ad` - Paid advertising
- `email_campaign` - Email marketing
- `organic_social` - Social media
- `direct` - Direct traffic

**Campaign Names:**
- `beta_launch_2024` - Program launches
- `holiday_sale_2024` - Seasonal campaigns
- `partner_program_q1` - Partner programs
- `influencer_campaign` - Influencer marketing

### 2. URL Structure

**Recommended format:**
```
https://vibrationfit.com/?promo=CODE&ref=SOURCE&campaign=CAMPAIGN#pricing
```

**Keep it clean:**
- Use lowercase with underscores
- Keep codes memorable and short
- Use consistent naming patterns

### 3. Testing

**Always test your tracking links:**

```bash
# Test link
curl -I "https://vibrationfit.com/?promo=TEST&ref=test_source&campaign=test"

# Check database after purchase
SELECT promo_code, referral_source, campaign_name 
FROM intensive_purchases 
WHERE user_id = 'test_user_id';
```

---

## 📊 Reporting Dashboard Ideas

### Key Metrics to Display

1. **Promo Code Leaderboard**
   - Top 10 codes by conversions
   - Revenue per code
   - Free vs paid breakdown

2. **Affiliate Performance**
   - Conversions per affiliate
   - Revenue per affiliate
   - Commission owed

3. **Campaign ROI**
   - Cost per acquisition (if tracked)
   - Revenue per campaign
   - Conversion rate

4. **Time Series**
   - Daily/weekly conversions by source
   - Trend analysis
   - Seasonal patterns

---

## 🔐 Privacy & Compliance

**Important Notes:**
- ✅ Promo codes and referral sources are stored
- ✅ No PII (personally identifiable information) in tracking params
- ✅ GDPR compliant (business data, not personal data)
- ✅ Transparent to users (visible in URL)

**Don't track:**
- ❌ User names in URLs
- ❌ Email addresses in URLs
- ❌ Phone numbers in URLs

**Do track:**
- ✅ Partner IDs (`partner_john`)
- ✅ Campaign names (`holiday_2024`)
- ✅ Traffic sources (`facebook_ad`)

---

## 🎉 Summary

**What's Tracked:**
1. ✅ Promo code used (e.g., `FREEINTENSIVE`)
2. ✅ Referral source (e.g., `partner_john`)
3. ✅ Campaign name (e.g., `beta_launch`)

**Where It's Stored:**
- `intensive_purchases.promo_code`
- `intensive_purchases.referral_source`
- `intensive_purchases.campaign_name`

**How to Use:**
1. Create unique links with tracking params
2. Share with partners/campaigns
3. Run analytics queries to see performance
4. Calculate commissions/ROI
5. Optimize based on data

**Next Steps:**
1. Run migration: `npx supabase db push`
2. Create your first tracked link
3. Test a purchase
4. Run analytics queries
5. Build admin dashboard (optional)

---

**You now have full affiliate tracking! 🚀**

