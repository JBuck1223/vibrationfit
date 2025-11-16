# 🚀 Supabase CLI Quick Reference

> **Full Guide:** See `docs/SUPABASE_CLI_SETUP.md` for complete documentation
> **Workflow Guide:** See `docs/SUPABASE_WORKFLOW_GUIDE.md` for detailed workflows

---

## ⚡ Most Used Commands

```bash
# Start/Stop Local Supabase
supabase start          # Start local instance
supabase stop           # Stop local instance
supabase status         # Check if running

# Open Studio
open http://127.0.0.1:54323

# Database Management
supabase db reset       # Reset DB and run all migrations
supabase migration new <name>    # Create new migration
supabase db diff -f <name>       # Generate migration from changes

# Sync with Production
supabase db pull        # Pull production schema
supabase db push        # Push local migrations
```

---

## 🎯 Helper Scripts (Easier Way!)

```bash
# Check migration status (which are pending)
./scripts/database/show-migration-status.sh

# Pull production schema
./scripts/database/pull-production.sh

# Create new migration (interactive)
./scripts/database/create-migration.sh

# Push migration to production (with safety checks)
./scripts/database/push-migration.sh

# Test connection
node scripts/database/test-supabase-connection.js
```

---

## 🔗 Your Local Endpoints

| Service | URL |
|---------|-----|
| API | http://127.0.0.1:54321 |
| Studio | http://127.0.0.1:54323 |
| Email Testing | http://127.0.0.1:54324 |

---

## 🔑 Local Credentials

```bash
URL: http://127.0.0.1:54321
Anon Key: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
Service Key: sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
```

---

## 🔄 Migration Workflows

### Pull Production → Local

```bash
# Method 1: Helper script (recommended)
./scripts/database/pull-production.sh

# Method 2: Manual commands
supabase login
supabase link --project-ref nxjhqibnlbwzzphewncj
supabase db pull
supabase db reset
```

### Create & Push Migration (Local → Production)

```bash
# Method 1: Helper scripts (recommended)
./scripts/database/create-migration.sh my_feature
# Edit the migration file in Cursor
supabase db reset  # Test locally
./scripts/database/push-migration.sh

# Method 2: Manual commands
supabase migration new my_feature
# Edit: supabase/migrations/YYYYMMDDHHMMSS_my_feature.sql
supabase db reset  # Test locally
supabase db push   # Push to production
```

---

## 🐛 Troubleshooting

```bash
# Restart everything
supabase stop && supabase start

# View logs
supabase logs

# Check specific service
supabase logs db
supabase logs api
```

---

## 🔗 Link to Remote

```bash
# Login first
supabase login

# Link project (get ref from dashboard)
supabase link --project-ref <your-project-ref>

# Verify
supabase projects list
```

---

**Need more help?** → `docs/SUPABASE_CLI_SETUP.md`

