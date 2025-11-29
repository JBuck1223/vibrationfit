# Life Vision Calculated Fields

**Last Updated:** November 29, 2024  
**Status:** Active

## Overview

Life Vision version numbers and completion percentages are **always calculated dynamically**, not stored in the database.

- **`version_number`**: Calculated based on chronological order (`created_at`)
- **`completion_percent`**: Calculated in frontend based on filled category fields

## How It Works

### Database Function
```sql
calculate_vision_version_number(p_vision_id, p_user_id)
```

**Logic:**
- Orders all visions for a user by `created_at` (oldest first)
- Assigns sequential numbers: V1, V2, V3...
- **Automatically handles deletions** - no gaps in numbering
- Example: If you delete V2, V3 becomes V2, V4 becomes V3, etc.

### Frontend Helper
```typescript
import { calculateVersionNumber, addCalculatedVersionNumbers } from '@/lib/life-vision/version-helpers'

// Calculate for single vision
const versionNum = await calculateVersionNumber(visionId)

// Calculate for array of visions
const visionsWithNumbers = await addCalculatedVersionNumbers(visions)
```

## Implementation

### When Creating Visions
- Set `version_number: 1` as a placeholder
- The actual version is calculated on fetch

### When Displaying Visions
- Always call the calculation function
- Never trust the stored `version_number` field

## Files Updated
- `/src/lib/life-vision/version-helpers.ts` - Helper functions
- `/src/app/life-vision/page.tsx` - Main list with calculated versions
- `/src/app/life-vision/[id]/draft/page.tsx` - Draft page
- `/src/app/life-vision/[id]/refine/page.tsx` - Refine page
- `/src/app/life-vision/new/assembly/page.tsx` - New vision creation
- `/src/app/api/vision/draft/create-manual/route.ts` - Manual draft API
- `/src/app/api/vision/draft/commit/route.ts` - Commit draft API

## Benefits

✅ **No gaps** - Always sequential (V1, V2, V3...) even after deletions  
✅ **No duplicates** - Can't accidentally create two V3s  
✅ **Accurate** - Based on actual creation order, not manual tracking  
✅ **Automatic** - No need to manually update version numbers

## Migration

Both `version_number` and `completion_percent` columns were removed from the `vision_versions` table in migration `20251129000000_remove_calculated_columns.sql`.

### Why Remove Them?

**Before:**
- Stored redundant data that could become stale
- Version numbers could have gaps or duplicates
- Completion could be out of sync with actual data

**After:**
- Single source of truth (calculated fresh every time)
- Version numbers always sequential (V1, V2, V3...)
- Completion always accurate based on current data

