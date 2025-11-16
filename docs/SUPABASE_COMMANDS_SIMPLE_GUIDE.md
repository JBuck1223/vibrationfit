# Supabase Commands - Simple Guide

Last Updated: November 16, 2025

## 🚨 NEVER RUN THESE ON PRODUCTION

These commands are **EXTREMELY DANGEROUS** and will delete data:

```bash
❌ supabase db reset
# Deletes EVERYTHING and starts over

❌ supabase db push --force
# Forces changes even if dangerous

❌ supabase migration repair --status reverted [all migrations]
# Tells Supabase to forget what it's done
```

## ✅ Safe Commands to Run

### Just Looking Around (Read-Only):

```bash
✅ supabase status
# See if local Supabase is running

✅ supabase migration list
# See what migrations exist

✅ supabase projects list
# See what projects you're connected to
```

### Pulling from Production (Safe):

```bash
✅ supabase db pull --db-url "CONNECTION_STRING"
# Downloads a copy of production schema
# Does NOT change anything in production
# Creates a migration file locally
```

## 🤔 What Probably Happened

Based on the data loss incident, here's my theory:

### Scenario 1: Ran Reset Thinking It Was Local
```bash
# You might have run:
supabase db reset

# Thinking it would reset your local database
# But it was actually connected to production
# Result: Everything deleted
```

### Scenario 2: Followed Instructions Without Understanding
```bash
# You saw an error message suggesting:
supabase migration repair --status reverted [migration_id]

# You ran it for ALL migrations
# This told Supabase "none of these migrations happened"
# Then something triggered a re-sync
# Result: Database thought it needed to start from scratch
```

### Scenario 3: Pushed Bad Migration
```bash
# You created or pushed a migration that had:
TRUNCATE table_name;
# or
DELETE FROM table_name;

# Then ran:
supabase db push

# Result: Migration ran and deleted data
```

## 🎯 What You Should Actually Do

### For Day-to-Day Work:

**Just work in your app!** You don't need to run Supabase CLI commands for normal development.

- Edit your code
- Your app talks to the database
- That's it!

### When You Need to Change Database Structure:

**DON'T do it through commands.** Use one of these:

1. **Supabase Dashboard** (Safest)
   - Go to: https://supabase.com/dashboard
   - Table Editor → Make changes visually
   - No commands needed

2. **Ask Someone to Review First**
   - If you need to run a migration command
   - Have someone review it first
   - Test on local database first

## 📋 Safe Workflow (If You Must Use CLI)

### Step 1: Work Locally Only
```bash
# Make sure you're working locally
supabase start  # Starts local database

# Check you're on local
supabase status
# Should show: http://127.0.0.1:54321
```

### Step 2: Test Changes Locally
```bash
# Create migration
supabase migration new my_change

# Edit the file that was created
# Test it
supabase db reset  # Safe - only affects local

# Verify it works
open http://127.0.0.1:54323  # Open local Studio
```

### Step 3: Get It Reviewed
```bash
# Show someone the migration file
# Get approval
# Then and ONLY then...
```

### Step 4: Apply to Production (Carefully)
```bash
# Push to production
supabase db push --db-url "CONNECTION_STRING"

# Watch for errors
# Have backup ready
```

## 🛡️ Protection Rules

### Rule 1: Local vs Production

**Local** (Safe to play with):
- `http://127.0.0.1:54321`
- `localhost`
- Started with `supabase start`

**Production** (BE CAREFUL):
- `https://[project].supabase.co`
- Real user data
- If you're using `--db-url` you're talking to production

### Rule 2: Don't Run Commands You Don't Understand

If you see a command suggested:
1. ❌ **Don't just run it**
2. ✅ **Ask what it does**
3. ✅ **Understand before executing**

### Rule 3: Backups Before Changes

Before ANY production database change:
1. Go to Dashboard → Settings → Database → Backups
2. Create a manual backup
3. Wait for it to complete
4. Then make your change

## 🔍 How to Check What You Ran

### Your Recent Commands:

```bash
# In your terminal, press:
# ↑ (up arrow) repeatedly to see recent commands

# Or check full history:
cat ~/.zsh_history | grep supabase | tail -20
```

### What to Look For:

```bash
# These would have caused the problem:
supabase db reset
supabase db push
supabase migration repair
```

## 💡 Going Forward

### My Recommendation:

**Don't use Supabase CLI for production at all.** Instead:

1. **For viewing data**: Use Supabase Dashboard
2. **For schema changes**: Use Dashboard Table Editor
3. **For complex changes**: Ask for help first

### If You Must Use CLI:

1. Always work on local first
2. Test thoroughly
3. Get someone to review
4. Create backup before applying to production
5. Apply during low-traffic time

## ❓ Questions to Ask Before Running Commands

1. **"Is this going to change production?"**
   - If you see `--db-url` with production URL → YES
   - If you're connected with `supabase link` → Probably YES
   - If it's just `supabase start` → NO (local only)

2. **"Can this delete data?"**
   - `db reset` → YES (deletes everything)
   - `db push` → MAYBE (depends on migration content)
   - `db pull` → NO (read-only)

3. **"Do I have a recent backup?"**
   - If NO → Create one first
   - If YES → Proceed carefully

## 🆘 If You're Unsure

**Just ask!** Better to ask "dumb questions" than to lose data.

Common questions:
- "Is this command safe?"
- "Will this affect production?"
- "Can I undo this if something goes wrong?"

## 📚 Learn More

- Read: `docs/SUPABASE_CLI_QUICK_REFERENCE.md`
- Practice: On local database only
- Ask: Before running anything on production

---

**Remember**: The Supabase Dashboard is your friend. You can do almost everything there without touching the CLI.

