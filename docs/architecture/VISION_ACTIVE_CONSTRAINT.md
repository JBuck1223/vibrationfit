# Vision Active Constraint Implementation

**Last Updated:** December 23, 2025  
**Status:** Active

## Overview

This document describes the implementation of database-level constraints to ensure only one `is_active=true` vision exists per user (personal visions) or per household (household visions).

## Problem Statement

Previously, the `vision_versions` table allowed multiple records with:
- Multiple `is_active=true` personal visions per user
- Multiple `is_active=true` household visions per household
- Multiple `is_draft=true` personal visions per user
- Multiple `is_draft=true` household visions per household

This could lead to data integrity issues and confusion about which vision is actually "active" or which draft is being worked on.

## Solution

### Database Constraints

Created four unique partial indexes to enforce the constraints at the database level:

```sql
-- Only one active personal vision per user
CREATE UNIQUE INDEX idx_vision_versions_one_active_per_user
ON vision_versions (user_id)
WHERE is_active = true AND household_id IS NULL AND is_draft = false;

-- Only one active household vision per household
CREATE UNIQUE INDEX idx_vision_versions_one_active_per_household
ON vision_versions (household_id)
WHERE is_active = true AND household_id IS NOT NULL AND is_draft = false;

-- Only one draft personal vision per user
CREATE UNIQUE INDEX idx_vision_versions_one_draft_per_user
ON vision_versions (user_id)
WHERE is_draft = true AND household_id IS NULL;

-- Only one draft household vision per household
CREATE UNIQUE INDEX idx_vision_versions_one_draft_per_household
ON vision_versions (household_id)
WHERE is_draft = true AND household_id IS NOT NULL;
```

### Database Functions

#### `set_vision_active(p_vision_id UUID, p_user_id UUID)`

Sets a vision as active, automatically deactivating others in the same scope:
- For personal visions: Deactivates other personal visions for the same user
- For household visions: Deactivates other household visions for the same household

Includes permission checks:
- Personal visions: User must be the owner
- Household visions: User must be an active household member

#### `commit_vision_draft_as_active(p_draft_vision_id UUID, p_user_id UUID)`

Commits a draft vision as the new active version:
- Verifies draft exists and user has access
- Deactivates other active visions in the same scope
- Converts draft to active (updates `is_draft=false`, `is_active=true`)

## Code Changes

### API Routes Updated

#### `/api/vision/draft/commit` (Modified)
- Now uses `commit_vision_draft_as_active()` database function
- Removes manual deactivation logic
- Handles both personal and household visions correctly

#### `/api/viva/assemble-vision-from-queue` (Modified)
- Updated deactivation query to filter by `household_id IS NULL`
- Ensures only personal visions are deactivated when creating new personal vision

#### `/api/viva/master-vision` (Modified)
- Updated deactivation query to filter by `household_id IS NULL`
- Ensures only personal visions are deactivated when creating new personal vision

### Migration File

**Location:** `supabase/migrations/20251223000000_enforce_single_active_vision.sql`

**Contents:**
1. Data cleanup: Ensures existing data complies with new constraints (both active and draft)
2. Unique partial indexes for enforcement (4 indexes total)
3. Helper functions for activation and draft commit
4. Updated schema comments

## Testing Recommendations

### Manual Testing

1. **Personal Active Visions:**
   ```sql
   -- Should succeed
   UPDATE vision_versions SET is_active = true 
   WHERE id = 'vision-1' AND household_id IS NULL;
   
   -- Should fail with unique constraint violation
   UPDATE vision_versions SET is_active = true 
   WHERE id = 'vision-2' AND household_id IS NULL AND user_id = 'same-user';
   ```

2. **Household Active Visions:**
   ```sql
   -- Should succeed
   UPDATE vision_versions SET is_active = true 
   WHERE id = 'household-vision-1' AND household_id = 'household-A';
   
   -- Should fail with unique constraint violation
   UPDATE vision_versions SET is_active = true 
   WHERE id = 'household-vision-2' AND household_id = 'household-A';
   ```

3. **Personal Draft Visions:**
   ```sql
   -- Should succeed
   INSERT INTO vision_versions (user_id, is_draft, household_id, ...) 
   VALUES ('user-1', true, NULL, ...);
   
   -- Should fail with unique constraint violation
   INSERT INTO vision_versions (user_id, is_draft, household_id, ...) 
   VALUES ('user-1', true, NULL, ...);
   ```

4. **Household Draft Visions:**
   ```sql
   -- Should succeed
   INSERT INTO vision_versions (user_id, is_draft, household_id, ...) 
   VALUES ('user-1', true, 'household-A', ...);
   
   -- Should fail with unique constraint violation
   INSERT INTO vision_versions (user_id, is_draft, household_id, ...) 
   VALUES ('user-2', true, 'household-A', ...);
   ```

5. **Draft Commit:**
   - Create a draft personal vision
   - Commit it via `/api/vision/draft/commit`
   - Verify previous active vision is deactivated
   - Verify only one `is_active=true` personal vision exists

6. **Household Draft Commit:**
   - Create a draft household vision
   - Commit it via `/api/vision/draft/commit`
   - Verify previous active household vision is deactivated
   - Verify personal visions are NOT affected

### Automated Tests (TODO)

Create tests for:
- [ ] Database constraint enforcement
- [ ] `set_vision_active()` function for personal visions
- [ ] `set_vision_active()` function for household visions
- [ ] `commit_vision_draft_as_active()` for personal visions
- [ ] `commit_vision_draft_as_active()` for household visions
- [ ] Permission checks in both functions

## Deployment Steps

1. **Run the migration:**
   ```bash
   cd supabase
   npx supabase migration up --local  # Test locally first
   npx supabase db push                # Deploy to production
   ```

2. **Verify constraints:**
   ```sql
   -- Check indexes exist
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'vision_versions' 
   AND indexname LIKE '%active%';
   
   -- Check functions exist
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname IN ('set_vision_active', 'commit_vision_draft_as_active');
   ```

3. **Test in production:**
   - Test draft commit for personal vision
   - Test draft commit for household vision
   - Verify no duplicate active visions exist

## Related Documentation

- `supabase/COMPLETE_SCHEMA_DUMP.sql` - Full schema reference
- `docs/architecture/HOUSEHOLD_VISIONS.md` - Household vision architecture
- `FEATURE_REGISTRY.md` - Feature status tracking

## Notes

- There are 4 unique indexes total: 2 for active visions, 2 for drafts
- Active vision indexes only apply when `is_active=true` and `is_draft=false`
- Draft vision indexes only apply when `is_draft=true`
- The constraints are enforced at the database level, preventing violations even from direct SQL
- The helper functions provide a clean API for application code
- Migration automatically cleans up any existing violations before applying constraints

