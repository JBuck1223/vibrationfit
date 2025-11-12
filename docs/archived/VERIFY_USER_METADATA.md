# How to Verify user_metadata in Supabase

## Location in Supabase

`user_metadata` lives in the **`auth.users`** table (not in your public schema).

## Ways to Check:

### Method 1: Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard** → Your project
2. **Navigate to**: Authentication → Users
3. **Find your user** (search by email: buckinghambliss@gmail.com)
4. **Click on your user** → Opens user details
5. **Look for "User Metadata" section** → Should show:
   ```json
   {
     "email": "buckinghambliss@gmail.com",
     "email_verified": true,
     "full_name": "Jordan Buckingham",
     "phone_verified": false,
     "sub": "720adebb-e6c0-4f6c-a5fc-164d128e083a",
     "profile_picture_url": "https://media.vibrationfit.com/...",
     "profile_picture_updated_at": "2025-01-XX..."
   }
   ```

### Method 2: SQL Editor (More Detailed)

Go to **SQL Editor** → Run this query:

```sql
-- Check your user_metadata
SELECT 
  id,
  email,
  user_metadata,
  raw_user_meta_data,
  updated_at
FROM auth.users
WHERE email = 'buckinghambliss@gmail.com';
```

This will show:
- `user_metadata` - The metadata object (read-only, computed)
- `raw_user_meta_data` - The actual stored metadata JSON

### Method 3: Check Specific Metadata Field

```sql
-- Check if profile_picture_url is in metadata
SELECT 
  email,
  raw_user_meta_data->>'profile_picture_url' as profile_picture_url,
  raw_user_meta_data->>'profile_picture_updated_at' as updated_at,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'first_name' as first_name
FROM auth.users
WHERE email = 'buckinghambliss@gmail.com';
```

### Method 4: List All Users with Profile Pictures

```sql
-- See all users who have profile pictures in metadata
SELECT 
  email,
  raw_user_meta_data->>'profile_picture_url' as profile_picture_url,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE raw_user_meta_data->>'profile_picture_url' IS NOT NULL;
```

## What to Look For:

After syncing, you should see:
- ✅ `profile_picture_url`: "https://media.vibrationfit.com/..."
- ✅ `profile_picture_updated_at`: Timestamp of when it was synced
- ✅ `full_name`: "Jordan Buckingham" (already there)
- ✅ `first_name`: (if you sync that too)

## Important Notes:

1. **`auth.users` table is read-only** via SQL Editor (you can't INSERT/UPDATE directly)
2. **Must use Admin API** to update (which our sync function does)
3. **Changes appear immediately** but may take a few seconds to show in dashboard
4. **Metadata is in JWT token** - so Header can access it instantly

## Testing the Sync:

After uploading a profile picture, wait a few seconds, then check:
- Dashboard → Authentication → Users → Your user → User Metadata
- Or run the SQL query above

If you see `profile_picture_url` in the metadata, it's working! 🎉

