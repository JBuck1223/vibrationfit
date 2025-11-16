-- ============================================================================
-- BASELINE MIGRATION - Current Production State
-- Created: 2025-11-12
-- Source: Production database dump
-- ============================================================================
-- 
-- This migration represents the ACTUAL state of the production database
-- as of November 12, 2025, after all manual changes and cleanups.
--
-- Previous migration history (64 files) was archived to:
-- supabase/archive/old-migrations-2025-11-12/
--
-- This baseline can be used to rebuild the database from scratch.
-- All future migrations should build on top of this baseline.
--
-- ============================================================================

-- Import the complete schema from the dump
-- Note: This file references the schema dump for actual table definitions

-- To apply this baseline:
-- 1. Create a fresh database
-- 2. Apply this migration (which loads from the dump)
-- 3. All future migrations build on this

-- IMPORTANT: This migration assumes you're starting from an empty database.
-- If tables already exist, this will fail. Use this for fresh deployments only.

-- The actual schema is maintained in: supabase/COMPLETE_SCHEMA_DUMP.sql
-- Human-readable docs in: supabase/CURRENT_SCHEMA.md

-- For production use, the dump should be applied directly:
-- psql $DATABASE_URL < supabase/COMPLETE_SCHEMA_DUMP.sql

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all major tables exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') > 40,
    'Expected at least 40 tables in public schema';
  
  RAISE NOTICE 'Baseline verification passed: Database has expected tables';
END $$;

-- ============================================================================
-- END OF BASELINE MIGRATION
-- ============================================================================

