# Migration Status Summary

Generated: November 15, 2025

---

## ✅ Question 1: Pull Production - Does it show as one big SQL dump?

### Answer: **YES!**

When you run:
```bash
./scripts/database/pull-production.sh
# OR
supabase db pull
```

It creates **ONE SINGLE FILE** containing your ENTIRE production schema:

```
supabase/migrations/20251115HHMMSS_remote_schema.sql
```

This file will contain:
- All tables (CREATE TABLE statements)
- All columns
- All indexes
- All RLS policies
- All functions
- All triggers
- **Everything** currently in production

**It's a complete snapshot, not individual changes.**

### Example:

If production has 50 tables and 200 policies, you get ONE file with all 50 tables and all 200 policies, not 250 separate files.

**See full explanation:** `docs/PULL_VS_MIGRATIONS_EXPLAINED.md`

---

## ⚠️ Question 2: Which migrations haven't been run yet?

### Answer: You have **16 migrations NOT yet in production**

### Already in Production (✅ LIVE):

```
✓ 20250105000000_create_user_profiles.sql
✓ 20250111000000_create_assessment_tables.sql
✓ 20250112000000_create_billing_system.sql
```

These 3 migrations are **already applied and running in production**.

### NOT in Production (⚠️ Pending):

```
○ 20251110000000_create_daily_papers_table.sql
○ 20251112000000_baseline_current_production.sql
○ 20251112000000_create_households.sql ⚠️ DUPLICATE!
○ 20251112000001_add_household_to_profiles.sql
○ 20251112000002_create_households_revised.sql
○ 20251112000003_remove_status_field.sql
○ 20251114000000_cleanup_user_profiles.sql
○ 20251114000002_simplify_to_transactions_only.sql
○ 20251114000003_fix_household_members_rls.sql
○ 20251115000000_create_ai_model_pricing.sql
○ 20251115000001_integrate_cost_tracking.sql
○ 20251115000002_add_membership_tier_enum_values.sql ⚠️ DUPLICATE!
○ 20251115000002_upgrade_membership_tiers.sql ⚠️ DUPLICATE!
○ 20251115000003_upgrade_membership_tiers.sql
○ 20251115000004_fix_viva_terminology.sql
○ 20251115000005_update_grant_functions_use_membership_tiers.sql
```

These 16 migrations exist in your local folder but **have NOT been pushed to production yet**.

---

## 🚨 Critical Issue: Duplicate Timestamps

You have **2 sets of duplicate timestamps**:

### Duplicate #1: `20251112000000`
```
- 20251112000000_baseline_current_production.sql
- 20251112000000_create_households.sql
```

### Duplicate #2: `20251115000002`
```
- 20251115000002_add_membership_tier_enum_values.sql
- 20251115000002_upgrade_membership_tiers.sql
```

**Why this matters:** Migrations must have unique timestamps. Supabase tracks them by timestamp, so duplicates cause conflicts.

**What to do:**
1. Decide which migrations to keep
2. Rename or delete the duplicates
3. Ensure all timestamps are unique

---

## 🎯 Recommended Actions

### Step 1: Check Your Migration Status Anytime

```bash
./scripts/database/show-migration-status.sh
```

This shows:
- What's in production (Remote column)
- What's local only (Local column)
- Duplicate timestamp issues

### Step 2: Fix Duplicate Timestamps

You need to rename or delete the duplicate files:

**Option A: Delete if obsolete**
```bash
# If you don't need these migrations anymore
rm supabase/migrations/20251112000000_baseline_current_production.sql
rm supabase/migrations/20251115000002_add_membership_tier_enum_values.sql
```

**Option B: Rename with new timestamp**
```bash
# If you need both, create fresh migrations with unique timestamps
supabase migration new baseline_current_production
# Copy content from old file to new
# Delete old file
```

### Step 3: Decide What to Push

Before pushing, ask yourself:

**Do you want to push ALL 16 pending migrations?**

- ✅ **If YES:** Fix duplicates, test locally, then push
- ❌ **If NO:** Delete/archive the ones you don't want to run

**Example: Delete unwanted migration**
```bash
# Move to archive if you don't want to run it
mkdir -p supabase/migrations/archive
mv supabase/migrations/20251110000000_create_daily_papers_table.sql supabase/migrations/archive/
```

### Step 4: Test Everything Locally

```bash
# This will run ALL local migrations
supabase db reset

# Check if it works
open http://127.0.0.1:54323
```

### Step 5: Push to Production

```bash
# Push all pending migrations
./scripts/database/push-migration.sh
```

---

## 📊 Visual Summary

```
PRODUCTION (Remote):
├── 20250105000000 ✅ LIVE
├── 20250111000000 ✅ LIVE
└── 20250112000000 ✅ LIVE

LOCAL (Not in Production):
├── 20251110000000 ⚠️ Pending
├── 20251112000000 ⚠️ Pending (DUPLICATE!)
├── 20251112000000 ⚠️ Pending (DUPLICATE!)
├── 20251112000001 ⚠️ Pending
├── 20251112000002 ⚠️ Pending
├── 20251112000003 ⚠️ Pending
├── 20251114000000 ⚠️ Pending
├── 20251114000002 ⚠️ Pending
├── 20251114000003 ⚠️ Pending
├── 20251115000000 ⚠️ Pending
├── 20251115000001 ⚠️ Pending
├── 20251115000002 ⚠️ Pending (DUPLICATE!)
├── 20251115000002 ⚠️ Pending (DUPLICATE!)
├── 20251115000003 ⚠️ Pending
├── 20251115000004 ⚠️ Pending
└── 20251115000005 ⚠️ Pending
```

---

## 💡 Quick Commands

```bash
# See migration status
./scripts/database/show-migration-status.sh

# Pull production (creates ONE big dump)
./scripts/database/pull-production.sh

# Test all local migrations
supabase db reset

# Push to production
./scripts/database/push-migration.sh

# Open Studio
open http://127.0.0.1:54323
```

---

## ❓ FAQ

### Q: Should I push all 16 migrations at once?

**A:** Only if you want all those changes in production. Review each one first.

### Q: What if I don't want some of these migrations?

**A:** Move them to an archive folder or delete them before pushing.

### Q: What's the `baseline_current_production` migration?

**A:** Looks like someone tried to create a snapshot of production. If you pull, you'll get a fresh snapshot anyway.

### Q: Should I pull before pushing?

**A:** YES! Always pull first to sync with production:
```bash
./scripts/database/pull-production.sh
```

This ensures your local is up-to-date before adding more changes.

---

## 🚀 Next Steps

1. **Fix duplicates** (rename or delete)
2. **Review migrations** (decide what to keep)
3. **Test locally** (`supabase db reset`)
4. **Pull production** (optional, to sync)
5. **Push when ready** (`./scripts/database/push-migration.sh`)

---

**Need help?**
- Full guide: `docs/SUPABASE_WORKFLOW_GUIDE.md`
- Pull explained: `docs/PULL_VS_MIGRATIONS_EXPLAINED.md`
- Quick commands: `docs/SUPABASE_CLI_QUICK_REFERENCE.md`






