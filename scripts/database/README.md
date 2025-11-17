# Database Scripts

Helper scripts for managing Supabase database operations.

## 🚀 Quick Start Scripts

### Pull Production Schema

```bash
./scripts/database/pull-production.sh
```

**What it does:**
- Logs in to Supabase (if needed)
- Links to your project
- Pulls latest schema from production
- Asks before applying to local database
- Creates migration file with changes

**When to use:**
- Starting work on a new feature
- Syncing your local DB with production
- After someone else pushed migrations

---

### Create New Migration

```bash
./scripts/database/create-migration.sh my_feature_name
```

**What it does:**
- Pulls latest schema first (if logged in)
- Creates timestamped migration file
- Provides SQL examples
- Optionally opens in Cursor/VS Code

**When to use:**
- Adding new tables
- Modifying existing schema
- Creating RLS policies
- Any database changes

**Example:**
```bash
./scripts/database/create-migration.sh add_user_bio
# Creates: supabase/migrations/20251115123456_add_user_bio.sql
```

---

### Push Migration to Production

```bash
./scripts/database/push-migration.sh
```

**What it does:**
- Shows pending migrations
- Runs through safety checklist
- Confirms you tested locally
- Pushes to production
- Reminds you to update docs

**When to use:**
- After testing migration locally
- Ready to deploy to production
- Team is notified (for breaking changes)

**Safety features:**
- Lists all pending migrations
- Asks for confirmation
- Checks if you tested locally
- Prevents accidental pushes

---

### Test Connection

```bash
node scripts/database/test-supabase-connection.js
```

**What it does:**
- Tests browser client (anon key)
- Tests service client (service role key)
- Verifies database access
- Shows helpful tips

**When to use:**
- Verifying setup
- Debugging connection issues
- After updating environment variables
- Switching between local/production

---

## 📖 Other Database Scripts

### Check Database Connection

```bash
./scripts/check_database_connection.sh
```

Basic PostgreSQL connection test.

### Apply Migration

```bash
node scripts/apply-migration.js
```

Legacy script for applying migrations (prefer Supabase CLI).

### Database Utilities

Located in `scripts/database/`:

- `add-none-option-v2.js` - Add "none" options to tables
- `fix-database.js` - Database repair utilities
- `generate-missing-thumbnails.js` - Regenerate video thumbnails
- Various other maintenance scripts

---

## 🔄 Complete Workflow Example

### Adding a New Feature with Database Changes

```bash
# 1. Pull latest from production
./scripts/database/pull-production.sh

# 2. Create your migration
./scripts/database/create-migration.sh add_preferences_table

# 3. Edit the migration in Cursor
# supabase/migrations/YYYYMMDDHHMMSS_add_preferences_table.sql

# 4. Add your SQL
cat << 'SQL' > supabase/migrations/YYYYMMDDHHMMSS_add_preferences_table.sql
-- Create user preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  theme TEXT DEFAULT 'dark',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_preferences_user_id 
  ON user_preferences(user_id);
SQL

# 5. Test locally
supabase db reset
open http://127.0.0.1:54323

# 6. Test your app
npm run dev
# Test the new feature works

# 7. Test connection
node scripts/database/test-supabase-connection.js

# 8. Push to production
./scripts/database/push-migration.sh

# 9. Update documentation
# - supabase/COMPLETE_SCHEMA_DUMP.sql
# - supabase/CURRENT_SCHEMA.md
```

---

## 🎯 Best Practices

### Before Creating Migration

1. ✅ Pull latest schema: `./scripts/database/pull-production.sh`
2. ✅ Check pending migrations: `supabase migration list --pending`
3. ✅ Review current schema: `docs/supabase/CURRENT_SCHEMA.md`

### When Writing Migration

1. ✅ Use descriptive names (e.g., `add_user_preferences`, not `update`)
2. ✅ Include comments explaining why
3. ✅ Add indexes for foreign keys
4. ✅ Enable RLS for new tables
5. ✅ Create appropriate policies

### Before Pushing

1. ✅ Test locally: `supabase db reset`
2. ✅ Verify in Studio: `open http://127.0.0.1:54323`
3. ✅ Test app integration: `npm run dev`
4. ✅ Check for breaking changes
5. ✅ Notify team if needed

### After Pushing

1. ✅ Update `supabase/COMPLETE_SCHEMA_DUMP.sql`
2. ✅ Update `supabase/CURRENT_SCHEMA.md`
3. ✅ Verify in production dashboard
4. ✅ Test production app
5. ✅ Monitor for errors

---

## 🐛 Troubleshooting

### "Not logged in" error

```bash
supabase login
# Follow authentication flow in browser
```

### "Project not linked" error

```bash
supabase link --project-ref nxjhqibnlbwzzphewncj
```

### "Migration already exists" error

```bash
# Pull latest, then reset
./scripts/database/pull-production.sh
```

### Scripts not executable

```bash
chmod +x scripts/database/*.sh
```

### Connection test fails

1. Check environment variables in `.env.local`
2. Verify Supabase is running: `supabase status`
3. Restart Supabase: `supabase stop && supabase start`

---

## 📚 Additional Resources

- **Workflow Guide:** `docs/SUPABASE_WORKFLOW_GUIDE.md`
- **CLI Setup:** `docs/SUPABASE_CLI_SETUP.md`
- **Quick Reference:** `docs/SUPABASE_CLI_QUICK_REFERENCE.md`
- **Migration Strategy:** `supabase/MIGRATION_STRATEGY.md`
- **Current Schema:** `supabase/CURRENT_SCHEMA.md`

---

## 🆘 Need Help?

Run any script to see usage instructions:

```bash
./scripts/database/pull-production.sh
./scripts/database/create-migration.sh
./scripts/database/push-migration.sh
node scripts/database/test-supabase-connection.js
```

Or check the full documentation in `docs/SUPABASE_WORKFLOW_GUIDE.md`.



