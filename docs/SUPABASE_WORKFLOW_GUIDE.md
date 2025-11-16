# Supabase Development Workflow Guide

Last Updated: November 15, 2025

## 🔄 Common Workflows

### 1. Pull Down Current Environment (Production → Local)

Use this when you want to sync your local database with production.

#### Step-by-Step:

```bash
# Make sure you're logged in and linked to your project
cd /Users/jordanbuckingham/Desktop/vibrationfit

# Step 1: Login to Supabase (if not already)
supabase login

# Step 2: Link to your project (if not already linked)
supabase link --project-ref nxjhqibnlbwzzphewncj

# Step 3: Pull the remote schema
supabase db pull

# This creates a new migration file with all remote changes
# File will be created in: supabase/migrations/YYYYMMDDHHMMSS_remote_schema.sql

# Step 4: Apply the pulled schema to your local database
supabase db reset

# Step 5: Verify everything works
supabase status
open http://127.0.0.1:54323
```

#### What This Does:

- **Downloads** the current production schema
- **Creates** a migration file with all changes
- **Applies** it to your local database
- **Syncs** your local environment with production

#### Example Output:

```
Pulling schema from remote database...
Creating migration supabase/migrations/20251115123456_remote_schema.sql...
Done.
```

---

### 2. Push New Migrations from Cursor (Local → Production)

Use this when you've created new migrations and want to deploy them to production.

#### Step-by-Step:

```bash
cd /Users/jordanbuckingham/Desktop/vibrationfit

# Step 1: Create a new migration (do this first!)
supabase migration new add_new_feature

# This creates: supabase/migrations/YYYYMMDDHHMMSS_add_new_feature.sql

# Step 2: Edit the migration file in Cursor
# Open: supabase/migrations/YYYYMMDDHHMMSS_add_new_feature.sql
# Add your SQL:

-- Example migration content:
-- ALTER TABLE profiles ADD COLUMN new_field TEXT;
-- CREATE INDEX idx_profiles_new_field ON profiles(new_field);

# Step 3: Test locally FIRST (very important!)
supabase db reset

# Step 4: Verify in local Studio
open http://127.0.0.1:54323
# Check that your changes look correct

# Step 5: Push to production (when ready!)
supabase db push

# You'll see:
# - List of migrations to apply
# - Confirmation prompt
# - Success message
```

#### ⚠️ Important Notes:

1. **ALWAYS test locally first** with `supabase db reset`
2. **NEVER** push untested migrations to production
3. **BACKUP** production before major migrations
4. **Migrations are irreversible** - plan carefully

#### Safety Checklist:

- [ ] Migration tested locally
- [ ] No syntax errors
- [ ] RLS policies tested
- [ ] Data integrity verified
- [ ] Team notified (if applicable)
- [ ] Backup plan ready

---

## 🔄 Complete Development Cycle

### Scenario: Adding a New Feature

```bash
# 1. Start with latest production schema
supabase db pull
supabase db reset

# 2. Create your migration
supabase migration new add_user_preferences

# 3. Edit in Cursor (supabase/migrations/YYYYMMDDHHMMSS_add_user_preferences.sql)
# Add your SQL changes

# 4. Test locally
supabase db reset

# 5. Verify in Studio
open http://127.0.0.1:54323

# 6. Test your app locally
npm run dev
# Test the new feature

# 7. Push to production
supabase db push

# 8. Update schema docs (important!)
# Manually update:
# - supabase/COMPLETE_SCHEMA_DUMP.sql
# - supabase/CURRENT_SCHEMA.md
```

---

## 🚀 Quick Commands Reference

### Pull Production Schema

```bash
# Full pull and reset
supabase db pull && supabase db reset

# Just pull (doesn't apply)
supabase db pull
```

### Push Migrations

```bash
# Push all pending migrations
supabase db push

# Dry run (see what would happen)
supabase db push --dry-run

# Force push (careful!)
supabase db push --force
```

### Check Migration Status

```bash
# List all migrations
supabase migration list

# See which migrations are pending
supabase migration list --pending

# Check remote vs local
supabase migration list --remote
```

---

## 🛠️ Advanced Workflows

### Generate Migration from Schema Changes

If you made changes directly in Studio or via code:

```bash
# Compare local DB to migrations and generate diff
supabase db diff -f my_manual_changes

# This creates a migration with the differences
# Review the file and test
supabase db reset

# Push when ready
supabase db push
```

### Revert Migration (Local Only)

```bash
# Reset to clean state
supabase db reset

# Or restore from a specific migration
supabase db reset --version YYYYMMDDHHMMSS
```

### Sync Local with Production (Full Reset)

```bash
# Pull latest schema
supabase db pull

# Reset local to match exactly
supabase db reset

# Verify
supabase status
```

---

## 🔍 Troubleshooting

### "Migration already exists on remote"

```bash
# This means production is ahead of your local

# Solution: Pull first, then push
supabase db pull
supabase db reset
supabase db push
```

### "Migration out of order"

```bash
# Migrations must be in chronological order

# Fix: Rename migration file with correct timestamp
# Or: Pull latest and recreate migration
```

### "RLS policy error"

```bash
# Test with service role key to bypass RLS
# Or: Fix RLS policies in migration

# Test locally with:
supabase db reset
node scripts/database/test-supabase-connection.js
```

---

## 📝 Best Practices

### DO ✅

- Pull before creating new migrations
- Test locally before pushing
- Use descriptive migration names
- Keep migrations small and focused
- Comment complex SQL
- Update schema docs after migrations
- Communicate with team before pushing

### DON'T ❌

- Push untested migrations
- Edit old migration files
- Skip local testing
- Make breaking changes without planning
- Forget to update documentation
- Push during peak traffic hours

---

## 🔗 Related Documentation

- [Migration Strategy](../supabase/MIGRATION_STRATEGY.md)
- [Current Schema](../supabase/CURRENT_SCHEMA.md)
- [CLI Setup Guide](./SUPABASE_CLI_SETUP.md)
- [Quick Reference](./SUPABASE_CLI_QUICK_REFERENCE.md)

---

## 💡 Tips for Working in Cursor

### Create Migration from Cursor

1. Open terminal in Cursor (`` Ctrl+` ``)
2. Run: `supabase migration new my_feature`
3. File opens automatically in Cursor
4. Write your SQL
5. Test: `supabase db reset`
6. Push: `supabase db push`

### Testing in Cursor

```bash
# Open Cursor terminal and run:
npm run dev & open http://127.0.0.1:54323

# Test your changes in both:
# - Your app (localhost:3000)
# - Supabase Studio (localhost:54323)
```

### Keyboard Shortcuts

```bash
# Create new terminal in Cursor
Ctrl+`

# Run commands quickly
Ctrl+Shift+P → "Tasks: Run Task" → Add frequent commands

# Quick file open
Cmd+P → type filename
```

---

## 🎯 Real-World Examples

### Example 1: Add New Column

```bash
# Create migration
supabase migration new add_profile_bio

# Edit file (in Cursor):
# ALTER TABLE profiles ADD COLUMN bio TEXT;

# Test
supabase db reset

# Push
supabase db push
```

### Example 2: Add RLS Policy

```bash
# Create migration
supabase migration new add_profile_privacy_policy

# Edit file:
# CREATE POLICY "Users can update own profile"
#   ON profiles FOR UPDATE
#   USING (auth.uid() = user_id);

# Test
supabase db reset

# Verify RLS works
node scripts/database/test-supabase-connection.js

# Push
supabase db push
```

### Example 3: Create New Table

```bash
# Pull latest first
supabase db pull
supabase db reset

# Create migration
supabase migration new create_user_preferences

# Edit file:
# CREATE TABLE user_preferences (
#   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
#   user_id UUID REFERENCES auth.users(id) NOT NULL,
#   theme TEXT DEFAULT 'dark',
#   created_at TIMESTAMPTZ DEFAULT NOW()
# );
# 
# ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
# CREATE POLICY "Users manage own preferences"
#   ON user_preferences FOR ALL
#   USING (auth.uid() = user_id);

# Test
supabase db reset
open http://127.0.0.1:54323

# Push
supabase db push
```

---

## 🚨 Emergency Procedures

### Roll Back Production Migration

```bash
# If something goes wrong after pushing:

# 1. Revert the migration on production (requires manual SQL)
# Connect to production and run rollback SQL

# 2. Remove the migration file locally
rm supabase/migrations/YYYYMMDDHHMMSS_bad_migration.sql

# 3. Pull clean state
supabase db pull
supabase db reset
```

### Production Database Backup

Before major migrations:

```bash
# 1. Go to Supabase Dashboard
# 2. Project Settings → Database → Backups
# 3. Create manual backup
# 4. Wait for completion
# 5. Then push migration
```

---

**Need help?** Check the [CLI Setup Guide](./SUPABASE_CLI_SETUP.md) or ask in chat!


