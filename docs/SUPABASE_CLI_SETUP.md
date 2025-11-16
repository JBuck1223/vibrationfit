# Supabase CLI Setup Guide

Last Updated: November 15, 2025

## ✅ Installation Complete

Supabase CLI is installed and updated to the latest version (`v2.58.5`).

---

## 🚀 Quick Start Commands

### Local Development

```bash
# Start local Supabase (already running)
supabase start

# Stop local Supabase
supabase stop

# Restart local Supabase
supabase stop && supabase start

# Check status
supabase status

# View logs
supabase logs

# Open Studio in browser
open http://127.0.0.1:54323
```

### Database Migrations

```bash
# Create a new migration
supabase migration new <migration_name>

# Apply migrations to local DB
supabase db reset

# Generate migration from DB changes
supabase db diff -f <migration_name>

# List all migrations
supabase migration list
```

### Linking to Remote Project

```bash
# Login to Supabase (required for remote operations)
supabase login

# Link to your remote project
supabase link --project-ref <your-project-ref>

# Check which project you're linked to
supabase projects list

# Push local migrations to remote
supabase db push

# Pull remote schema to local
supabase db pull
```

---

## 🔧 Current Local Setup

Your local Supabase is running with these endpoints:

| Service | URL |
|---------|-----|
| **API URL** | http://127.0.0.1:54321 |
| **Database** | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| **Studio** | http://127.0.0.1:54323 |
| **Email Testing** | http://127.0.0.1:54324 |

### Local Credentials

```bash
# Publishable Key (use in .env.local)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH

# Service Role Key (use in .env.local)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
```

---

## 📝 Environment Variables Setup

### For Local Development (.env.local)

```bash
# Local Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
```

### For Production (.env.production or Vercel)

```bash
# Production Supabase (get from Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

---

## 🔗 Linking to Remote Project

### Step 1: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

### Step 2: Get Your Project Reference

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **General**
4. Copy your **Reference ID** (looks like: `abcdefghijklmnop`)

### Step 3: Link Your Project

```bash
# Link to remote project
supabase link --project-ref <your-project-ref>

# Example:
# supabase link --project-ref abcdefghijklmnop
```

### Step 4: Verify Link

```bash
supabase projects list
```

---

## 🔄 Migration Workflow

### Creating a New Migration

1. **Create migration file:**
   ```bash
   supabase migration new add_new_feature
   ```

2. **Edit the migration:**
   - File created in: `supabase/migrations/YYYYMMDDHHMMSS_add_new_feature.sql`
   - Add your SQL changes

3. **Test locally:**
   ```bash
   supabase db reset
   ```

4. **Push to production** (when ready):
   ```bash
   supabase db push
   ```

### Syncing Schema Changes

```bash
# Pull latest schema from production
supabase db pull

# Generate diff from local changes
supabase db diff -f my_changes

# Push local migrations to production
supabase db push
```

---

## 🎯 Common Tasks

### Reset Local Database

```bash
# Reset to clean state and run all migrations
supabase db reset

# Reset without re-seeding
supabase db reset --no-seed
```

### Access Local Database

```bash
# Using psql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Using Supabase Studio
open http://127.0.0.1:54323
```

### View Logs

```bash
# All logs
supabase logs

# Specific service
supabase logs db
supabase logs api
supabase logs auth
```

### Test Email (Local)

```bash
# View test emails sent by your app
open http://127.0.0.1:54324
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Stop Supabase
supabase stop

# Start fresh
supabase start
```

### Database Connection Issues

```bash
# Check status
supabase status

# View logs
supabase logs db

# Restart
supabase stop && supabase start
```

### Migration Errors

```bash
# Check migration status
supabase migration list

# Reset to clean state
supabase db reset

# Check specific migration
supabase db diff
```

### Can't Login

```bash
# Logout and login again
supabase logout
supabase login
```

---

## 📚 Useful Commands Reference

```bash
# Help
supabase --help
supabase <command> --help

# Version
supabase --version

# List projects
supabase projects list

# Check local status
supabase status

# Generate types for TypeScript
supabase gen types typescript --local > types/supabase.ts

# Test edge functions locally
supabase functions serve

# Deploy edge functions
supabase functions deploy <function-name>
```

---

## 🔐 Security Best Practices

1. ✅ **Never commit `.env.local`** - Already in `.gitignore`
2. ✅ **Use service role key only server-side** - See `src/lib/supabase/service.ts`
3. ✅ **Keep anon key in `NEXT_PUBLIC_*`** - Safe for client exposure
4. ⚠️ **Rotate keys if exposed** - Generate new keys in Supabase Dashboard

---

## 📖 Additional Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)
- [Migration Guide](https://supabase.com/docs/guides/cli/migrations)
- [Project Documentation](../supabase/MIGRATION_STRATEGY.md)

---

## ⚠️ Important Notes

1. **Local vs Production:**
   - Local: `http://127.0.0.1:54321`
   - Production: `https://your-project.supabase.co`
   - Use different `.env` files for each

2. **Migration Files:**
   - Always create migrations using CLI: `supabase migration new <name>`
   - Format: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
   - Never manually edit timestamps

3. **Schema Updates:**
   - After running migrations, update `supabase/COMPLETE_SCHEMA_DUMP.sql`
   - Update `supabase/CURRENT_SCHEMA.md` documentation

4. **RLS Policies:**
   - Test locally before pushing to production
   - Use `supabase db reset` to test from clean state

---

## 🎉 You're All Set!

Your Supabase CLI is configured and ready to use. Start with:

```bash
# Open Studio to view your database
open http://127.0.0.1:54323

# Check current status
supabase status

# View this guide anytime
cat docs/SUPABASE_CLI_SETUP.md
```


