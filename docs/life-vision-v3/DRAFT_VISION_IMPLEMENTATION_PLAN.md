# Draft Vision Implementation Plan

## Goal
Convert the refinement system from storing individual category drafts in the `refinements` table to storing complete draft visions as `vision_versions` rows with `is_active=false` and `is_draft=true`.

---

## Current Architecture

### How It Works Now
1. User refines a category (e.g., "Health")
2. Refined text saves to `refinements.output_text` with `category='health'`
3. Multiple refinements per vision/category can exist
4. `/api/vision/draft` combines active vision + refinements on-the-fly
5. Commit creates new vision_versions row and deletes refinements

### Problems
- ❌ Draft is virtual (no dedicated DB row)
- ❌ Can't directly view/edit full draft as a vision
- ❌ No draft ID to reference
- ❌ Refinements scattered across multiple rows
- ❌ Complex logic to merge active + refinements

---

## New Architecture

### How It Will Work
1. User starts refining → Creates draft `vision_versions` row (if doesn't exist)
2. Draft row: `is_active=false`, `is_draft=true`, copied from active vision
3. User refines category → Updates draft vision row directly
4. Draft has own UUID that can be referenced everywhere
5. Commit → Flip flags: draft becomes active, old active becomes inactive

### Benefits
- ✅ Draft is real vision_versions row with ID
- ✅ Can view/edit draft like any vision
- ✅ Simplified data model
- ✅ Consistent with profile versioning system
- ✅ Can apply version control operations to drafts
- ✅ Clear "one draft per user" pattern

---

## Implementation Steps

### Phase 1: Database Schema ✅ DONE

**Migration 1**: Add columns to `vision_versions`
- Add `is_active BOOLEAN DEFAULT false`
- Add `is_draft BOOLEAN DEFAULT false`
- Add unique constraint: only one active vision per user
- Add check: can't be both active and draft
- Add indexes for performance

**Migration 2**: Data migration helper function
- Function to convert existing refinements → draft visions
- Run manually when ready to migrate

### Phase 2: API Layer Updates

#### 2.1 Create Draft Vision API
**File**: `src/app/api/vision/draft/create/route.ts`

```typescript
POST /api/vision/draft/create
Body: { visionId: string }  // Active vision to base draft on

Logic:
1. Get active vision by visionId
2. Check if draft already exists for user
3. If exists, return existing draft
4. If not, create new vision_versions row:
   - Copy all fields from active vision
   - Set is_active=false, is_draft=true
   - Set title = title + ' (Draft)'
   - Set status = 'draft'
5. Return draft vision
```

#### 2.2 Update Draft Vision API
**File**: `src/app/api/vision/draft/update/route.ts`

```typescript
PATCH /api/vision/draft/update
Body: { 
  draftId: string,
  category: string,
  content: string
}

Logic:
1. Verify draft exists and user owns it
2. Update specific category field
3. Update updated_at timestamp
4. Return updated draft
```

#### 2.3 Get Draft Vision API
**File**: `src/app/api/vision/draft/route.ts` (MODIFY EXISTING)

```typescript
GET /api/vision/draft?userId={userId}

OLD: Combine active vision + refinements
NEW: Return draft vision_versions row directly

Logic:
1. Query vision_versions WHERE user_id=? AND is_draft=true AND is_active=false
2. Return draft vision (or null if doesn't exist)
```

#### 2.4 Commit Draft API
**File**: `src/app/api/vision/draft/commit/route.ts`

```typescript
POST /api/vision/draft/commit
Body: { draftId: string }

Logic:
1. Start transaction
2. Get draft vision (verify is_draft=true)
3. Get current active vision for user
4. Update old active: is_active=false
5. Update draft: is_active=true, is_draft=false, version_number++
6. Commit transaction
7. Return new active vision
```

#### 2.5 Delete Draft API
**File**: `src/app/api/vision/draft/delete/route.ts`

```typescript
DELETE /api/vision/draft?draftId={draftId}

Logic:
1. Verify draft exists and user owns it
2. Delete draft vision_versions row
3. Return success
```

### Phase 3: Frontend Updates

#### 3.1 Refine Page (`src/app/life-vision/[id]/refine/page.tsx`)

**Changes:**
1. **On mount / category select:**
   ```typescript
   // OLD: Load refinement from refinements table
   const { data: refinement } = await supabase
     .from('refinements')
     .select('output_text')
     .eq('category', category)...
   
   // NEW: Ensure draft vision exists, then load from it
   const { data: draft } = await ensureDraftExists(visionId)
   setCurrentRefinement(draft[category])
   ```

2. **Save draft function:**
   ```typescript
   // OLD: Insert/update refinements table
   await supabase.from('refinements').upsert(...)
   
   // NEW: Update draft vision row directly
   await fetch('/api/vision/draft/update', {
     method: 'PATCH',
     body: JSON.stringify({
       draftId: draftVisionId,
       category: selectedCategory,
       content: currentRefinement
     })
   })
   ```

3. **Load all drafts:**
   ```typescript
   // OLD: Query refinements table
   const { data: allDrafts } = await supabase
     .from('refinements')
     .select('*')...
   
   // NEW: Get draft vision and compare to active
   const { data: draft } = await getDraftVision()
   const draftCategories = VISION_CATEGORIES.filter(cat => 
     draft[cat.key] !== activeVision[cat.key]
   )
   ```

4. **Commit draft:**
   ```typescript
   // OLD: Create new vision, delete refinements
   const newVersion = await supabase.from('vision_versions').insert(...)
   await supabase.from('refinements').delete()...
   
   // NEW: Call commit API
   const response = await fetch('/api/vision/draft/commit', {
     method: 'POST',
     body: JSON.stringify({ draftId: draftVisionId })
   })
   ```

#### 3.2 Draft Preview Page (`src/app/life-vision/[id]/refine/draft/page.tsx`)

**Changes:**
1. **Load draft:**
   ```typescript
   // OLD: Call /api/vision/draft?id=visionId (combines active + refinements)
   
   // NEW: Get draft vision directly
   const { data: draft } = await supabase
     .from('vision_versions')
     .select('*')
     .eq('user_id', user.id)
     .eq('is_draft', true)
     .eq('is_active', false)
     .single()
   
   // Get active vision for comparison
   const { data: active } = await supabase
     .from('vision_versions')
     .select('*')
     .eq('user_id', user.id)
     .eq('is_active', true)
     .single()
   
   // Compare to find changed categories
   const draftCategories = VISION_CATEGORIES.filter(cat =>
     draft[cat.key] !== active[cat.key]
   )
   ```

2. **Update URL structure:**
   ```typescript
   // OLD: /life-vision/{activeVisionId}/refine/draft
   // NEW: /life-vision/draft/{draftVisionId}
   
   // Or keep old URL but fetch differently
   ```

#### 3.3 Refine Category API Integration

**File**: `src/app/api/viva/refine-category/route.ts`

**Changes:**
1. **After generating refinement:**
   ```typescript
   // OLD: Return refined text only
   // NEW: Auto-update draft vision
   
   // After AI generates refinedText:
   if (refinedText) {
     // Update draft vision directly
     await supabase
       .from('vision_versions')
       .update({ [category]: refinedText })
       .eq('id', draftVisionId)
       .eq('is_draft', true)
   }
   ```

### Phase 4: Helper Functions & Utilities

#### 4.1 Draft Vision Helpers
**File**: `src/lib/vision/draft-helpers.ts`

```typescript
/**
 * Get or create draft vision for user
 */
export async function ensureDraftExists(activeVisionId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check for existing draft
  let { data: draft } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_draft', true)
    .eq('is_active', false)
    .maybeSingle()
  
  if (draft) return draft
  
  // Create draft from active vision
  const response = await fetch('/api/vision/draft/create', {
    method: 'POST',
    body: JSON.stringify({ visionId: activeVisionId })
  })
  
  draft = await response.json()
  return draft
}

/**
 * Get active vision for user
 */
export async function getActiveVision(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_draft', false)
    .single()
  
  return data
}

/**
 * Get draft vision for user (if exists)
 */
export async function getDraftVision(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_draft', true)
    .eq('is_active', false)
    .maybeSingle()
  
  return data
}

/**
 * Get categories that differ between draft and active
 */
export function getDraftCategories(draft: VisionData, active: VisionData) {
  return VISION_CATEGORIES.filter(cat => {
    const draftValue = draft[cat.key as keyof VisionData]
    const activeValue = active[cat.key as keyof VisionData]
    return draftValue !== activeValue
  }).map(cat => cat.key)
}
```

### Phase 5: Refinements Table Deprecation Strategy

**Option A: Keep refinements for history**
- Keep table for historical record
- Add `migrated_to_draft_id` column
- Mark migrated refinements
- Use for audit trail only

**Option B: Deprecate refinements completely**
- Migrate all to draft visions
- Keep refinements for non-vision operations (if any)
- Rename operation_type filters

**Recommended: Option A**

#### Migration Script
**File**: `scripts/migrate-refinements-to-drafts.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

async function migrateRefinementsToDrafts() {
  const supabase = createClient(...)
  
  // Get all users with refinements
  const { data: users } = await supabase
    .from('refinements')
    .select('user_id, vision_id')
    .eq('operation_type', 'refine_vision')
    .distinct()
  
  for (const { user_id, vision_id } of users) {
    console.log(`Migrating user ${user_id}...`)
    
    // Get active vision
    const { data: activeVision } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', vision_id)
      .single()
    
    // Create draft vision
    const { data: draft } = await supabase
      .from('vision_versions')
      .insert({
        ...activeVision,
        id: undefined, // Generate new ID
        is_active: false,
        is_draft: true,
        title: activeVision.title + ' (Draft)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    // Get all refinements for this vision
    const { data: refinements } = await supabase
      .from('refinements')
      .select('*')
      .eq('user_id', user_id)
      .eq('vision_id', vision_id)
      .eq('operation_type', 'refine_vision')
      .order('created_at', { ascending: false })
    
    // Apply most recent refinement per category to draft
    const categoryMap = new Map()
    for (const ref of refinements) {
      if (!categoryMap.has(ref.category)) {
        categoryMap.set(ref.category, ref.output_text)
      }
    }
    
    // Update draft with all refinements
    const updates: any = {}
    for (const [category, text] of categoryMap.entries()) {
      updates[category] = text
    }
    
    await supabase
      .from('vision_versions')
      .update(updates)
      .eq('id', draft.id)
    
    // Mark refinements as migrated
    await supabase
      .from('refinements')
      .update({ migrated_to_draft_id: draft.id })
      .eq('user_id', user_id)
      .eq('vision_id', vision_id)
    
    console.log(`✓ Migrated ${categoryMap.size} categories`)
  }
  
  console.log('Migration complete!')
}
```

### Phase 6: Testing

#### 6.1 Unit Tests
```typescript
// Test draft creation
test('creates draft vision from active vision', async () => {
  const active = await createActiveVision(user)
  const draft = await ensureDraftExists(active.id)
  
  expect(draft.is_active).toBe(false)
  expect(draft.is_draft).toBe(true)
  expect(draft.user_id).toBe(user.id)
})

// Test draft update
test('updates draft category', async () => {
  const draft = await getDraftVision(user.id)
  await updateDraftCategory(draft.id, 'health', 'New health vision')
  
  const updated = await getDraftVision(user.id)
  expect(updated.health).toBe('New health vision')
})

// Test draft commit
test('commits draft as new active version', async () => {
  const oldActive = await getActiveVision(user.id)
  const draft = await getDraftVision(user.id)
  
  await commitDraft(draft.id)
  
  const newActive = await getActiveVision(user.id)
  const oldActiveUpdated = await getVision(oldActive.id)
  
  expect(newActive.id).toBe(draft.id)
  expect(newActive.is_active).toBe(true)
  expect(newActive.is_draft).toBe(false)
  expect(oldActiveUpdated.is_active).toBe(false)
})
```

#### 6.2 Integration Tests
- Create draft → Edit → Commit flow
- Multiple category edits in single draft
- Draft persistence across sessions
- Concurrent draft edits (race conditions)

#### 6.3 E2E Tests
- Full refinement flow with new architecture
- Draft preview page renders correctly
- Commit creates new version properly
- Old refinements still readable (if kept)

### Phase 7: Deployment

#### 7.1 Pre-deployment
1. ✅ Review all database migrations
2. ✅ Test migrations on staging database
3. ✅ Backup production database
4. ✅ Run migration script on staging
5. ✅ Test frontend on staging with migrated data

#### 7.2 Deployment Steps
1. Deploy database migrations (schema changes)
2. Run data migration function (refinements → drafts)
3. Deploy backend API changes
4. Deploy frontend changes
5. Monitor for errors

#### 7.3 Rollback Plan
If issues arise:
1. Revert frontend/backend deployments
2. Restore database from backup (if necessary)
3. Refinements table still has original data (if using Option A)

---

## Breaking Changes

### API Changes
- `GET /api/vision/draft?id={visionId}` → Now returns draft vision directly, not combined view
- Need to add new endpoints: `/create`, `/update`, `/commit`, `/delete`

### Frontend Changes
- Draft loading logic changes significantly
- State management needs draft vision ID
- URL structure may change (optional)

### Database Changes
- New columns on vision_versions
- New indexes
- New constraints

---

## Timeline Estimate

- Phase 1 (Database): ✅ Complete (migrations created)
- Phase 2 (API Layer): 4-6 hours
- Phase 3 (Frontend): 6-8 hours
- Phase 4 (Helpers): 2 hours
- Phase 5 (Migration): 2-3 hours
- Phase 6 (Testing): 4-6 hours
- Phase 7 (Deployment): 2 hours

**Total: 20-27 hours**

---

## Questions to Resolve

1. **URL structure**: Keep `/life-vision/{activeId}/refine/draft` or change to `/life-vision/draft/{draftId}`?
2. **Version numbering**: Should draft have same version as base, or incremented?
3. **Multiple drafts**: Do we want to support multiple drafts per user, or strictly one?
4. **Refinements deprecation**: Keep for history (Option A) or remove completely (Option B)?
5. **Title handling**: Auto-append " (Draft)" or let user set title?

---

## Next Steps

1. Review and approve this plan
2. Answer questions above
3. Run database migrations on staging
4. Begin API layer implementation
5. Test thoroughly before production


