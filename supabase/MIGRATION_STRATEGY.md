# 🗄️ VibrationFit Migration Strategy

**Updated:** November 12, 2025  
**Status:** Clean baseline established

---

## 🎯 Current Migration Approach

We use a **baseline + incremental** strategy:

### **Baseline (Current State)**
- **File:** `migrations/20251112000000_baseline_current_production.sql`
- **Represents:** Exact production state as of Nov 12, 2025
- **Source:** `COMPLETE_SCHEMA_DUMP.sql` (257KB, 51 tables)

### **Incremental (Future Changes)**
- New migrations build on top of baseline
- Generated from `supabase db diff`
- Always keep dump + docs in sync

---

## 📋 Workflow for Database Changes

### When You Make Manual Changes:

**1. Make the change** (Supabase Dashboard)

**2. Check for drift:**
```bash
cd ~/Desktop/vibrationfit
supabase db diff
```

**3. Generate migration** (if needed):
```bash
supabase db diff -f supabase/migrations/$(date +%Y%m%d%H%M%S)_description.sql
```

**4. Update schema dump:**
```bash
supabase db dump -f supabase/COMPLETE_SCHEMA_DUMP.sql --linked
```

**5. Update documentation:**
- Edit `supabase/CURRENT_SCHEMA.md`
- Add the new columns/changes
- Note the date

**6. Commit all files:**
```bash
git add supabase/migrations/*.sql supabase/COMPLETE_SCHEMA_DUMP.sql supabase/CURRENT_SCHEMA.md
git commit -m "db: [describe change]"
git push origin main
```

---

## 🚀 Deploying to Fresh Database

### Option 1: Use Complete Dump (Recommended)
```bash
# Most accurate - direct from production
psql $DATABASE_URL < supabase/COMPLETE_SCHEMA_DUMP.sql
```

### Option 2: Use Migrations
```bash
# Apply baseline + any incremental migrations
supabase db push
```

---

## 📚 File Structure

```
supabase/
├── COMPLETE_SCHEMA_DUMP.sql          ← Source of truth (257KB)
├── CURRENT_SCHEMA.md                 ← Human-readable docs
├── MIGRATION_STRATEGY.md             ← This file
│
├── migrations/
│   ├── 20251112000000_baseline_current_production.sql  ← Baseline
│   └── [future migrations build here]
│
└── archive/
    ├── old-migrations-2025-11-12/    ← 64 archived migrations
    ├── migrations/                    ← Old duplicate files
    ├── root-level/                    ← Old debug scripts
    └── sql-scripts/                   ← Old token fixes
```

---

## 🔍 Why We Use This Approach

### ❌ Old Approach (Broken)
- 64 migration files
- Couldn't replay cleanly
- Database had drifted
- Manual changes not captured
- **Result:** Migration history didn't match reality

### ✅ New Approach (Clean)
- **One baseline** = current production state
- **Schema dump** = always accurate
- **Documentation** = human-readable
- **New migrations** = only future changes
- **Result:** Can rebuild database accurately

---

## 🎯 Migration History

| Date | Event | Details |
|------|-------|---------|
| 2025-11-12 | **Baseline Created** | Archived 64 old migrations, created clean baseline from production dump |
| 2025-11-11 | V3 Cleanup | Removed 23 deprecated columns, created `life_vision_category_state` |
| 2025-01-05 to 2025-11-12 | Historical | 64 migrations (now archived for reference) |

---

## ⚠️ Important Notes

### For Developers
1. **Always use the dump** as source of truth
2. **Don't trust old migrations** - they're archived for historical reference
3. **Generate migrations from drift** - don't write by hand
4. **Keep docs in sync** - update after every change

### For AI Agents
1. **Reference `CURRENT_SCHEMA.md`** for schema questions
2. **Never reference archived migrations** for current state
3. **Check schema dump** for exact table definitions
4. **Verify columns exist** before writing queries

---

## 🔄 Handling Future Drift

If you notice drift (manual changes not captured):

```bash
# 1. Check drift
supabase db diff

# 2. Generate migration
supabase db diff -f supabase/migrations/$(date +%Y%m%d%H%M%S)_fix_drift.sql

# 3. Update docs (both files)
supabase db dump -f supabase/COMPLETE_SCHEMA_DUMP.sql --linked
# Edit CURRENT_SCHEMA.md

# 4. Commit
git add supabase/
git commit -m "db: Fix schema drift - [describe]"
git push
```

---

## 📖 Related Documentation

- **Schema Dump:** `supabase/COMPLETE_SCHEMA_DUMP.sql` (complete SQL)
- **Schema Docs:** `supabase/CURRENT_SCHEMA.md` (human-readable)
- **Archived Migrations:** `supabase/archive/old-migrations-2025-11-12/README.md`
- **SQL Archive:** `supabase/archive/README.md`

---

**Last Updated:** November 12, 2025  
**Next Review:** After significant schema changes

