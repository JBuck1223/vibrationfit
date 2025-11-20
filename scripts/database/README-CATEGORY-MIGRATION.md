# Category Migration (Vision Board & Journal)

## Problem
Both vision board items and journal entries in the database have mixed category formats:
- **Old format:** Full labels like `"Fun / Recreation"`, `"Love / Romance / Partner"`
- **New format:** Keys like `"fun"`, `"love"`, `"work"`

This breaks filtering because the UI now filters by keys but some data uses labels.

## Solution
Run the migration script to convert all existing labels to keys in both tables.

## How to Run

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Open `scripts/database/migrate-all-categories.sql`
3. Copy the entire contents
4. Paste into the SQL editor
5. Click "Run"

### Option 2: Individual Migrations
If you only need one table:
- Vision Board only: `scripts/database/migrate-vision-board-categories.sql`
- Journal only: `scripts/database/migrate-journal-categories.sql`

### Option 3: Via Supabase CLI
```bash
# Migrate both tables
supabase db execute --file scripts/database/migrate-all-categories.sql

# Or migrate individually
supabase db execute --file scripts/database/migrate-vision-board-categories.sql
supabase db execute --file scripts/database/migrate-journal-categories.sql
```

### Option 4: Via psql
```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -f scripts/database/migrate-all-categories.sql
```

## Verification

After running, verify the data:

```sql
-- Check vision board items
SELECT id, name, categories 
FROM vision_board_items 
WHERE categories IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10;

-- Check journal entries
SELECT id, title, categories 
FROM journal_entries 
WHERE categories IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10;
```

All categories should now be lowercase keys like:
- `{"fun", "travel", "family"}`
- `{"work", "money"}`
- `{"love", "family"}`

## What Changed

### Before Migration
```sql
categories: {"Fun / Recreation", "Variety / Travel / Adventure"}
categories: {"Love / Romance / Partner", "Family / Parenting"}
```

### After Migration
```sql
categories: {"fun", "travel"}
categories: {"love", "family"}
```

## Next Steps
After running this migration:
1. Test vision board filtering (`/vision-board`)
2. Test journal filtering (`/journal`)
3. Create new items - they will automatically use the key format
4. Old items will now filter correctly

## Affected Pages
- `/vision-board` - Vision board list with filtering
- `/vision-board/new` - Create new vision board item
- `/vision-board/[id]` - Edit vision board item
- `/journal` - Journal list with filtering
- `/journal/new` - Create new journal entry
- `/journal/[id]/edit` - Edit journal entry

