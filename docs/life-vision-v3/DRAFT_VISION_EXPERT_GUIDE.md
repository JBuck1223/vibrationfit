# Draft Vision System - Expert Guide

**Last Updated:** November 12, 2025  
**Status:** ✅ Current System  
**Replaces:** REFINEMENT_SYSTEM_EXPERT_GUIDE_OLD.md (archived)

---

## Overview
The draft vision system enables intelligent, conversational refinement of life visions. Users can refine individual categories, see visual indicators of changes, and commit all refinements atomically as a new vision version.

**System Architecture:** Draft visions are stored in the `vision_versions` table with `is_draft=true` and `is_active=false` flags. The `refined_categories` JSONB array tracks which categories have been modified.

---

## Migration Complete ✅
This system successfully replaced the old `refinements` table approach with a fully integrated draft vision system using `vision_versions`.

## What Changed

### 1. **Database Schema** (Already Deployed)
- ✅ `vision_versions` table now has:
  - `is_draft` boolean (default: false)
  - `is_active` boolean (default: false) 
  - `refined_categories` JSONB array (default: [])
- ✅ Automatic tracking trigger: `track_category_refinement()`
- ✅ Helper functions for refined category management

### 2. **Backend APIs Updated**

#### `/api/vision/draft/create/route.ts`
- Creates a draft vision from an existing active vision
- Sets `is_draft=true`, `is_active=false`, `refined_categories=[]`

#### `/api/vision/draft/update/route.ts`
- Updates a specific category in draft vision
- Automatically adds category to `refined_categories` array
- Trigger handles tracking automatically

#### `/api/vision/draft/commit/route.ts`
- Commits draft as new active vision
- Increments version number
- Clears `refined_categories`
- Deactivates old active vision

#### `/api/vision/draft/route.ts` (Simplified)
- **Before**: Combined active vision with refinements on-the-fly
- **After**: Simply returns the draft vision from database

#### `/api/vision/route.ts`
- **Before**: Queried `refinements` table and built synthetic draft
- **After**: Queries draft vision directly from `vision_versions` table

### 3. **Frontend Pages Updated**

#### `src/app/life-vision/[id]/refine/page.tsx` (Main Refine Page)
**Changes:**
- Imported draft helper functions
- Added `draftVision` state
- Replaced `loadAllDrafts()` with `loadDraftVision()`
- Updated `saveDraft()` to use `updateDraftCategory()` helper
- Replaced `commitAllDrafts()` with `commitDraftVision()` using `commitDraft()` helper
- Removed old functions: `editDraft()`, `commitSingleDraft()`, `deleteDraft()`
- Updated category loading to read from draft vision
- Added visual indicators (yellow sparkle badges) for refined categories
- Draft status card now shows refined category count and badges

**Visual Improvements:**
- Categories with refinements show yellow icon color
- Small sparkle badge in top-right of refined category cards
- Draft status card displays refined category badges

#### `src/app/life-vision/[id]/refine/draft/page.tsx` (Draft Preview)
**Changes:**
- Imported draft helper functions
- Updated `commitDraftAsActive()` to use `commitDraft()` helper
- Updated data loading to use `getDraftVision()` instead of API call
- Updated `isDraft` logic to use `isCategoryRefined()` helper
- Added visual indicators for refined categories in category grid

**Visual Improvements:**
- Categories with refinements show yellow icon color
- Small sparkle badge in top-right of refined category cards
- Draft vision cards have yellow borders when refined

#### `src/app/life-vision/page.tsx` (Vision List)
**Changes:**
- Updated refinements count query
- **Before**: Counted rows in `refinements` table
- **After**: Counts `refined_categories` array length from draft vision
- Updated label from "Refinements" to "Categories Refined"

### 4. **Helper Library**

#### `src/lib/vision/draft-helpers.ts`
New utility functions for consistent draft management:
- `ensureDraftExists(activeVisionId)` - Creates draft if it doesn't exist
- `getDraftVision(userId)` - Fetches user's draft vision
- `updateDraftCategory(draftId, category, content)` - Updates category in draft
- `getRefinedCategories(draft)` - Gets list of refined categories
- `isCategoryRefined(draft, category)` - Checks if category is refined
- `commitDraft(draftId)` - Commits draft as new active vision
- `deleteDraft(draftId)` - Deletes draft vision
- `syncRefinedCategories(draftId)` - Manually syncs refined categories
- `hasDraft(userId)` - Checks if user has a draft

## Benefits of New System

### 1. **Performance**
- ✅ No need to combine data on-the-fly
- ✅ Single query to fetch complete draft vision
- ✅ Automatic tracking via database trigger

### 2. **Data Integrity**
- ✅ Draft vision is a complete, consistent entity
- ✅ Atomic commits (all-or-nothing)
- ✅ Version history preserved correctly

### 3. **Developer Experience**
- ✅ Cleaner, simpler code
- ✅ Consistent API across all endpoints
- ✅ Easy to understand data model
- ✅ Helper functions for common operations

### 4. **User Experience**
- ✅ Visual indicators show which categories are refined
- ✅ Clear distinction between draft and active visions
- ✅ Accurate "Categories Refined" count

## Visual Indicators

### Category Selection Grid
- **Refined categories**: Yellow icon color + sparkle badge
- **Unrefined categories**: Teal icon color

### Draft Status Card
- Shows count of refined categories
- Displays badges for each refined category
- Yellow theme for all draft-related elements

### Draft Preview
- Refined category cards have yellow borders
- Category grid shows sparkle badges
- Clear visual separation from active vision

## Testing Checklist

### Create Draft Flow
- [ ] Navigate to refine page
- [ ] Verify draft vision is created automatically
- [ ] Check that refined_categories starts as empty array

### Edit Draft Flow
- [ ] Select a category
- [ ] Make changes and save
- [ ] Verify category appears in refined_categories
- [ ] Check visual indicator appears (yellow icon + sparkle)
- [ ] View draft preview page
- [ ] Verify refined category has yellow border

### Commit Draft Flow
- [ ] Click "Commit Draft" button
- [ ] Verify new active vision is created
- [ ] Check version number is incremented
- [ ] Verify refined_categories is cleared
- [ ] Confirm old active vision is deactivated

### Multiple Categories
- [ ] Refine multiple categories
- [ ] Verify all appear in refined_categories
- [ ] Check draft status card shows correct count
- [ ] View draft preview
- [ ] Verify all refined categories have yellow borders

### Vision List Page
- [ ] Check "Categories Refined" stat
- [ ] Verify count matches draft vision

## Migration Notes

### Database
- No data migration needed (fresh columns)
- Old `refinements` table can remain (not queried anymore)
- Could be archived or used for audit trail

### Backward Compatibility
- New system completely replaces old system
- No fallback to refinements table
- Clean break from old architecture

### Rollback Strategy
If needed to rollback:
1. Restore old frontend files from git
2. Restore old API routes from git
3. Draft visions in database can be safely ignored (won't break anything)

## Next Steps

### Recommended
1. **Test thoroughly** in development
2. **Monitor logs** for any errors
3. **Consider archiving** old refinements table data
4. **Update documentation** if needed

### Optional Enhancements
1. Add "Discard Draft" button to delete draft
2. Show diff view comparing draft to active
3. Add draft auto-save indicator
4. Allow partial commits (select which categories to commit)

## Files Modified

### Backend
- ✅ `src/app/api/vision/draft/route.ts` (simplified)
- ✅ `src/app/api/vision/route.ts` (uses draft visions)
- ✅ `src/app/api/vision/draft/create/route.ts` (already updated)
- ✅ `src/app/api/vision/draft/update/route.ts` (already updated)
- ✅ `src/app/api/vision/draft/commit/route.ts` (already updated)

### Frontend
- ✅ `src/app/life-vision/[id]/refine/page.tsx` (main refine page)
- ✅ `src/app/life-vision/[id]/refine/draft/page.tsx` (draft preview)
- ✅ `src/app/life-vision/page.tsx` (vision list)

### Libraries
- ✅ `src/lib/vision/draft-helpers.ts` (helper functions)

### No Linter Errors
All files pass TypeScript and ESLint checks ✅

## Summary

The migration from the old refinements table system to the new draft vision system is **complete and ready for testing**. The new system provides:

- **Cleaner architecture** with draft visions as first-class entities
- **Better performance** with fewer queries and no on-the-fly combining
- **Visual feedback** showing users which categories have been refined
- **Atomic operations** for committing drafts
- **Automatic tracking** of refined categories via database trigger

All code changes have been implemented, tested for syntax errors, and are ready for functional testing!

