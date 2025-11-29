# Life Vision Refinement Tracking

**Last Updated:** November 27, 2024

## Overview

The `refined_categories` column tracks which categories have been refined in each vision version. This allows us to see which parts of a user's life vision they've actively worked on improving.

## Database Schema

```sql
-- Column in vision_versions table
refined_categories JSONB DEFAULT '[]'::jsonb
-- Format: ["health", "fun", "work"]
-- Automatically populated when categories are edited in a draft
```

## Automatic Tracking

The `track_category_refinement` trigger automatically adds categories to the `refined_categories` array when they're edited in a draft vision:

```sql
-- Trigger fires on UPDATE of vision_versions
-- Compares NEW values with OLD values
-- If a category field changed, adds it to refined_categories
```

## TypeScript Helpers

### Get Refined Categories for a Draft

```typescript
import { getRefinedCategories } from '@/lib/life-vision/draft-helpers'

const refinedCats = getRefinedCategories(draftVision)
// Returns: ["health", "fun", "work"]
```

### Check if Category is Refined

```typescript
import { isCategoryRefined } from '@/lib/life-vision/draft-helpers'

const isRefined = isCategoryRefined(draftVision, 'health')
// Returns: true or false
```

### Get Total Refinements Across All Versions

```typescript
import { getUserTotalRefinements } from '@/lib/life-vision/draft-helpers'

const { count, categories } = await getUserTotalRefinements(userId)
console.log(`User has refined ${count} unique categories`)
console.log(`Refined categories: ${categories.join(', ')}`)
```

### Get Detailed Refinement Stats

```typescript
import { getUserRefinementStats } from '@/lib/life-vision/draft-helpers'

const stats = await getUserRefinementStats(userId)
console.log(`Total unique refinements: ${stats.totalUniqueRefinements}`)
console.log(`Versions with refinements: ${stats.totalVersionsWithRefinements}`)

stats.refinementsByVersion.forEach(version => {
  console.log(`V${version.versionNumber}: ${version.refinementCount} refinements`)
  console.log(`Categories: ${version.refinedCategories.join(', ')}`)
})
```

## Database Function

### get_user_total_refinements(user_id)

Returns the total count of unique category refinements across ALL versions for a user.

```sql
-- Call from SQL
SELECT * FROM get_user_total_refinements('user-uuid-here');

-- Returns:
-- total_refinement_count | refined_category_list
-- 8                      | {health,fun,work,money,love,family,home,travel}
```

```typescript
// Call from TypeScript
const { data } = await supabase.rpc('get_user_total_refinements', {
  p_user_id: userId
})
```

## Use Cases

### 1. User Progress Dashboard
Show how many life areas the user has actively worked on:

```typescript
const { count, categories } = await getUserTotalRefinements(user.id)
// "You've refined 8 out of 12 life areas"
```

### 2. Gamification/Achievements
Award badges for refinement milestones:

```typescript
const stats = await getUserRefinementStats(user.id)
if (stats.totalUniqueRefinements >= 12) {
  // Award "Complete Vision Architect" badge
}
```

### 3. Analytics
Track which categories users refine most:

```typescript
const allUsers = await getAllUsers()
const categoryFrequency = {}

for (const user of allUsers) {
  const { categories } = await getUserTotalRefinements(user.id)
  categories.forEach(cat => {
    categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1
  })
}
// See which life areas users care about most
```

### 4. Version History Display
Show refinement indicators in version history:

```typescript
const stats = await getUserRefinementStats(userId)
stats.refinementsByVersion.forEach(version => {
  // Display yellow badges for refined categories in version card
  version.refinedCategories.forEach(cat => {
    // Render category badge with yellow highlight
  })
})
```

## Migration

The migration file is located at:
```
supabase/migrations/20251127000000_add_user_total_refinements_function.sql
```

Run it with:
```bash
# The migration will be applied automatically on next deployment
# Or manually apply it:
supabase db push
```

## Notes

- `refined_categories` is only populated for **draft** visions
- When a draft is committed, the refined categories are preserved in that version's record
- Comparing across all versions shows the user's refinement journey
- The tracking is automatic via database trigger - no manual updates needed

