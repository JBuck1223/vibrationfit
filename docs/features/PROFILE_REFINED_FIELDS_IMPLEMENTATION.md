# Profile Refined Fields Implementation

**Date:** December 8, 2024  
**Status:** ✅ Complete

## Overview

Implemented field-level refinement tracking for profile drafts using `refined_fields` array. Section-level status is derived from fields for UI display. Mirrors life-vision's `refined_categories` pattern.

**How it Works:**
- **For UI Display**: Draft and Refine pages calculate changed fields on-the-fly by comparing draft to parent (most accurate)
- **For Tracking**: API auto-populates `refined_fields` in database when fields are edited (for analytics and history)
- **Single Source**: Calculated changes are the source of truth for yellow highlighting

---

## What Was Implemented

### 1. Database Migration ✅

**File:** `supabase/migrations/20251208000001_add_refined_fields_to_profiles.sql`

- Added `refined_fields TEXT[]` column to `user_profiles` table
- Created GIN index for efficient array queries
- Documented purpose in column comment

### 2. TypeScript Interface ✅

**File:** `src/lib/supabase/profile.ts`

Added to `UserProfile` interface:
```typescript
refined_fields?: string[]
```

### 3. Draft Helper Functions ✅

**File:** `src/lib/profile/draft-helpers.ts`

Added 4 new functions:
- `getRefinedFields(draft)` - Get array of refined field keys
- `isFieldRefined(draft, fieldKey)` - Check if specific field is refined
- `getRefinedSections(draft)` - Derive section list from refined fields
- `isSectionRefined(draft, sectionKey)` - Check if section has refined fields

**Field-to-Section Mapping:**
Complete mapping of 80+ profile fields to their 13 sections (personal + 12 life categories).

### 4. API Auto-Calculation ✅

**File:** `src/app/api/profile/route.ts`

In PUT endpoint:
- After updating draft fields, automatically calculates `refined_fields`
- Compares draft to parent profile
- Updates `refined_fields` array in database
- Returns updated array in API response

**Logic:**
```typescript
if (profile.parent_id && profile.is_draft) {
  const parent = await getParentProfile(profile.parent_id)
  const refinedFields = getChangedFields(profile, parent)
  await supabase.update({ refined_fields: refinedFields })
}
```

### 5. Refine Page Updates ✅

**File:** `src/app/profile/[id]/refine/page.tsx`

- Uses `getRefinedSections()` to derive section status from fields
- Uses `isFieldRefined()` for field-level highlighting
- Yellow checkmarks on refined section icons
- Badge shows "X of 13 Sections Refined"
- Category selector highlights refined sections in yellow

### 6. Draft Page Updates ✅

**File:** `src/app/profile/[id]/draft/page.tsx`

- Uses `getRefinedFields()` and `getRefinedSections()` from draft
- Displays refined field count in badge
- Displays refined section count
- Section icons highlighted in yellow if refined
- Individual fields highlighted if in `refined_fields` array

---

## Data Flow

### Display Flow (Draft & Refine Pages)
```
Page loads draft profile
  ↓
Fetch parent profile
  ↓
Calculate changed fields on client (getChangedFields)
  ↓
Calculate changed sections on client (getChangedSections)
  ↓
Store in component state (changedFields, changedSections)
  ↓
Render UI with yellow highlights
  ↓
User sees exactly which fields differ from parent
```

### Background Tracking (for analytics)
```
User edits field in draft
  ↓
API PUT /profile?profileId={draftId}
  ↓
Update field value in database
  ↓
Auto-calculate refined_fields (compare to parent)
  ↓
Update refined_fields array in DB
  ↓
Track refinement history for analytics
```

---

## Benefits

### Single Source of Truth
- Fields stored in `refined_fields`
- Sections derived via `getRefinedSections()`
- No redundant data

### Maximum Granularity
- Know exactly which fields changed
- Can show field-level highlights
- Can show section-level summaries

### Flexible Display
- UI can show: "5 fields changed" OR "3 sections refined"
- Detailed view: highlight specific fields
- Summary view: checkmarks on sections

### Analytics Ready
- Track which fields users refine most
- Understand refinement patterns
- Optimize UI based on data

---

## Example Data

### Draft Profile with Refined Fields:
```json
{
  "id": "abc123",
  "user_id": "user456",
  "parent_id": "xyz789",
  "is_draft": true,
  "refined_fields": [
    "clarity_health",
    "dream_health",
    "exercise_frequency",
    "partner_name",
    "relationship_status",
    "city",
    "state"
  ],
  // Other profile fields...
}
```

### Derived Sections:
```typescript
getRefinedSections(draft) 
// Returns: ["health", "love", "home"]

isSectionRefined(draft, "health") 
// Returns: true (has clarity_health, dream_health, exercise_frequency)

isFieldRefined(draft, "partner_name") 
// Returns: true (in refined_fields array)
```

---

## UI Indicators

### Category Selector
- Yellow checkmark on refined sections
- Yellow icon color for refined sections
- Green highlight for selected section

### Draft Page
- Badge: "12 fields changed"
- Badge: "4 sections refined"
- Section icons: Yellow border + background if refined
- Fields: Yellow border + background if refined

### Refine Page
- Same indicators as draft page
- Side-by-side comparison
- Yellow highlights on draft side only

---

## Testing Checklist

### Database
- [ ] Run migration: `supabase db push`
- [ ] Verify `refined_fields` column exists
- [ ] Check GIN index is created

### API
- [ ] Edit a field in draft profile
- [ ] Verify `refined_fields` array updates in database
- [ ] Check API response includes `refined_fields`
- [ ] Verify only changed fields are in array

### UI - Draft Page
- [ ] Badge shows correct field count
- [ ] Badge shows correct section count
- [ ] Yellow checkmarks on refined sections
- [ ] Yellow highlights on refined fields
- [ ] Section icons turn yellow when refined

### UI - Refine Page
- [ ] Category selector shows yellow checkmarks
- [ ] Badge shows "X of 13 sections refined"
- [ ] Side-by-side comparison works
- [ ] Draft side shows yellow highlights
- [ ] Active side has no highlights

### Derived Logic
- [ ] `getRefinedSections()` returns correct sections
- [ ] `isSectionRefined()` works for all sections
- [ ] Field-to-section mapping is accurate
- [ ] Multiple fields in same section counted correctly

---

## Files Modified

```
Created:
- supabase/migrations/20251208000001_add_refined_fields_to_profiles.sql

Modified:
- src/lib/supabase/profile.ts (added refined_fields to interface)
- src/lib/profile/draft-helpers.ts (added 4 new functions + field mapping)
- src/app/api/profile/route.ts (auto-calculate refined_fields on PUT)
- src/app/profile/[id]/refine/page.tsx (use refined sections/fields)
- src/app/profile/[id]/draft/page.tsx (use refined sections/fields)
```

---

## Migration Command

```bash
cd /Users/jordanbuckingham/Desktop/vibrationfit
supabase db push
```

---

**Status:** ✅ Implementation Complete  
**Next:** Run migration and test

