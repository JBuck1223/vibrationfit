-- ============================================================================
-- Prompt Suggestions Cache Table
-- ============================================================================
-- This migration creates a table to cache AI-generated prompt suggestions
-- for life vision categories, keyed by profile_id and assessment_id to avoid
-- unnecessary regeneration when data hasn't changed.

CREATE TABLE IF NOT EXISTS prompt_suggestions_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_key TEXT NOT NULL,
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessment_results(id) ON DELETE CASCADE,
  
  -- Cached prompt suggestions (JSONB for flexibility)
  suggestions JSONB NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Note: We handle uniqueness via application logic due to NULL handling complexities
  -- Multiple rows can have NULL profile_id or assessment_id, which is expected behavior
  -- We use SELECT + UPDATE/INSERT pattern instead of upsert with unique constraint
);

-- Create unique index that handles NULLs properly using COALESCE
-- This ensures one cache entry per user/category/profile/assessment combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_suggestions_unique 
  ON prompt_suggestions_cache(
    user_id, 
    category_key, 
    COALESCE(profile_id::text, ''), 
    COALESCE(assessment_id::text, '')
  );

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_prompt_suggestions_user_category 
  ON prompt_suggestions_cache(user_id, category_key);

CREATE INDEX IF NOT EXISTS idx_prompt_suggestions_profile 
  ON prompt_suggestions_cache(profile_id) 
  WHERE profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prompt_suggestions_assessment 
  ON prompt_suggestions_cache(assessment_id) 
  WHERE assessment_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE prompt_suggestions_cache IS 'Caches AI-generated prompt suggestions for life vision categories to avoid regeneration on every page load';
COMMENT ON COLUMN prompt_suggestions_cache.category_key IS 'Life vision category key (e.g., fun, health, love)';
COMMENT ON COLUMN prompt_suggestions_cache.profile_id IS 'Active profile ID when suggestions were generated (NULL if no profile)';
COMMENT ON COLUMN prompt_suggestions_cache.assessment_id IS 'Latest assessment ID when suggestions were generated (NULL if no assessment)';
COMMENT ON COLUMN prompt_suggestions_cache.suggestions IS 'JSON object with peakExperiences, whatFeelsAmazing, whatFeelsBad prompts';

