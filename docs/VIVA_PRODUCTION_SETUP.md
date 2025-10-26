# VIVA Production Setup Guide

## Status
Currently switching from local database back to production database.

## Steps to Apply VIVA Conversations Table

### Option 1: Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/nxjhqibnlbwzzphewncj
2. Navigate to **SQL Editor**
3. Open the file `apply-viva-conversations-production.sql`
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run**

### Option 2: Supabase CLI (If preferred)

```bash
# Connect to production
npx supabase link --project-ref nxjhqibnlbwzzphewncj

# Apply the migration
npx supabase db push --file apply-viva-conversations-production.sql
```

## Verify Table Creation

After running the SQL, verify the table exists:

```sql
-- Check if table exists
SELECT * FROM viva_conversations LIMIT 1;

-- Should return empty result or show the table structure
```

## Current Production Database

- **URL**: `https://nxjhqibnlbwzzphewncj.supabase.co`
- **Status**: ✅ Active
- **Environment**: Production

## Local Database Status

- **Status**: ⚠️ Not working (switching back to production)

## VIVA System Requirements

For VIVA to work in production, we need:

1. ✅ `user_profiles` table
2. ✅ `assessment_results` table  
3. ✅ `vision_versions` table
4. ⏳ `viva_conversations` table (needs to be created)
5. ✅ RLS policies for user isolation
6. ✅ Profile and assessment data

## Next Steps

1. Apply the `viva_conversations` table to production
2. Test the VIVA flow at `https://vibrationfit.com/life-vision/create-with-viva`
3. Monitor console for any errors
4. Verify conversation storage is working

## Testing Checklist

- [ ] VIVA conversations table created
- [ ] Can start conversation for a category
- [ ] User responses are saved
- [ ] Conversation history can be retrieved
- [ ] Visions are generated from conversations
- [ ] Vision is saved with proper title
