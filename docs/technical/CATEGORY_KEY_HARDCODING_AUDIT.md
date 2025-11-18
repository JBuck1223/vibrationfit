# Category Key Hardcoding Audit

**Last Updated:** November 18, 2025

## Problem

Category keys are hardcoded throughout the codebase in dozens of places, leading to:
- ❌ Maintenance issues when category keys change
- ❌ Risk of typos and mismatches (e.g., `'fun-recreation'` vs `'fun'`)
- ❌ Inconsistency across the application
- ❌ Bugs when keys don't match (see: imagination prompts failure)

## Single Source of Truth

**File:** `src/lib/design-system/vision-categories.ts`

**Canonical Category Keys:**
- `forward` (order: 0)
- `fun` (order: 1)
- `health` (order: 2)
- `travel` (order: 3)
- `love` (order: 4)
- `family` (order: 5)
- `social` (order: 6)
- `home` (order: 7)
- `work` (order: 8)
- `money` (order: 9)
- `stuff` (order: 10)
- `giving` (order: 11)
- `spirituality` (order: 12)
- `conclusion` (order: 13)

## New Helpers Available

```typescript
import {
  LIFE_CATEGORY_KEYS,           // ['fun', 'health', ...]
  CATEGORY_KEYS,                  // { FUN: 'fun', HEALTH: 'health', ... }
  getCategoryStoryField,          // 'fun' -> 'fun_story'
  getCategoryClarityField,        // 'fun' -> 'clarity_fun'
  getCategoryContrastField,       // 'fun' -> 'contrast_fun'
  getCategoryFields,              // 'fun' -> { clarity: 'clarity_fun', contrast: 'contrast_fun' }
  CATEGORY_STORY_FIELDS,          // { fun: 'fun_story', health: 'health_story', ... }
  CATEGORY_CLARITY_FIELDS,        // { fun: 'clarity_fun', health: 'clarity_health', ... }
  CATEGORY_CONTRAST_FIELDS        // { fun: 'contrast_fun', health: 'contrast_health', ... }
} from '@/lib/design-system/vision-categories'
```

---

## Files That Need Fixing

### ✅ COMPLETED

- [x] `src/lib/viva/prompts/ideal-state/index.ts` - Updated to use actual category keys
- [x] `src/lib/viva/profile-context.ts` - Updated to use actual category keys
- [x] `src/app/life-vision/new/category/[key]/page.tsx` - Using `getCategoryFields()` and `getCategoryStoryField()`
- [x] `src/lib/design-system/vision-categories.ts` - Added all helper functions

### 🔶 HIGH PRIORITY (Causes bugs if wrong)

- [ ] `src/app/api/viva/category-summary/route.ts`
  - **Line 17-30:** `categoryStories` map (actually mapping to `clarity_` fields, misnamed variable)
  - **Line 39-51:** `categoryFields` map for profile field extraction
  - **Fix:** Use `getCategoryClarityField()` or rename variable to `categoryClarityFields`

- [ ] `src/lib/viva/prompts/category-summary-prompt.ts`
  - **Line 31-44:** `categoryStories` map (actually mapping to `clarity_` fields)
  - **Fix:** Use `getCategoryClarityField()`

- [ ] `src/app/api/viva/chat/route.ts`
  - **Line 158:** Regex with hardcoded category list for vision section retrieval
  - **Line 164-195:** Category name mapping for section lookup
  - **Fix:** Generate regex from `LIFE_CATEGORY_KEYS`, use `getVisionCategoryLabel()`

- [ ] `src/lib/viva/prompt-flatteners.ts`
  - **Line 138:** Hardcoded categories array in function parameter
  - **Fix:** Use `LIFE_CATEGORY_KEYS` as default

### 🔷 MEDIUM PRIORITY (Maintenance/consistency issues)

- [ ] `src/app/profile/[id]/page.tsx`
  - **Line 53-64:** `profileCategoryKeyMap` - Identity mapping
  - **Line 69-80:** `assessmentCategoryMap` - Maps to assessment keys
  - **Line 111:** `profileCategoryKeys` array
  - **Line 212:** List of clarity field names
  - **Line 660-1456:** Giant switch statement for category-specific UI
  - **Fix:** Use `LIFE_CATEGORY_KEYS` for arrays, consider componentizing switch

- [ ] `src/app/profile/[id]/edit/page.tsx`
  - **Line 208:** List of clarity field names
  - **Line 613-672:** Switch statement for edit sections
  - **Line 710-746:** Another switch for field selections
  - **Fix:** Use `CATEGORY_CLARITY_FIELDS` or helper functions

- [ ] `src/app/profile/new/page.tsx`
  - **Line 94:** List of clarity field names
  - **Line 242-246:** Switch for form sections
  - **Line 305-307:** Switch for data handling
  - **Fix:** Use helper constants

- [ ] `src/app/profile/edit/page.tsx`
  - **Line 145:** List of clarity field names
  - **Line 453-457:** Switch statements
  - **Line 521-524:** More switches
  - **Fix:** Use helper constants

- [ ] `src/app/profile/[id]/edit/draft/page.tsx`
  - **Line 151:** List of clarity field names
  - **Line 530-534:** Switch statements
  - **Line 598-601:** More switches
  - **Fix:** Use helper constants

- [ ] `src/lib/viva/profile-analyzer.ts`
  - **Lines 384-446:** Multiple switch statements analyzing profiles
  - **Lines 510-520:** More category-specific logic
  - **Lines 664-721:** Category-specific analysis
  - **Fix:** Refactor to use category-driven logic with `VISION_CATEGORIES`

### 🔵 LOW PRIORITY (Documentation/comments)

- [ ] `src/app/life-vision/new/README.md`
  - **Line 91:** Hardcoded field list in documentation
  - **Fix:** Reference `VISION_CATEGORIES` or keep as example

- [ ] `src/lib/viva/knowledge/tools/profile.md`
  - **Line 17:** Hardcoded field names in AI tool documentation
  - **Fix:** Generate from constants or keep as reference

- [ ] `src/lib/viva/knowledge/tools/life-vision.md`
  - **Line 80:** Hardcoded category field list
  - **Fix:** Generate or keep as reference

### 🟢 SPECIAL CASES

- [ ] `src/lib/viva/context-detector.ts`
  - **Line 79-89:** Keyword mappings for category detection
  - **Note:** This might intentionally include variations/synonyms
  - **Action:** Review if this should map to canonical keys or keep as-is

- [ ] `src/app/profile/components/ProfileSidebar.tsx`
  - **Line 20-23:** Partial category mapping
  - **Fix:** Complete mapping or use helpers

---

## Recommended Approach

### Phase 1: Fix Critical Bugs (HIGH PRIORITY)
1. Fix API routes that have incorrect mappings
2. Fix prompt builders that are failing
3. Test all life vision flows

### Phase 2: Refactor for Maintainability (MEDIUM)
1. Update profile pages to use helpers
2. Refactor large switch statements into component maps
3. Update all hardcoded arrays to use `LIFE_CATEGORY_KEYS`

### Phase 3: Documentation & Polish (LOW)
1. Update documentation files
2. Add TypeScript types for category keys
3. Create linting rule to prevent hardcoding

---

## Testing Checklist

After fixes, verify:
- [ ] Life vision creation flow works for all 12 categories
- [ ] Imagination prompts generate for all categories
- [ ] Profile pages display all categories correctly
- [ ] Assessment scores map correctly
- [ ] Vision section retrieval in chat works
- [ ] Category field lookups work in all APIs

---

## Future Prevention

### Add TypeScript Strict Types

```typescript
// In vision-categories.ts
export type CategoryKey = typeof VISION_CATEGORIES[number]['key']

// Usage
function doSomething(category: CategoryKey) {
  // TypeScript will error if you pass an invalid key
}
```

### Add ESLint Rule

Create a rule to flag hardcoded category key patterns:
- Strings matching category names in Record types
- Arrays with multiple category names
- Object keys that look like categories

---

## Notes

- Some files use `clarity_` fields incorrectly named as `categoryStories`
- Profile fields have THREE naming patterns:
  - Story fields: `{key}_story`
  - Clarity fields: `clarity_{key}`
  - Contrast fields: `contrast_{key}`
- Assessment uses yet another set of keys (with underscores like `fun_recreation`)
- Need to audit if assessment keys should be canonical or remain different

