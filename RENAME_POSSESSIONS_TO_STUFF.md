# Rename "Possessions" to "Stuff"

## What Changed

The category name `possessions` has been renamed to `stuff` across the database.

## Migration Applied

Run: `supabase/migrations/20250128000004_rename_possessions_to_stuff.sql`

## Tables Updated

1. **vision_versions** - Column renamed `possessions` → `stuff`
2. **assessment_results** - JSONB key in `category_scores` updated
3. **assessment_responses** - Category value updated
4. **journal_entries** - Category value updated
5. **refinements** - Category value updated
6. **viva_conversations** - Category value updated
7. **vibrational_links** - Both `category_a` and `category_b` updated

## Note

`user_profiles.possessions_lifestyle_story` column name remains unchanged - this is a column name, not a category reference.

## Code Changes Needed

Update these files to use `stuff` instead of `possessions`:

### TypeScript/Type Definitions
- `src/types/assessment.ts` - Category type definition
- All component files that reference category names

### Component Files
- `src/app/profile/components/PossessionsLifestyleSection.tsx` - Consider renaming to `StuffLifestyleSection.tsx`
- `src/lib/design-system/vision-categories.ts` - Update category key
- `src/lib/assessment/questions.ts` - Update category references
- `src/lib/viva/profile-analyzer.ts` - Update category references
- All files that handle category names

### Data Files
- Update any hardcoded category arrays or mappings

## Testing Checklist

- [ ] Run migration in production
- [ ] Verify vision_versions.stuff column exists
- [ ] Check assessment_results.category_scores has 'stuff' key
- [ ] Verify all category references in code updated
- [ ] Test vision building flow
- [ ] Test journal entries for 'stuff' category
- [ ] Test assessment flow
- [ ] Verify VIVA conversations work with 'stuff' category
