# ⚠️ Actualization Blueprints Feature - BROKEN

## Status: BROKEN (Nov 11, 2025)

The Actualization Blueprints feature at `/actualization-blueprints` is currently **broken** due to the database cleanup.

### What Happened

During the aggressive cleanup of deprecated vibe-assistant endpoints, we removed:
- `/api/vibe-assistant/generate-blueprint` endpoint

However, the Actualization Blueprints page (`/actualization-blueprints`) **still uses this endpoint**.

### Affected Code

**File:** `src/app/actualization-blueprints/page.tsx`
**Line:** 202

```typescript
const response = await fetch('/api/vibe-assistant/generate-blueprint', {
  method: 'POST',
  // ...
})
```

This endpoint no longer exists, so blueprint generation will fail with 404.

---

## Options to Fix

### Option 1: Deprecate the Entire Feature (Recommended if not used)

If actualization blueprints aren't a core feature:

1. **Remove the page:**
   ```bash
   rm -rf src/app/actualization-blueprints
   ```

2. **Remove navigation links:**
   - Check `src/components/DashboardContent.tsx` for any links
   - Check any navigation menus

### Option 2: Rebuild with VIVA

If you want to keep this feature, rebuild it to use the new V3 system:

1. **Create new endpoint:** `/api/viva/generate-blueprint`
   - Use V3 architecture (life_vision_category_state table)
   - Follow VIVA prompt patterns
   - Integrate with token tracking

2. **Update the page:**
   - Change endpoint reference to `/api/viva/generate-blueprint`
   - Update UI to match V3 design system
   - Test with new clean database

### Option 3: Restore the Old Endpoint (Not Recommended)

You could restore the deleted endpoint from git history:
```bash
git checkout HEAD~1 src/app/api/vibe-assistant/generate-blueprint/
```

But this would re-introduce technical debt we just cleaned up.

---

## Usage Check

Before deciding, check if anyone is actually using this feature:

```sql
-- Check if any blueprints exist
SELECT 
  COUNT(*) as total_blueprints,
  COUNT(DISTINCT user_id) as users_with_blueprints,
  MAX(created_at) as most_recent
FROM actualization_blueprints;
```

If the feature is unused or rarely used, **Option 1 (deprecate)** is cleanest.

---

## Immediate Action Needed

**Choose one:**
- [ ] Deprecate the feature entirely
- [ ] Rebuild with VIVA integration
- [ ] Keep broken and fix later
- [ ] Restore old endpoint (not recommended)

Let me know which direction you want to go!

