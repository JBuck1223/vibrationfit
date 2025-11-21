# 🚀 Supabase CLI Quick Reference

> **Full Guide:** See `docs/SUPABASE_CLI_SETUP.md` for complete documentation

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

## 🔄 Migration Workflow

```bash
# 1. Create migration
supabase migration new add_feature

# 2. Edit file in: supabase/migrations/YYYYMMDDHHMMSS_add_feature.sql

# 3. Test locally
supabase db reset

# 4. Push to production (when ready)
supabase db push
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





