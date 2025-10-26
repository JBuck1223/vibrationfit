-- ============================================================================
-- VibrationFit Database: Performance Indexes Migration
-- ============================================================================
-- Run this migration through Supabase Dashboard > SQL Editor
-- Or save as a new migration file in supabase/migrations/

-- Journal entries by user and date (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date 
ON journal_entries(user_id, date DESC);

-- Vision board items by user and status (filtering by status)
CREATE INDEX IF NOT EXISTS idx_vision_board_items_user_status 
ON vision_board_items(user_id, status);

-- Assessment responses by assessment and category (category-based queries)
CREATE INDEX IF NOT EXISTS idx_assessment_responses_assessment_category 
ON assessment_responses(assessment_id, category);

-- Token usage by user and action type (AI usage analysis)
CREATE INDEX IF NOT EXISTS idx_token_usage_user_action 
ON token_usage(user_id, action_type);

-- Vision versions by user and status (active vs draft filtering)
CREATE INDEX IF NOT EXISTS idx_vision_versions_user_status 
ON vision_versions(user_id, status);

-- Token usage by user and date (usage trends)
CREATE INDEX IF NOT EXISTS idx_token_usage_user_date 
ON token_usage(user_id, created_at DESC);

-- Assessment responses by assessment and question (assessment analysis)
CREATE INDEX IF NOT EXISTS idx_assessment_responses_assessment_question 
ON assessment_responses(assessment_id, question_id);

-- Refinements by user and vision (refinement history)
CREATE INDEX IF NOT EXISTS idx_refinements_user_vision 
ON refinements(user_id, vision_id);

-- User profiles by membership tier (subscription analysis)
CREATE INDEX IF NOT EXISTS idx_user_profiles_membership_tier 
ON user_profiles(membership_tier_id) WHERE membership_tier_id IS NOT NULL;

-- Vision versions by completion percentage (progress tracking)
CREATE INDEX IF NOT EXISTS idx_vision_versions_completion 
ON vision_versions(user_id, completion_percent DESC);

-- Assessment responses by category (cross-assessment analysis)
CREATE INDEX IF NOT EXISTS idx_assessment_responses_category 
ON assessment_responses(category);

-- Refinements by category (refinement analysis by life area)
CREATE INDEX IF NOT EXISTS idx_refinements_category 
ON refinements(category);

-- Add comments for documentation
COMMENT ON INDEX idx_journal_entries_user_date IS 'Optimizes user journal queries by date';
COMMENT ON INDEX idx_vision_board_items_user_status IS 'Optimizes vision board filtering by status';
COMMENT ON INDEX idx_assessment_responses_assessment_category IS 'Optimizes assessment queries by category';
COMMENT ON INDEX idx_token_usage_user_action IS 'Optimizes AI usage analysis by action type';
COMMENT ON INDEX idx_vision_versions_user_status IS 'Optimizes vision filtering by status';
COMMENT ON INDEX idx_token_usage_user_date IS 'Optimizes token usage trend analysis';
COMMENT ON INDEX idx_assessment_responses_assessment_question IS 'Optimizes assessment response analysis';
COMMENT ON INDEX idx_refinements_user_vision IS 'Optimizes refinement history queries';
COMMENT ON INDEX idx_user_profiles_membership_tier IS 'Optimizes subscription analysis';
COMMENT ON INDEX idx_vision_versions_completion IS 'Optimizes progress tracking queries';
COMMENT ON INDEX idx_assessment_responses_category IS 'Optimizes cross-assessment category analysis';
COMMENT ON INDEX idx_refinements_category IS 'Optimizes refinement analysis by life area';

-- Verify indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
