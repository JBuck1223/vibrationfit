-- ============================================================================
-- Fix Prompt Suggestions Cache Unique Constraint
-- ============================================================================
-- This migration fixes the unique constraint to properly handle NULL values
-- in profile_id and assessment_id columns

-- Drop the old unique constraint
ALTER TABLE prompt_suggestions_cache 
  DROP CONSTRAINT IF EXISTS unique_prompt_cache;

-- Create unique index that handles NULLs properly using COALESCE
-- This ensures one cache entry per user/category/profile/assessment combination
-- Empty strings are used for NULLs so the unique constraint works correctly
CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_suggestions_unique 
  ON prompt_suggestions_cache(
    user_id, 
    category_key, 
    COALESCE(profile_id::text, ''), 
    COALESCE(assessment_id::text, '')
  );

