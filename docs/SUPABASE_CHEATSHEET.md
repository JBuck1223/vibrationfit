# Supabase CLI Cheatsheet

Quick answers to common questions.

---

## 🔄 How do I pull down my current environment?

### Option 1: Helper Script (Recommended)

```bash
./scripts/database/pull-production.sh
```

This will:
1. Login to Supabase (if needed)
2. Link to your project
3. Pull production schema
4. Ask before applying to local
5. Create migration file

### Option 2: Manual Commands

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref nxjhqibnlbwzzphewncj

# Pull production schema
supabase db pull

# Apply to local database
supabase db reset

# Verify
supabase status
```

**When to do this:**
- Starting a new feature
- Syncing with team changes
- After someone pushed migrations
- Fresh setup on new machine

---

## 🚀 How do I push new migrations from Cursor?

### Complete Workflow

#### Step 1: Create Migration

```bash
# Option A: Helper script
./scripts/database/create-migration.sh my_feature_name

# Option B: Manual
supabase migration new my_feature_name
```

#### Step 2: Edit Migration in Cursor

The file will be created at:
```
supabase/migrations/YYYYMMDDHHMMSS_my_feature_name.sql
```

Open it in Cursor and add your SQL:

```sql
-- Example: Add a new column
ALTER TABLE profiles ADD COLUMN bio TEXT;

-- Example: Create a new table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY "Users manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);
```

#### Step 3: Test Locally

```bash
# Reset local database (applies all migrations)
supabase db reset

# Open Studio to verify
open http://127.0.0.1:54323

# Test your app
npm run dev
```

#### Step 4: Push to Production

```bash
# Option A: Helper script (recommended - has safety checks)
./scripts/database/push-migration.sh

# Option B: Manual
supabase db push
```

#### Step 5: Update Documentation

After pushing, update these files:
- `supabase/COMPLETE_SCHEMA_DUMP.sql`
- `supabase/CURRENT_SCHEMA.md`

---

## 📋 Complete Example: Adding User Bio Field

```bash
# 1. Pull latest from production
./scripts/database/pull-production.sh

# 2. Create migration
./scripts/database/create-migration.sh add_user_bio

# 3. Open in Cursor and edit:
#    supabase/migrations/YYYYMMDDHHMMSS_add_user_bio.sql
#    Add: ALTER TABLE profiles ADD COLUMN bio TEXT;

# 4. Test locally
supabase db reset
open http://127.0.0.1:54323

# 5. Push to production
./scripts/database/push-migration.sh

# Done! ✅
```

---

## ⚡ Quick Commands

```bash
# Status
supabase status

# Studio
open http://127.0.0.1:54323

# Reset local
supabase db reset

# List migrations
supabase migration list

# Test connection
node scripts/database/test-supabase-connection.js
```

---

## 🔗 Your Project Info

- **Project Ref:** `nxjhqibnlbwzzphewncj`
- **Production URL:** `https://nxjhqibnlbwzzphewncj.supabase.co`
- **Local URL:** `http://127.0.0.1:54321`
- **Local Studio:** `http://127.0.0.1:54323`

---

## 📖 More Help

- **Full Workflow Guide:** `docs/SUPABASE_WORKFLOW_GUIDE.md`
- **CLI Setup:** `docs/SUPABASE_CLI_SETUP.md`
- **Quick Reference:** `docs/SUPABASE_CLI_QUICK_REFERENCE.md`
- **Scripts Help:** `scripts/database/README.md`





