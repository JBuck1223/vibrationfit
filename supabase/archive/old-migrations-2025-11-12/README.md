# 📦 Archived Migrations - November 12, 2025

**Archive Date:** November 12, 2025  
**Reason:** Migration history cleanup - creating clean baseline

---

## 🎯 Why These Were Archived

### The Problem
- These 64 migration files could not replay cleanly
- Database had drifted from what migrations described
- Manual changes were made that weren't captured
- Multiple migration folders existed (causing confusion)
- Attempting to run migrations produced errors

### The Solution
Created **one baseline migration** that represents the actual production state:
- `20251112000000_baseline_current_production.sql`

This baseline references:
- `supabase/COMPLETE_SCHEMA_DUMP.sql` (actual schema)
- `supabase/CURRENT_SCHEMA.md` (documentation)

---

## 📜 What's In This Archive

**64 migration files** from various dates:
- Earliest: `20250105000000_create_user_profiles.sql`
- Latest: `20251112000003_add_refined_categories_tracking.sql`

These migrations represent the historical evolution of the database, but:
- ❌ Cannot be replayed cleanly
- ❌ Don't match current production state
- ❌ Had missing columns/duplicate tables

---

## 🔄 New Migration Strategy

### Going Forward

**Starting Point:**
- Baseline migration: `20251112000000_baseline_current_production.sql`
- This represents production as of Nov 12, 2025

**For New Changes:**
1. Make manual changes in Supabase Dashboard
2. Run: `supabase db diff -f supabase/migrations/TIMESTAMP_description.sql`
3. Run: `supabase db dump -f supabase/COMPLETE_SCHEMA_DUMP.sql --linked`
4. Update: `supabase/CURRENT_SCHEMA.md`
5. Commit all three files

**To Deploy Fresh Database:**
```bash
# Apply the complete schema dump
psql $DATABASE_URL < supabase/COMPLETE_SCHEMA_DUMP.sql
```

---

## 📊 Migration Stats

| Metric | Count |
|--------|-------|
| Total files archived | 64 |
| Date range | Jan 5, 2025 - Nov 12, 2025 |
| Total lines of SQL | ~15,000+ |
| Tables created | 51 |
| Columns added | 200+ |

---

## 🔍 If You Need Historical Context

These migrations show the database evolution:
- User profile system (Jan 5)
- Assessment system (Jan 11)
- Billing system (Jan 12)
- VIVA refinement system (Jan 15)
- Token tracking system (Feb 3)
- Voice profiles (Nov 9)
- Life Vision V3 (Nov 11)

But they don't represent current state accurately.

---

## ✅ Current Source of Truth

**Actual Database State:**
- `supabase/COMPLETE_SCHEMA_DUMP.sql` (257KB)
- `supabase/CURRENT_SCHEMA.md` (23KB)
- `supabase/migrations/20251112000000_baseline_current_production.sql` (baseline)

**For Historical Reference Only:**
- This archive folder

---

**Note:** These files are kept for historical context only. Do not attempt to replay these migrations. Use the baseline + dump instead.

