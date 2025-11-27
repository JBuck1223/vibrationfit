# CRM Architecture - Data Model

**Last Updated:** November 26, 2024

## Core Understanding

VibrationFit's CRM tracks **auth users** (actual accounts), not profile iterations.

### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `auth.users` | **Actual user accounts** | `id`, `email`, `created_at`, `last_sign_in_at` |
| `user_profiles` | **Iterative profiles** (users can have multiple versions) | `user_id`, `first_name`, `last_name`, `is_active`, `version_number` |
| `customer_subscriptions` | Stripe subscription data | `user_id`, `membership_tier_id`, `status` |
| `membership_tiers` | Subscription plans | `name`, `tier_type`, `price_monthly` |
| `user_activity_metrics` | CRM tracking data | `user_id`, `vision_count`, `last_login_at`, `engagement_status` |
| `user_revenue_metrics` | Revenue tracking | `user_id`, `mrr`, `ltv`, `total_spent` |

---

## Data Flow

### For CRM Member List:

```sql
1. Query auth.users (get all accounts)
2. JOIN user_profiles WHERE is_active = true (get active profile name/phone)
3. JOIN customer_subscriptions WHERE status IN ('active', 'trialing')
4. JOIN membership_tiers (get tier name)
5. JOIN user_activity_metrics (get engagement data)
6. JOIN user_revenue_metrics (get revenue data)
```

### Example Query:

```typescript
// Get auth users
const { data: authUsers } = await supabase.auth.admin.listUsers()

// Get active profiles
const profiles = await supabase
  .from('user_profiles')
  .select('user_id, first_name, last_name, phone')
  .eq('is_active', true)

// Get subscriptions with tier
const subscriptions = await supabase
  .from('customer_subscriptions')
  .select('user_id, status, membership_tiers(name)')
  .in('status', ['active', 'trialing'])

// Combine...
```

---

## Important Notes

✅ **DO:**
- Query `auth.users` for user accounts
- Use `user_profiles` WHERE `is_active = true` for current name
- Use `customer_subscriptions` for subscription data

❌ **DON'T:**
- Query `user_profiles` as your main member list (it's for iterations!)
- Assume `full_name` exists (combine `first_name` + `last_name`)
- Assume `subscription_tier` is in `user_profiles` (it's in `customer_subscriptions` → `membership_tiers`)

---

## CRM Tables Created by Migration

The `20251126000000_create_crm_system.sql` migration creates:

- `user_activity_metrics` - Tracks usage (visions, logins, storage)
- `user_revenue_metrics` - Tracks revenue (MRR, LTV)  
- `marketing_campaigns` - Campaign tracking
- `leads` - Lead management
- `support_tickets` + `support_ticket_replies` - Support system
- `sms_messages` - SMS communication tracking

These all reference `auth.users.id` as the `user_id`.

---

## Next Steps

1. Run the CRM migration
2. Verify tables exist
3. Test member list API
4. Build background job to populate metrics from existing data

