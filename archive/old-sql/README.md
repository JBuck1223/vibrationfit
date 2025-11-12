# 📦 Archived SQL Files

**Archive Date:** November 12, 2025  
**Reason:** Schema cleanup - preventing agents from referencing outdated SQL

---

## 🗑️ What's In This Archive

### Total Archived: 78 SQL Files

1. **`root-level/`** (28 files)
   - Random SQL scripts scattered in project root
   - Examples: `apply-chat-migrations.sql`, `debug-user-profile.sql`, `fix-refinements-permissions.sql`
   - Mostly one-off fixes and debug scripts

2. **`migrations/`** (6 files)
   - Duplicate migration files from old `/migrations` folder
   - These were duplicates of files in `/supabase/migrations/`
   - Files: `001_add_life_vision_v3_fields.sql` through `006_cleanup_rollback.sql`

3. **`sql-scripts/`** (44 files)
   - Scripts from old `/sql/` folder
   - Mostly token system fixes: `FIX_TOKEN_CALCULATION.sql`, `CLEANUP_DUPLICATE_BACKFILLS.sql`
   - Historical debugging and migration scripts

---

## ✅ Current Active SQL Files

### Source of Truth
- **`docs/COMPLETE_SCHEMA_DUMP.sql`** - Complete production schema (7,377 lines)
- **`docs/CURRENT_SCHEMA.md`** - Human-readable schema documentation

### Official Migrations
- **`supabase/migrations/*.sql`** - 64 migration files (timestamped)
- Latest: `20251112000003_add_refined_categories_tracking.sql`

### Utility Scripts
- **`scripts/enroll-user-in-intensive.sql`** - Active utility script

### Already Organized
- `supabase/migrations/backup/` - Backup migrations (already in backup folder)
- `supabase/migrations/temp/` - Temporary migrations (already in temp folder)

---

## 🎯 Why This Cleanup?

### Problem
- **173 SQL files** scattered across the project
- Agents would reference random, outdated SQL files
- Schema drift: old migrations didn't match actual database state
- Confusion: multiple `/migrations` folders with duplicates

### Solution
- Archived all scattered SQL files
- **Single source of truth:** `docs/COMPLETE_SCHEMA_DUMP.sql`
- **Official migrations only:** `supabase/migrations/`
- **Clear documentation:** `docs/CURRENT_SCHEMA.md`

---

## 📋 Reference Rules for AI Agents

### DO ✅
1. **Reference `docs/CURRENT_SCHEMA.md`** for schema questions
2. **Check `docs/COMPLETE_SCHEMA_DUMP.sql`** for exact table definitions
3. **Use `supabase/migrations/`** for understanding migration history
4. **Verify column existence** before writing queries

### DON'T ❌
1. ~~Reference files in `archive/old-sql/`~~ (outdated)
2. ~~Trust migration files to show current state~~ (use schema dump)
3. ~~Assume columns exist based on old scripts~~ (verify in docs)

---

## 🔄 If You Need Something From Archive

If you find a script in here that's still useful:
1. Extract it from `archive/old-sql/`
2. Update it to match current schema (`docs/CURRENT_SCHEMA.md`)
3. Test it against production dump (`docs/COMPLETE_SCHEMA_DUMP.sql`)
4. Place it in appropriate location (`scripts/` or `supabase/migrations/`)
5. Document why it's needed

---

## 📜 Archive Contents Inventory

### Root-Level Files (28)
```
add-missing-tables.sql
apply-chat-migrations-safe.sql
apply-chat-migrations.sql
apply-viva-conversations-production.sql
check-is-draft.sql
check-user-profiles-table.sql
check_is_active_datatype.sql
check_vision_versions_schema.sql
create-production-schema.sql
crud-query-templates.sql
debug-user-profile.sql
debug_ai_scoring.sql
fix-refinements-permissions.sql
fix-vision-versions-permissions.sql
fix_ai_scoring.sql
fix_response_value_constraint.sql
get_audio_for_design_system.sql
get_vision_audio.sql
manual-refinements-migration.sql
missing-indexes-corrected.sql
missing-indexes.sql
missing-rls-policies.sql
production-dump.sql
query-vision.sql
quick_debug.sql
setup-local-db.sql
simple_ai_fix.sql
test_ai_scoring.sql
```

### Old Migrations Folder (6)
```
001_add_life_vision_v3_fields.sql
002_add_ideal_state_prompts_table.sql
003_create_life_vision_category_state.sql
004_migrate_v3_data.sql
005_drop_deprecated_columns.sql
006_cleanup_rollback.sql
```

### SQL Scripts Folder (44)
```
Token system fixes (majority):
- FIX_TOKEN_CALCULATION.sql
- FIX_DUPLICATE_USER_BALANCES.sql
- CLEANUP_DUPLICATE_BACKFILLS.sql
- COMPLETE_TOKEN_TRACKING_FIX.sql
- etc. (20+ token-related scripts)

Debug scripts:
- DEBUG_TOKEN_DISCREPANCY.sql
- debug-token-balance-update.sql
- etc.

Migration helpers:
- ALL_TOKEN_MIGRATIONS.sql
- reconcile-user-token-balance.sql
- etc.
```

---

## 🗓️ Cleanup History

| Date | Action | Files Moved |
|------|--------|-------------|
| 2025-11-12 | Initial cleanup | 78 files |
| 2025-11-11 | V3 database cleanup | Removed 23 deprecated columns |

---

**Note:** These files are kept for historical reference only. The actual database state is documented in `docs/CURRENT_SCHEMA.md` and `docs/COMPLETE_SCHEMA_DUMP.sql`.

