# 🗄️ SQL Files & Database Scripts

Organized SQL files for VibrationFit database management, setup, and utilities.

---

## 📂 Directory Structure

```
sql/
├── scripts/        # Utility & debug scripts
├── setup/          # Initial setup & configuration
└── archive/        # Old schema files & deprecated scripts
```

---

## 🔧 Utility Scripts

**Location:** `sql/scripts/`

These are utility scripts for maintenance, debugging, and data management:

| File | Purpose |
|------|---------|
| `cleanup-viva-visions.sql` | Clean up vision data |
| `reset-user-tokens.sql` | Reset user token balances |
| `debug-allowance.sql` | Debug token allowance issues |

**Usage:**
```bash
# Run via Supabase SQL Editor or psql
psql -U postgres -d vibrationfit -f sql/scripts/cleanup-viva-visions.sql
```

---

## ⚙️ Setup Scripts

**Location:** `sql/setup/`

Initial setup scripts for S3 storage, RPC functions, and infrastructure:

| File | Purpose |
|------|---------|
| `supabase-storage-setup.sql` | Configure Supabase storage buckets |
| `supabase-s3-functions.sql` | S3 integration functions |
| `s3-rpc-functions.sql` | RPC functions for S3 operations |
| `s3-presigned-urls.sql` | Presigned URL generation |
| `s3-real-implementation.sql` | Full S3 implementation |

**Usage:**
```bash
# Run these in order during initial setup
1. supabase-storage-setup.sql
2. supabase-s3-functions.sql
3. s3-rpc-functions.sql
```

---

## 📦 Database Migrations

**Location:** `supabase/migrations/`

**⚠️ Official migrations live in `supabase/migrations/` directory!**

These are timestamped, versioned migrations that should be applied in order:

```
supabase/migrations/
├── 20250107000000_vision_creation_agent.sql
├── 20250111000000_create_assessment_tables.sql
├── 20250112000000_create_billing_system.sql
├── 20250112000000_token_tracking_system.sql
├── 20250113000000_create_referral_system.sql
├── 20250115000000_vibe_assistant_refinement_system.sql
├── 20250115000001_add_viva_notes_column.sql
├── 20250115000002_update_token_limits.sql
├── 20250115000003_actualization_blueprints.sql
├── 20250116000000_life_vision_audio_system.sql
├── 20250117000000_remove_vision_title_field.sql
├── 20250118000000_add_profile_fields.sql
└── 20250119000000_add_recording_storage.sql
```

**How to apply:**
```bash
# Using Supabase CLI
supabase db push

# Or manually in order via SQL editor
```

---

## 🗃️ Archived Files

**Location:** `sql/archive/`

Old schema reference files and deprecated scripts kept for historical reference:

### Schema Reference Files
- `database-schema.sql` - Original database schema
- `user-profiles-schema.sql` - Old user profiles structure
- `current_user_profiles_schema.sql` - Profile schema snapshot
- `get_profile_schema.sql` - Profile retrieval schema

### Old Database Scripts
Located in `sql/archive/database/`:
- `user_profiles_table.sql` - Original profiles table
- `profile_versions.sql` - Version tracking (deprecated)
- `add_photos_notes_columns.sql` - Column additions
- `fix_profile_completion.sql` - Profile completion fixes
- `fix_profile_completion_v2.sql` - Updated profile fixes
- `debug_profile_completion.sql` - Debug profile issues
- `reset_version_numbers.sql` - Version number resets

**Note:** These are kept for reference but should not be used for new development. Use migrations in `supabase/migrations/` instead.

---

## 🚀 Best Practices

### Adding New Database Changes

1. **Create a migration:**
   ```bash
   supabase migration new your_feature_name
   ```

2. **Write your SQL** in the generated migration file

3. **Test locally:**
   ```bash
   supabase db reset  # Resets and applies all migrations
   ```

4. **Push to production:**
   ```bash
   supabase db push
   ```

### Running Utility Scripts

Always test scripts on a copy of production data first:

```sql
-- Start a transaction
BEGIN;

-- Run your script
\i sql/scripts/cleanup-viva-visions.sql

-- Verify results
SELECT * FROM viva_visions LIMIT 10;

-- Commit or rollback
COMMIT;  -- or ROLLBACK;
```

### Backup Before Major Changes

```bash
# Backup production database
supabase db dump > backup-$(date +%Y%m%d).sql

# Restore if needed
psql -U postgres -d vibrationfit < backup-20250112.sql
```

---

## 📊 Database Structure Overview

### Core Tables (as of January 2025)

- **`user_profiles`** - User accounts and settings
- **`vision_versions`** - Life vision documents
- **`token_transactions`** - AI usage tracking
- **`customer_subscriptions`** - Stripe subscriptions
- **`payment_history`** - Payment records
- **`membership_tiers`** - Subscription tiers
- **`assessment_responses`** - Vibrational assessments
- **`user_referrals`** - Referral system
- **`vibe_assistant_conversations`** - VIVA chat history
- **`actualization_blueprints`** - User blueprints
- **`recording_storage`** - Audio/video storage metadata

### Storage Buckets

- `viva-attachments` - VIVA chat attachments
- `user-recordings` - Audio/video recordings
- `profile-pictures` - User avatars
- `vision-images` - Vision board images

See `guides/STORAGE_FOLDER_MAPPING.md` for detailed folder structure.

---

## 🔍 Quick Reference

### Find a specific table/column
```sql
SELECT * FROM information_schema.columns 
WHERE table_name = 'user_profiles';
```

### Check migration status
```bash
supabase migration list
```

### View current schema
```sql
\dt  -- List all tables
\d user_profiles  -- Describe specific table
```

### Export current schema
```bash
pg_dump -U postgres -d vibrationfit --schema-only > current-schema.sql
```

---

## ⚠️ Important Notes

1. **Never modify production directly** - Always use migrations
2. **Test scripts locally first** - Use `supabase db reset` to test
3. **Backup before major changes** - Use `supabase db dump`
4. **Archive old files** - Don't delete, move to `sql/archive/`
5. **Document complex migrations** - Add comments in SQL files

---

## 📚 Related Documentation

- **Database Migrations:** `supabase/migrations/README_ASSESSMENT.md`
- **Storage Guide:** `guides/STORAGE_FOLDER_MAPPING.md`
- **Billing System:** `guides/BILLING_SYSTEM_COMPLETE.md`
- **Token System:** `guides/TOKEN_SYSTEM_GUIDE.md`
- **Assessment System:** `guides/ASSESSMENT_SYSTEM.md`

---

**Last Updated:** January 2025

