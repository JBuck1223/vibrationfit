# Draft Lineage Tracking

**Last Updated:** November 29, 2024  
**Status:** Active

## Overview

The `parent_id` column tracks which active vision a draft was cloned from. This enables:
- Finding existing drafts when clicking "Refine" again
- Preventing duplicate drafts for the same parent vision
- Understanding the relationship between versions

## Database Schema

```sql
ALTER TABLE vision_versions
ADD COLUMN parent_id UUID REFERENCES vision_versions(id) ON DELETE SET NULL;
```

**Indexes:**
- `idx_vision_versions_parent_id` - General lookups
- `idx_vision_versions_parent_draft_lookup` - Optimized for finding drafts by parent

## User Flow

### Scenario 1: First Time Refining

1. User has **V1** (active vision)
2. User clicks **"Refine"** on V1
3. System checks: Does a draft exist with `parent_id = V1.id`?
4. **No** → System shows "Create Draft" option
5. User creates draft → **Draft-V2** with `parent_id = V1.id`

### Scenario 2: Returning to Refine

1. User has **V1** (active) and **Draft-V2** (with `parent_id = V1.id`)
2. User clicks **"Refine"** on V1 again
3. System checks: Does a draft exist with `parent_id = V1.id`?
4. **Yes** → System opens existing **Draft-V2** (no duplicate created!)

### Scenario 3: Direct Navigation

1. User navigates to `/life-vision/V1/refine`
2. System checks: Is V1 a draft?
   - **No** → Check if draft exists with `parent_id = V1.id`
   - **If exists** → Redirect to `/life-vision/Draft-V2/refine`
   - **If not** → Show "Create Draft" option

## Implementation

### When Creating Drafts

```typescript
await supabase.from('vision_versions').insert({
  user_id: user.id,
  parent_id: sourceVision.id, // Track the parent
  // ... other fields
  is_draft: true,
  is_active: false
})
```

### When Clicking "Refine"

```typescript
// Check for existing draft
const { data: existingDraft } = await supabase
  .from('vision_versions')
  .select('id')
  .eq('parent_id', activeVision.id)
  .eq('is_draft', true)
  .eq('is_active', false)
  .maybeSingle()

if (existingDraft) {
  // Open existing draft
  router.push(`/life-vision/${existingDraft.id}/refine`)
} else {
  // Create new draft
  router.push(`/life-vision/${activeVision.id}/refine`)
}
```

## Benefits

✅ **No duplicate drafts** - One draft per parent vision  
✅ **Resume work** - Always return to your in-progress draft  
✅ **Clear lineage** - Know which active vision a draft came from  
✅ **Better UX** - Seamless refinement workflow

## Files Updated

- `/src/app/life-vision/[id]/page.tsx` - "Refine" button checks for existing draft
- `/src/app/life-vision/[id]/refine/page.tsx` - Redirects to existing draft if found
- `/src/app/life-vision/[id]/draft/page.tsx` - Sets `parent_id` when cloning
- `/src/app/life-vision/page.tsx` - Sets `parent_id` when cloning from list

## Migration

Run `20251129000001_add_parent_id_to_visions.sql` to add the column and indexes.



