# Member Success System Guide

**Last Updated:** November 26, 2024  
**Status:** Active

## Overview

The Member Success system tracks member activity, engagement, and health to help you proactively manage retention and growth.

---

## Pages Built

### 1. CRM Dashboard (`/admin/crm/dashboard`)

**Purpose:** High-level overview of your business metrics

**Metrics Displayed:**
- Total members, active, at-risk, churned
- Total MRR (Monthly Recurring Revenue)
- Lead conversion rate
- Open support tickets

**Key Feature:** Manual "Refresh Metrics" button to recalculate all user activity data

---

### 2. Member List (`/admin/crm/members`)

**Purpose:** Table view of all members with filtering

**Features:**
- Sortable table with key metrics
- Filter by engagement status (active, at-risk, champion, inactive)
- Shows: Name, email, tier, status, visions, last login, MRR
- Click any row to view full member details
- Mobile responsive with horizontal scroll

**Actions:**
- Click "Kanban View" to switch to board layout
- Click any member to see full intelligence page

---

### 3. Member Detail (`/admin/crm/members/[id]`)

**Purpose:** Complete member intelligence with 6 tabs

**Overview Tab:**
- Quick stats (visions, logins, MRR)
- Manual classification form:
  - Engagement status (active, at-risk, champion, inactive)
  - Health status (healthy, needs_attention, churned)
  - Custom tags
  - Admin notes

**Activity Tab:**
- Total logins
- Last login date
- Days since last login (color-coded: green < 7d, yellow < 14d, red > 14d)
- Member since date

**Features Tab:**
- Profile completion %
- Life visions (count + refinements)
- Vision audio generated
- Journal entries
- Vision board images
- Storage usage (files + MB)

**Revenue Tab:**
- Subscription tier & status
- MRR (Monthly Recurring Revenue)
- LTV (Lifetime Value)
- Total spent
- Months subscribed
- Token usage

**Messages Tab:**
- Full SMS conversation thread
- Visual chat bubbles (outbound in green, inbound in gray)
- Send new SMS directly from page

**Support Tab:**
- All support tickets for this member
- Click to open ticket in new tab

**Quick Actions:**
- 📱 Text (opens SMS composer)
- ✉️ Email (opens mailto link)

---

### 4. Member Kanban Board (`/admin/crm/members/board`)

**Purpose:** Visual pipeline management with flexible grouping

**Grouping Options:**
- **Engagement Status:** Active → Champion → At Risk → Inactive
- **Health Status:** Healthy → Needs Attention → Churned
- **Subscription Tier:** Free → Solo → Household → Intensive

**Features:**
- Drag-and-drop to change status
- Each card shows:
  - Name & email
  - Tier badge (if not grouped by tier)
  - Vision count
  - Days since last login (color-coded)
  - MRR (if > $0)
- Click any card to view full details
- Mobile responsive

---

## Data Tracking

### Activity Metrics Table (`user_activity_metrics`)

**Auto-calculated metrics:**
- `profile_completion_percent` - % of profile fields filled
- `vision_count` - Total life visions created
- `vision_refinement_count` - Total refinements made
- `audio_generated_count` - Vision audios generated
- `journal_entry_count` - Daily paper entries
- `vision_board_image_count` - Images uploaded to boards
- `last_login_at` - Last login timestamp
- `total_logins` - Total login count
- `days_since_last_login` - Days since last activity
- `s3_file_count` - Files in storage
- `total_storage_mb` - Storage used in MB
- `tokens_used` - Tokens consumed
- `tokens_remaining` - Tokens left

**Manual fields (you set these):**
- `engagement_status` - active | at_risk | champion | inactive
- `health_status` - healthy | needs_attention | churned
- `custom_tags` - Array of tags you add
- `admin_notes` - Your private notes

---

### Revenue Metrics Table (`user_revenue_metrics`)

**Synced from Stripe:**
- `subscription_tier` - Current tier
- `subscription_status` - active | trialing | inactive
- `mrr` - Monthly recurring revenue
- `ltv` - Lifetime value
- `total_spent` - Total payments received
- `subscription_start_date` - When they first subscribed
- `months_subscribed` - How long they've been paying

---

## Background Jobs

### Update Activity Metrics

**File:** `/src/lib/jobs/update-activity-metrics.ts`

**What it does:**
- Queries all user tables (visions, audio, journal, etc.)
- Calculates activity metrics
- Updates `user_activity_metrics` table

**How to run:**

**Manual (via admin dashboard):**
1. Go to `/admin/crm/dashboard`
2. Click "🔄 Refresh Metrics" button
3. Confirm the action
4. Wait for completion

**Via API:**
```bash
curl -X POST https://vibrationfit.com/api/crm/metrics/update \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Via CLI:**
```bash
cd /Users/jordanbuckingham/Desktop/vibrationfit
npm run tsx src/lib/jobs/update-activity-metrics.ts
```

**Recommended schedule:** Daily cron job (midnight)

---

### Sync Revenue Metrics

**File:** `/src/lib/jobs/sync-revenue-metrics.ts`

**What it does:**
- Connects to Stripe API
- Fetches subscription data
- Calculates MRR, LTV
- Updates `user_revenue_metrics` table

**How to run:**

**Via CLI:**
```bash
npm run tsx src/lib/jobs/sync-revenue-metrics.ts
```

**Recommended schedule:** Daily cron job (after activity metrics)

---

## Workflows

### Identifying At-Risk Members

1. Go to `/admin/crm/members/board`
2. Group by "Health Status"
3. Look at "Needs Attention" column
4. Or filter by:
   - `days_since_last_login > 14`
   - `vision_count = 0`
   - `engagement_status = "at_risk"`

### Reaching Out to Champions

1. Filter members by `engagement_status = "champion"`
2. Click into their detail page
3. Review their feature usage
4. Send them a thank you message via SMS
5. Add tag: "testimonial_candidate"

### Supporting New Users

1. Filter members where `created_at < 7 days ago`
2. Check if `vision_count = 0`
3. Reach out via SMS with onboarding help
4. Add note: "Sent onboarding help"

### Upgrade Opportunities

1. Go to board, group by "Subscription Tier"
2. Look for Free tier users with:
   - High vision count (3+)
   - Active engagement status
   - Recent logins
3. Send upgrade offer via SMS
4. Tag: "upgrade_target"

---

## Database Schema Reference

### user_activity_metrics

```sql
CREATE TABLE user_activity_metrics (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  
  -- Feature usage
  profile_completion_percent INTEGER DEFAULT 0,
  vision_count INTEGER DEFAULT 0,
  vision_refinement_count INTEGER DEFAULT 0,
  audio_generated_count INTEGER DEFAULT 0,
  journal_entry_count INTEGER DEFAULT 0,
  vision_board_image_count INTEGER DEFAULT 0,
  
  -- Login activity
  last_login_at TIMESTAMPTZ,
  total_logins INTEGER DEFAULT 0,
  days_since_last_login INTEGER,
  
  -- Storage
  s3_file_count INTEGER DEFAULT 0,
  total_storage_mb DECIMAL(10,2) DEFAULT 0,
  
  -- Tokens
  tokens_used INTEGER DEFAULT 0,
  tokens_remaining INTEGER DEFAULT 0,
  
  -- Manual classification
  engagement_status TEXT CHECK (engagement_status IN ('active', 'at_risk', 'champion', 'inactive')),
  health_status TEXT CHECK (health_status IN ('healthy', 'needs_attention', 'churned')),
  custom_tags TEXT[],
  admin_notes TEXT,
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_revenue_metrics

```sql
CREATE TABLE user_revenue_metrics (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  
  subscription_tier TEXT,
  subscription_status TEXT,
  mrr DECIMAL(10,2) DEFAULT 0,
  ltv DECIMAL(10,2) DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  
  subscription_start_date DATE,
  months_subscribed INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Next Steps

### To Get Started:

1. **Run the migration:**
   ```bash
   cd /Users/jordanbuckingham/Desktop/vibrationfit
   npx supabase migration up
   ```

2. **Update metrics for the first time:**
   - Visit `/admin/crm/dashboard`
   - Click "🔄 Refresh Metrics"
   - This will populate all member data

3. **Explore your members:**
   - Visit `/admin/crm/members` to see the list
   - Click into a few members to see their full profiles
   - Try the Kanban board view at `/admin/crm/members/board`

4. **Set up daily cron:**
   ```bash
   # Add to your cron (crontab -e)
   0 0 * * * cd /path/to/vibrationfit && npm run tsx src/lib/jobs/update-activity-metrics.ts
   0 1 * * * cd /path/to/vibrationfit && npm run tsx src/lib/jobs/sync-revenue-metrics.ts
   ```

### Optional Enhancements (Later):

- **Auto-scoring:** Add formula-based engagement scores (we skipped this for simplicity)
- **Email automation:** Trigger emails based on engagement status changes
- **Custom segments:** Add more grouping options to Kanban
- **Analytics reports:** Build custom dashboards for retention, churn, etc.
- **Alerts:** Notify when members become at-risk

---

## FAQ

**Q: When should I update metrics?**  
A: Daily is sufficient for most use cases. You can also manually trigger after major events (new features launched, marketing campaigns).

**Q: Can I customize the status lists?**  
A: Yes! Edit the database CHECK constraints in the migration file, and update the column definitions in the Kanban pages.

**Q: What if a member has no activity data?**  
A: The metrics job will create a record with zeros. You can then manually classify them based on your knowledge.

**Q: How do I export member data?**  
A: Use the Supabase dashboard to export the `user_activity_metrics` and `user_revenue_metrics` tables as CSV.

---

## Files Created

- `/src/app/api/crm/members/route.ts` - Member list API
- `/src/app/api/crm/members/[id]/route.ts` - Member detail/update API
- `/src/app/api/crm/metrics/update/route.ts` - Metrics refresh API
- `/src/app/admin/crm/dashboard/page.tsx` - CRM dashboard
- `/src/app/admin/crm/members/page.tsx` - Member list page
- `/src/app/admin/crm/members/[id]/page.tsx` - Member detail page
- `/src/app/admin/crm/members/board/page.tsx` - Member Kanban board
- `/src/lib/jobs/update-activity-metrics.ts` - Activity metrics calculator
- `/src/lib/jobs/sync-revenue-metrics.ts` - Revenue metrics sync

---

**You now have a complete Member Success system!** 🎉




