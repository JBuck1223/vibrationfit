# Data Loss Incident Report

Date: November 16, 2025
Time: Between 7 hours ago and yesterday

## Summary

Production database experienced data loss between yesterday and 7 hours ago. Data was successfully restored from a backup from 1 day ago.

## Timeline

| Time | Status | Details |
|------|--------|---------|
| Yesterday | ✅ Working | Data present, old migration history intact |
| 7 hours ago | ❌ Empty | Data missing, migration history cleared |
| Today (~12:20 PM) | 🔍 Investigation | Schema pulled showing empty tables |
| Today (~1:00 PM) | ✅ Restored | User restored from yesterday's backup |

## Affected Tables (Were Empty)

- `vision_versions` (0 rows → 2 rows restored)
- `audio_tracks` (0 rows → 56 rows restored)
- `profiles` (0 rows → 2 rows restored)
- `refinements` (0 rows → restored)
- `actualization_blueprints` (0 rows → 1 row restored)
- And many others...

## What Was Found

### 1. Migration History Changed

**Before incident (yesterday):**
- Multiple migrations from January 2025
- Multiple migrations from February 2025
- Migrations from October 2025
- November 2025 migrations

**During incident (7 hours ago → today):**
- ALL old migrations GONE
- Only ONE migration: `20251116122047`
- Migration history table essentially wiped clean

**After restore:**
- Old migrations back
- History matches yesterday's state

### 2. Backup Tables Exist

Found in production:
- `refinements_backup_20251111` (1 row)
- `vision_versions_backup_20251111` (2 rows)

These backups from November 11th suggest prior schema changes.

### 3. Schema Analysis

The pulled schema (`20251116122047_remote_schema.sql`) from the "empty state" contains:
- No TRUNCATE commands
- No DROP TABLE commands
- One DELETE statement (inside a function - conditional, not destructive)

## What Could Have Caused This

### Most Likely:

1. **Migration Reset Command**
   ```bash
   supabase db reset  # On production (VERY BAD)
   ```
   OR
   ```bash
   supabase migration repair --status reverted [all migrations]
   # Then some command that re-applied empty schema
   ```

2. **Supabase CLI Push with Wrong Branch**
   - Someone pushed from a local branch with no data
   - Migration history was wiped and restarted

3. **Manual Database Operation**
   - Someone connected directly to production
   - Ran commands to clear migration history
   - May have triggered schema recreation

### Less Likely:

4. **Application Bug** - Code that truncated tables
5. **Scheduled Job** - Automated script gone wrong
6. **Supabase Dashboard** - Manual table truncation

## How to Investigate Further

### 1. Check Supabase Logs

```
Dashboard → Project → Logs → Postgres Logs
```

Look for between yesterday and 7 hours ago:
- TRUNCATE statements
- DELETE statements
- DROP statements
- Migration commands
- Connection from unknown IPs

### 2. Check Application Logs

```bash
# If you have application logging
grep -i "truncate\|delete\|migration" /path/to/app/logs/*.log
```

### 3. Check Git History

```bash
# See who pushed what migrations
git log --since="2 days ago" --until="now" -- supabase/migrations/

# Check for suspicious commands
git log -p --since="2 days ago" --grep="migration"
```

### 4. Check Who Has Access

- List all users with production database access
- Check Supabase project members
- Review service role key usage
- Audit API keys

## Recommendations Going Forward

### Immediate Actions:

1. **Change Database Password** ✅ CRITICAL
   - Current password was shared in chat: `nvz6W8EcT4mD95yl`
   - Go to Dashboard → Settings → Database → Reset password

2. **Rotate Service Keys**
   - Go to Dashboard → Settings → API
   - Generate new `service_role` key
   - Update `.env.local` and production env vars

3. **Archive the "Bad" Migration**
   ```bash
   mv supabase/migrations/20251116122047_remote_schema.sql \
      supabase/archive/20251116122047_BAD_empty_schema.sql
   ```

### Long-term Protections:

4. **Enable Point-in-Time Recovery (PITR)**
   - Supabase Pro plan feature
   - Allows restore to any point in time
   - Currently: Dashboard → Settings → Database → Backups

5. **Set Up Automated Backups**
   - Daily schema dumps
   - Store in separate location (S3, GitHub)
   ```bash
   # Add to cron/CI
   supabase db dump -f backup-$(date +%Y%m%d).sql
   ```

6. **Protect Production Migrations**
   - Never run `supabase db reset` on production
   - Always test migrations locally first
   - Use staging environment
   - Require code review for migrations

7. **Add Monitoring**
   - Alert on row count drops
   - Monitor migration table changes
   - Track database connection IPs

8. **Document Migration Workflow**
   - Who can push migrations?
   - What's the approval process?
   - How to test before production?

### Development Workflow:

9. **Use Database Branching** (if on Pro plan)
   - Test schema changes in branches
   - Merge to production only after testing

10. **Never Share Production Credentials**
    - Use read-only credentials for debugging
    - Rotate regularly
    - Use environment variables only

## Current Status

✅ **Data Restored** - Back to yesterday's state
✅ **Schema Verified** - All tables have data
⚠️ **Security Risk** - Password exposed in chat
⚠️ **Root Cause Unknown** - Still needs investigation

## Next Steps

1. [ ] Change database password immediately
2. [ ] Rotate service role keys
3. [ ] Review Supabase logs for the incident window
4. [ ] Check git history for suspicious changes
5. [ ] Audit who has production access
6. [ ] Set up better backup strategy
7. [ ] Document and enforce migration workflow
8. [ ] Archive the "bad" migration file
9. [ ] Pull fresh schema after investigation complete

## Files to Review

- `supabase/migrations/20251116122047_remote_schema.sql` - The "empty" schema
- `supabase/COMPLETE_SCHEMA_DUMP.sql` - Should be updated with current schema
- Git logs from past 48 hours
- Supabase project logs (Postgres, API, Auth)

## Contact

If you need help investigating further, check:
- Supabase support (if on paid plan)
- Your team members who might have run migrations
- Any automated CI/CD that touches production

---

**CRITICAL REMINDER**: Change the database password now! It's exposed in chat history.

