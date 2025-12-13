# Profile System Restructure Plan

**Date:** December 7, 2024  
**Status:** 🚧 In Progress

## Overview

Restructuring the `/profile` system to match the Life Vision pattern with inline editing and yellow change highlighting for drafts/new versions.

---

## New Structure

### 1. `/profile/[id]` - View with Inline Editing

**Changes:**
- Enable inline editing on all fields via ProfileField component
- Click "Edit" icon next to any field → edit inline → save immediately
- No separate edit page needed for viewing
- Similar to life-vision's inline editing

**Features:**
- View profile data
- Inline edit capability (click edit icon on any field)
- Save changes immediately (field-level updates)
- Profile picture upload
- Media lightbox
- Version management

---

### 2. `/profile/[id]/draft` - Draft View with Yellow Highlighting

**New Page** - Shows draft profile with yellow highlighting for changed fields

**Similar to:** `/life-vision/[id]/draft`

**Features:**
- Shows which fields have changed from parent version (yellow borders/highlights)
- Inline editing of all fields
- "Commit as Active" button to promote draft to active profile
- Parent profile tracked via `parent_id`
- Yellow color: `#FFD700` (same as life-vision)

**Yellow Highlighting:**
- Field borders: `border: 2px solid #FFD70080` (yellow with transparency)
- Section headers with changes: Yellow indicator badge
- Count of changed fields: `X of Y fields modified`

**UI Pattern:**
```tsx
{isFieldChanged(draft, parent, 'first_name') && (
  <div style={{ border: '2px solid #FFD70080' }}>
    <ProfileField ... />
  </div>
)}
```

---

### 3. `/profile/[id]/new` - New Version with Change Tracking

**New Page** - Replaces `/profile/edit`

**Purpose:** Create new profile version with change tracking from parent

**Features:**
- Shows all sections like `/edit`
- Yellow highlighting for sections/fields that differ from parent
- Section-level indicators showing what's changed
- Save as Draft or Commit as Active
- Full ProfileSidebar navigation

**Sections with Changes:**
- Yellow indicator next to section name in sidebar
- "Changed" badge on section cards
- Field-level yellow highlighting within sections

---

## Database Changes

### Migration: `20251207000001_add_parent_id_to_user_profiles.sql`

```sql
ALTER TABLE user_profiles
ADD COLUMN parent_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

CREATE INDEX idx_user_profiles_parent_id ON user_profiles(parent_id);
```

**Features:**
- Auto-sets `parent_id` when creating drafts (trigger)
- Back-fills existing drafts with best-guess parent
- Enables change tracking similar to life-vision

---

## Helper Functions

### New File: `src/lib/profile/draft-helpers.ts`

Similar to `src/lib/life-vision/draft-helpers.ts`

**Key Functions:**
```typescript
ensureDraftExists(activeProfileId) → Create or get draft
getActiveProfile(userId) → Get active profile
getDraftProfile(userId) → Get draft if exists
getParentProfile(parentId) → Get parent for comparison
updateDraftField(draftId, fieldKey, value) → Update single field
commitDraft(draftId) → Promote draft to active
deleteDraft(draftId) → Delete draft
getChangedFields(draft, parent) → List changed fields
isFieldChanged(draft, parent, fieldKey) → Check if field changed
getChangedSections(draft, parent) → Get sections with changes
hasDraft(userId) → Check if user has active draft
```

---

## Routing Changes

### Old Structure
```
/profile              → Dashboard (list versions)
/profile/edit         → Edit active profile
/profile/new          → Create first profile
/profile/[id]         → View specific version (read-only)
/profile/[id]/edit    → Edit specific version
```

### New Structure
```
/profile              → Dashboard (list versions)
/profile/new          → Create first profile (keep as-is)
/profile/[id]         → View with INLINE EDITING ⭐
/profile/[id]/draft   → View draft with YELLOW HIGHLIGHTS ⭐
/profile/[id]/new     → Create new version with CHANGE TRACKING ⭐
```

**Deprecate:**
- `/profile/edit` → Redirect to `/profile/[activeId]` (inline editing)
- `/profile/[id]/edit` → Redirect to `/profile/[id]` (inline editing)
- `/profile/[id]/edit/draft` → Redirect to `/profile/[id]/draft`

---

## Implementation Checklist

### Phase 1: Database & Helpers ✅
- [x] Create migration for `parent_id`
- [x] Create `draft-helpers.ts`
- [x] Update TypeScript interfaces
- [x] Update API to set `parent_id`

### Phase 2: Page Modifications 🚧
- [ ] Modify `/profile/[id]/page.tsx` - Enable inline editing
- [ ] Create `/profile/[id]/draft/page.tsx` - Yellow highlighting
- [ ] Create `/profile/[id]/new/page.tsx` - Replace `/edit`

### Phase 3: Components
- [ ] Create `ProfileSectionCard.tsx` - Section card with change indicator
- [ ] Update `ProfileField.tsx` - Add yellow highlighting prop
- [ ] Create `FieldChangeIndicator.tsx` - Show change status

### Phase 4: Navigation
- [ ] Update navigation links to use new structure
- [ ] Add redirects for deprecated routes
- [ ] Update dashboard buttons

### Phase 5: Testing
- [ ] Test inline editing on `/profile/[id]`
- [ ] Test draft creation and yellow highlighting
- [ ] Test commit draft functionality
- [ ] Test new version creation with change tracking

---

## Color System (from Life Vision)

```typescript
const NEON_YELLOW = '#FFD700'  // Pure yellow for highlights
const YELLOW_BORDER = '#FFD70080'  // 50% transparent for borders
const YELLOW_BG = '#FFD70020'  // 12.5% transparent for backgrounds
```

**Usage:**
- **Changed field borders:** `border: 2px solid ${YELLOW_BORDER}`
- **Changed section indicators:** Background with `${YELLOW_BG}`
- **Change count badges:** Text color `${NEON_YELLOW}`

---

## Example: Yellow Highlighting Pattern

```tsx
// From VisionCategoryCard.tsx
const isRefined = isCategoryRefined(draftVision, categoryKey)

<div 
  className={`rounded-lg px-4 py-3 ${!isRefined ? 'border-neutral-700' : ''}`}
  style={isRefined ? { border: `2px solid ${NEON_YELLOW}80` } : undefined}
>
  <ProfileField 
    label="First Name"
    value={draft.first_name}
    editable={true}
    onSave={handleFieldSave}
  />
</div>
```

---

## API Changes

### POST `/api/profile` - Enhanced
- Automatically sets `parent_id` when creating drafts
- Tracks source profile for change comparison

### GET `/api/profile?versionId={id}`
- Returns `parent_id` in response
- Client can fetch parent for comparison

---

## Benefits

✅ **Simpler UX** - Inline editing instead of separate edit pages  
✅ **Visual Clarity** - Yellow highlights show exactly what changed  
✅ **Consistency** - Matches Life Vision pattern users already know  
✅ **Better Versioning** - Parent tracking enables rich diff views  
✅ **Faster Edits** - Edit fields without leaving view page

---

## Migration Path for Users

**Current users with existing profiles:**
1. Migration auto-fills `parent_id` for existing drafts (best guess)
2. New drafts will have accurate `parent_id` via trigger
3. Existing routes continue to work via redirects
4. No data loss or breaking changes

**New users:**
1. Create profile via `/profile/new` (unchanged)
2. View/edit inline on `/profile/[id]`
3. Create drafts → auto-tracked via `parent_id`
4. Yellow highlights work immediately

---

## Next Steps

1. ✅ Complete database migration
2. 🚧 Implement inline editing on main page
3. ⏳ Create draft page with yellow highlights
4. ⏳ Create new version page
5. ⏳ Update navigation and redirects
6. ⏳ Test full flow
7. ⏳ Deploy to staging
8. ⏳ User acceptance testing

---

## Files Created/Modified

### Created
- `supabase/migrations/20251207000001_add_parent_id_to_user_profiles.sql`
- `src/lib/profile/draft-helpers.ts`
- `src/app/profile/[id]/draft/page.tsx` (pending)
- `src/app/profile/[id]/new/page.tsx` (pending)
- `docs/features/PROFILE_RESTRUCTURE_PLAN.md`

### Modified
- `src/lib/supabase/profile.ts` - Added `parent_id` to interface
- `src/app/api/profile/route.ts` - Set `parent_id` when creating versions
- `src/app/profile/[id]/page.tsx` - Enable inline editing (pending)

---

**Status:** Migration and helpers complete. Ready to implement pages.



