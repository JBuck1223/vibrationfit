# Profile Completion Percentage - Single Source of Truth

## Overview

The profile completion percentage calculation is centralized in a single utility function to ensure consistency across the entire application. This eliminates discrepancies between what's displayed in the UI and what's stored in the database.

**Location:** `src/lib/utils/profile-completion.ts`

## Purpose

- **Consistency**: Same calculation logic everywhere (API, client components, database)
- **Accuracy**: Always uses correct field names (e.g., `fun_story` not `fun_recreation_story`)
- **Maintainability**: Update the calculation in one place, affects entire app
- **Reliability**: Database values are always recalculated and updated

## How It Works

### Core Function

```typescript
import { calculateProfileCompletion } from '@/lib/utils/profile-completion'

const completionPercentage = calculateProfileCompletion(profileData)
```

### Field Categories

The calculation includes these field categories:

#### 1. Core Fields (7 fields)
Always required:
- `first_name`
- `last_name`
- `email`
- `phone`
- `date_of_birth`
- `gender`
- `profile_picture_url`

#### 2. Relationship Fields (Conditional)
- `relationship_status` (always counted)
- If not "Single":
  - `partner_name`
  - `relationship_length`

#### 3. Family Fields (Conditional)
- `has_children` (always counted)
- If `has_children === true`:
  - `number_of_children`
  - `children_ages`

#### 4. Health Fields (4 fields)
- `units`
- `height`
- `weight`
- `exercise_frequency`

#### 5. Location Fields (6 fields)
- `living_situation`
- `time_at_location`
- `city`
- `state`
- `postal_code`
- `country`

#### 6. Career Fields (5 fields)
- `employment_type`
- `occupation`
- `company`
- `time_in_role`
- `education`

#### 7. Financial Fields (5 fields)
- `currency`
- `household_income`
- `savings_retirement`
- `assets_equity`
- `consumer_debt`

#### 8. Life Category Story Fields (12 fields)
**Note:** Uses NEW field names (renamed from old schema):
- `fun_story` (was `fun_recreation_story`)
- `health_story` (was `health_vitality_story`)
- `travel_story` (was `travel_adventure_story`)
- `love_story` (was `romance_partnership_story`)
- `family_story` (was `family_parenting_story`)
- `social_story` (was `social_friends_story`)
- `home_story` (was `home_environment_story`)
- `work_story` (was `career_work_story`)
- `money_story` (was `money_wealth_story`)
- `stuff_story` (was `possessions_lifestyle_story`)
- `giving_story` (was `giving_legacy_story`)
- `spirituality_story` (was `spirituality_growth_story`)

#### 9. Structured Life Category Fields (15 fields)

**Fun & Recreation:**
- `hobbies`
- `leisure_time_weekly`

**Travel & Adventure:**
- `travel_frequency`
- `passport`
- `countries_visited`

**Social & Friends:**
- `close_friends_count`
- `social_preference`

**Possessions & Lifestyle:**
- `lifestyle_category`
- `primary_vehicle`

**Spirituality & Growth:**
- `spiritual_practice`
- `meditation_frequency`
- `personal_growth_focus`

**Giving & Legacy:**
- `volunteer_status`
- `charitable_giving`
- `legacy_mindset`

### Conditional Logic

The calculation uses intelligent conditionals:

1. **Relationship Fields**: If `relationship_status` is "Single", `partner_name` and `relationship_length` are not counted in the total.

2. **Family Fields**: If `has_children` is `false` or `null`, `number_of_children` and `children_ages` are not counted in the total.

3. **Field Value Check**: A field is considered "completed" if:
   - It's an array with length > 0
   - It's a boolean (always counts as completed)
   - It's not null, undefined, or empty string

### Calculation Formula

```
completion_percentage = Math.round((completedFields / totalFields) * 100)
```

## Integration Points

### 1. API Routes (`src/app/api/profile/route.ts`)

**GET Requests:**
- Always recalculates completion when fetching profile or versions
- Updates database with accurate completion percentage

**POST/PUT Requests:**
- Recalculates completion before saving
- Saves accurate completion to `completion_percentage` field
- Returns calculated completion in response

**Example:**
```typescript
import { calculateProfileCompletion } from '@/lib/utils/profile-completion'

// In GET handler
const completionPercentage = calculateProfileCompletion(profile)

// In POST/PUT handler
const completionPercentage = calculateProfileCompletion(cleanedProfileData)
await supabase
  .from('user_profiles')
  .update({ completion_percentage: completionPercentage })
  .eq('id', profileId)
```

### 2. Client Components

**Import and use:**
```typescript
import { calculateProfileCompletion } from '@/lib/utils/profile-completion'

// In component
const completionPercentage = calculateProfileCompletion(profile)
```

**Current Usage:**
- `src/app/profile/edit/page.tsx`
- `src/app/profile/[id]/edit/page.tsx`
- `src/app/profile/[id]/edit/draft/page.tsx`
- `src/app/profile/new/page.tsx`
- `src/components/DashboardContent.tsx`

### 3. Version Lists

When fetching versions for the dropdown, the API:
1. Fetches full profile data for each version
2. Recalculates completion percentage using the shared utility
3. Returns accurate completion in the version list

This ensures the version dropdown always shows correct percentages.

## Database Storage

The `completion_percentage` field in `user_profiles` table stores the calculated value, but:

- **Always recalculated** when fetching data (ensures accuracy)
- **Updated on save** (keeps database in sync)
- **Not relied upon directly** (always recalculated from actual field values)

## Field Name Changes

**Important:** The story fields were renamed in migration `20250130000000_rename_profile_story_fields.sql`. Always use the NEW names:

| Old Name | New Name |
|----------|----------|
| `fun_recreation_story` | `fun_story` |
| `health_vitality_story` | `health_story` |
| `travel_adventure_story` | `travel_story` |
| `romance_partnership_story` | `love_story` |
| `family_parenting_story` | `family_story` |
| `social_friends_story` | `social_story` |
| `home_environment_story` | `home_story` |
| `career_work_story` | `work_story` |
| `money_wealth_story` | `money_story` |
| `possessions_lifestyle_story` | `stuff_story` |
| `giving_legacy_story` | `giving_story` |
| `spirituality_growth_story` | `spirituality_story` |

## Best Practices

1. **Always use the shared utility** - Don't create duplicate calculation functions
2. **Import from the correct path** - `@/lib/utils/profile-completion`
3. **Recalculate on fetch** - Don't trust stored `completion_percentage` values
4. **Update database on save** - Keep `completion_percentage` field in sync
5. **Use correct field names** - Always use the NEW story field names

## Troubleshooting

### Issue: Completion percentage shows 0%
- **Cause**: Field might not be recognized or profile data is empty
- **Fix**: Check that profile data is passed correctly and field names match

### Issue: Completion percentage is incorrect
- **Cause**: Using old field names or duplicate calculation logic
- **Fix**: Ensure using shared utility and correct field names

### Issue: Version dropdown shows wrong percentages
- **Cause**: Not fetching full profile data or not recalculating
- **Fix**: Ensure API fetches full profile and recalculates for each version

### Issue: Database has wrong completion_percentage
- **Cause**: Old calculation logic or field name mismatch
- **Fix**: The API automatically recalculates and updates on every fetch/save

## Example Usage

```typescript
// ✅ CORRECT - Using shared utility
import { calculateProfileCompletion } from '@/lib/utils/profile-completion'

const profile = await fetchProfile()
const completion = calculateProfileCompletion(profile)
console.log(`Profile is ${completion}% complete`)

// ❌ WRONG - Don't create duplicate calculation
function calculateCompletionLocal(profile: any) {
  // ... duplicate logic
}
```

## Maintenance

When adding new profile fields:

1. **Update the utility** (`src/lib/utils/profile-completion.ts`):
   - Add field to appropriate category
   - Update field count documentation

2. **Test the calculation**:
   - Verify completion increases when field is filled
   - Verify completion decreases when field is cleared

3. **Update this documentation**:
   - Add field to appropriate category list
   - Update field count totals

## Total Field Count

- Core: 7 fields
- Relationship: 1-3 fields (conditional)
- Family: 1-3 fields (conditional)
- Health: 4 fields
- Location: 6 fields
- Career: 5 fields
- Financial: 5 fields
- Stories: 12 fields
- Structured: 15 fields

**Total:** ~61-67 fields (depending on relationship/family status)

## Summary

The completion percentage system uses a single source of truth located at `src/lib/utils/profile-completion.ts`. All API routes and client components import and use this function, ensuring consistent and accurate completion percentages throughout the application. The calculation intelligently handles conditional fields (relationship and family) and always uses the correct field names.

