# Pull vs Migrations Explained

## What Happens When You Pull Production?

When you run `supabase db pull`, it:

### 1. Downloads Entire Production Schema

Creates **ONE BIG SQL FILE** with everything currently in production:

```
supabase/migrations/20251115123456_remote_schema.sql
```

This file contains:
- All tables
- All columns  
- All indexes
- All RLS policies
- All functions
- All triggers
- Everything that exists in production RIGHT NOW

### 2. It's a Snapshot, Not Individual Changes

The pull creates a **complete snapshot** of production at this moment.

**Example:** If production has:
- 100 tables
- 500 RLS policies
- 50 functions

You get ONE file with all of them, not 100 separate files.

### 3. How It Differs from Your Local Migrations

**Your Local Migrations:**
```
20251110000000_create_daily_papers_table.sql       ← One specific change
20251112000000_create_households.sql                ← One specific change
20251115000004_fix_viva_terminology.sql            ← One specific change
```

**After Pull:**
```
20251115123456_remote_schema.sql  ← EVERYTHING in production
```

## When to Use Pull vs Individual Migrations

### Use `supabase db pull` When:

✅ You want to see the COMPLETE current state of production
✅ Your local is way behind production
✅ You're starting fresh on a new machine
✅ You want to verify what's actually live
✅ Others pushed migrations and you need to sync

**Example:**
```bash
./scripts/database/pull-production.sh
# Creates: supabase/migrations/20251115123456_remote_schema.sql
# Contains: EVERYTHING currently in production
```

### Use Individual Migrations When:

✅ Making specific incremental changes
✅ Adding new features
✅ Modifying existing tables
✅ Creating new policies
✅ Team collaboration (easier to review)

**Example:**
```bash
./scripts/database/create-migration.sh add_user_bio
# Creates: supabase/migrations/20251115123457_add_user_bio.sql
# Contains: ALTER TABLE profiles ADD COLUMN bio TEXT;
```

## Visual Comparison

### Production State (What's Actually Live)

```
Production Database:
├── users table
├── profiles table  
├── billing table
└── policies, functions, etc.
    Total: 100+ objects
```

### If You Pull:

```bash
supabase db pull

# Creates ONE file:
supabase/migrations/20251115123456_remote_schema.sql
  ├── CREATE TABLE users ...
  ├── CREATE TABLE profiles ...
  ├── CREATE TABLE billing ...
  └── All 100+ objects in ONE file
```

### If You Create Individual Migrations:

```bash
supabase migration new add_bio
supabase migration new add_preferences
supabase migration new fix_policies

# Creates SEPARATE files:
20251115123456_add_bio.sql
  └── ALTER TABLE profiles ADD COLUMN bio TEXT;
  
20251115123457_add_preferences.sql
  └── CREATE TABLE preferences ...
  
20251115123458_fix_policies.sql
  └── DROP POLICY ... CREATE POLICY ...
```

## Real-World Example

### Scenario: You Want to See What's in Production

**Option A: Pull Everything (Big Dump)**
```bash
./scripts/database/pull-production.sh

# Result: One massive file with EVERYTHING
# File: supabase/migrations/20251115123456_remote_schema.sql
# Size: ~50KB - 500KB (depends on your schema)
# Contains: Complete production state
```

**Option B: Check Status (What You Just Did)**
```bash
supabase migration list

# Shows:
# Remote: 20250105000000 ← This is LIVE  
# Remote: 20250111000000 ← This is LIVE
# Local:  20251115000004 ← NOT live yet
```

## Best Practice Workflow

### Starting a New Feature:

```bash
# 1. First, pull production to get latest state
./scripts/database/pull-production.sh
# Creates: ONE file with everything currently live

# 2. Apply it locally
supabase db reset
# Now your local matches production exactly

# 3. Create your new migration
./scripts/database/create-migration.sh add_my_feature
# Creates: ONE small file with just your changes

# 4. Test
supabase db reset

# 5. Push
./scripts/database/push-migration.sh
```

## FAQ

### Q: Should I pull every time?

**A:** Only when:
- Starting work (to sync with team)
- Your local is way behind
- Verifying production state

**Not needed** if you're already synced and working on new features.

### Q: What if I pull and it conflicts with my local migrations?

**A:** The pull creates a NEW migration. You'll need to:
1. Review both the pulled schema and your local migrations
2. Decide which changes to keep
3. Potentially merge or delete duplicates

### Q: Can I edit the pulled migration file?

**A:** Generally NO - it's a snapshot. If you need changes:
1. Create a NEW migration with your changes
2. Don't edit the pulled file
3. Let Supabase handle the history

### Q: How do I see just what changed since last pull?

**A:** Use:
```bash
supabase db diff
# Shows what's different between local and production
```

## Summary

| Action | Result | Use Case |
|--------|--------|----------|
| `supabase db pull` | ONE big file with everything | Sync with production, see complete state |
| `supabase migration new` | ONE small file with specific change | Add features, make changes |
| `supabase migration list` | List of all migrations | See what's live vs local |
| `supabase db diff` | Show differences | Compare local vs production |

---

**Quick Commands:**

```bash
# See complete production state (big dump)
./scripts/database/pull-production.sh

# See which migrations aren't live yet  
supabase migration list

# Create new specific change
./scripts/database/create-migration.sh my_feature
```


