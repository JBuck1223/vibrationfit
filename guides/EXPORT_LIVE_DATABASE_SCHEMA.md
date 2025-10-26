# Export Live Database Schema 🔄

Guide for extracting the current live schema from your production Supabase database.

## Method 1: Supabase CLI (Recommended) ⭐

### Install Supabase CLI
```bash
brew install supabase/tap/supabase
```

### Get Your Project Reference
1. Go to https://supabase.com/dashboard
2. Select your VibrationFit project
3. Go to Settings → General
4. Copy your **Project Reference** (looks like `abcdefghijklmnop`)

### Export Schema
```bash
# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Export schema only (no data)
supabase db dump --schema-only > supabase-schema-export.sql

# Export everything (schema + data)
supabase db dump > supabase-full-export.sql
```

## Method 2: Direct PostgreSQL Connection

### Get Database Password
1. Supabase Dashboard → Settings → Database
2. Click "Reset Database Password" or view current password

### Connection String
```
postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### Export with pg_dump
```bash
# Install PostgreSQL client
brew install postgresql

# Export schema only
pg_dump -h db.[PROJECT_REF].supabase.co \
        -U postgres \
        -d postgres \
        --schema-only \
        > supabase-schema-export.sql

# Export everything
pg_dump -h db.[PROJECT_REF].supabase.co \
        -U postgres \
        -d postgres \
        > supabase-full-export.sql
```

## Method 3: Supabase Dashboard

### Table Editor → SQL Editor
1. Go to https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql
2. Run this query:

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

3. Export results as CSV/JSON

## Method 4: Read-Only Database Role (For AI Access)

If you want to give the AI read-only access to your database:

### Create Read-Only User

```sql
-- Create read-only role
CREATE ROLE readonly_user LOGIN PASSWORD 'secure_password_here';

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO readonly_user;

-- Grant SELECT on all existing tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- Grant SELECT on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT ON TABLES TO readonly_user;
```

### Connection String for Read-Only Access
```
postgresql://readonly_user:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

**Security Note:** Only use this for development/testing. For production, use Row Level Security (RLS) policies instead.

## What Gets Exported?

### Schema Export Includes:
- ✅ Table definitions (CREATE TABLE)
- ✅ Column types and constraints
- ✅ Indexes
- ✅ Foreign keys
- ✅ Row Level Security policies
- ✅ Functions and triggers
- ✅ Enums and types
- ❌ No actual data (unless you use --data-only flag)

### Full Export Includes:
- ✅ Everything from schema export
- ✅ All table data (INSERT statements)
- ✅ Sequences and values

## Recommended: Automate Schema Updates

### Add to package.json
```json
{
  "scripts": {
    "export-schema": "supabase db dump --schema-only > supabase/migrations/exported-schema.sql"
  }
}
```

### Run Regularly
```bash
# Update schema export before major changes
npm run export-schema
```

## Verify Your Export

```bash
# Check export file size
ls -lh supabase-schema-export.sql

# View first 50 lines
head -n 50 supabase-schema-export.sql

# Search for specific table
grep -A 20 "CREATE TABLE user_profiles" supabase-schema-export.sql
```

## Troubleshooting

### Connection Refused
- Check your firewall
- Verify project ref is correct
- Ensure IP is whitelisted in Supabase

### Authentication Failed
- Reset database password
- Verify username is "postgres"
- Check connection string format

### No Tables Found
- Verify you're connected to correct project
- Check schema name (default is "public")
- Ensure RLS allows viewing

## Security Best Practices

1. **Never commit passwords** to version control
2. **Use environment variables** for connection strings
3. **Limit exports** to schema-only (no sensitive data)
4. **Revoke access** when done
5. **Use read-only role** instead of postgres user
6. **Enable IP whitelist** in Supabase settings

## Quick Commands Summary

```bash
# Setup
brew install supabase/tap/supabase
supabase link --project-ref YOUR_PROJECT_REF

# Export
supabase db dump --schema-only > schema.sql
supabase db dump --data-only > data.sql
supabase db dump > full-backup.sql

# View
cat schema.sql | less
grep "CREATE TABLE" schema.sql

# Update docs
cp schema.sql guides/EXPORTED_SCHEMA.sql
git add guides/EXPORTED_SCHEMA.sql
git commit -m "Update schema export"
```

---

**Last Updated:** January 2025  
**Status:** Production Ready
