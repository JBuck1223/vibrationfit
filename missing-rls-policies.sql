-- ============================================================================
-- VibrationFit Database: Missing RLS Policies
-- ============================================================================
-- These policies ensure proper Row Level Security for all tables
-- Review and run these policies to enhance security

-- ============================================================================
-- TOKEN USAGE TABLE POLICIES
-- ============================================================================

-- Allow system to insert token usage records (for AI operations)
CREATE POLICY IF NOT EXISTS "System can insert token usage"
  ON token_usage FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own token usage
CREATE POLICY IF NOT EXISTS "Users can view their own token usage"
  ON token_usage FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- MEMBERSHIP TIERS TABLE POLICIES
-- ============================================================================

-- Allow anyone to view membership tiers (for pricing pages)
CREATE POLICY IF NOT EXISTS "Anyone can view membership tiers"
  ON membership_tiers FOR SELECT
  USING (true);

-- Only service role can modify membership tiers
CREATE POLICY IF NOT EXISTS "Service role can modify membership tiers"
  ON membership_tiers FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- CUSTOMER SUBSCRIPTIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own subscriptions
CREATE POLICY IF NOT EXISTS "Users can view their own subscriptions"
  ON customer_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY IF NOT EXISTS "Users can insert their own subscriptions"
  ON customer_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY IF NOT EXISTS "Users can update their own subscriptions"
  ON customer_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- REFINEMENTS TABLE POLICIES
-- ============================================================================

-- Users can view their own refinements
CREATE POLICY IF NOT EXISTS "Users can view their own refinements"
  ON refinements FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own refinements
CREATE POLICY IF NOT EXISTS "Users can insert their own refinements"
  ON refinements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own refinements
CREATE POLICY IF NOT EXISTS "Users can update their own refinements"
  ON refinements FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own refinements
CREATE POLICY IF NOT EXISTS "Users can delete their own refinements"
  ON refinements FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ASSESSMENT RESPONSES TABLE POLICIES
-- ============================================================================
-- Note: Since the assessments table doesn't exist, these policies assume
-- assessment_responses are managed through application logic

-- Allow service role to manage assessment responses
CREATE POLICY IF NOT EXISTS "Service role can manage assessment responses"
  ON assessment_responses FOR ALL
  USING (auth.role() = 'service_role');

-- Allow authenticated users to view assessment responses
-- (Application should filter by user context)
CREATE POLICY IF NOT EXISTS "Authenticated users can view assessment responses"
  ON assessment_responses FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- VISION BOARD ITEMS TABLE POLICIES
-- ============================================================================

-- Users can view their own vision board items
CREATE POLICY IF NOT EXISTS "Users can view their own vision board items"
  ON vision_board_items FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own vision board items
CREATE POLICY IF NOT EXISTS "Users can insert their own vision board items"
  ON vision_board_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own vision board items
CREATE POLICY IF NOT EXISTS "Users can update their own vision board items"
  ON vision_board_items FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own vision board items
CREATE POLICY IF NOT EXISTS "Users can delete their own vision board items"
  ON vision_board_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- JOURNAL ENTRIES TABLE POLICIES
-- ============================================================================

-- Users can view their own journal entries
CREATE POLICY IF NOT EXISTS "Users can view their own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own journal entries
CREATE POLICY IF NOT EXISTS "Users can insert their own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own journal entries
CREATE POLICY IF NOT EXISTS "Users can update their own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own journal entries
CREATE POLICY IF NOT EXISTS "Users can delete their own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- VISION VERSIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own vision versions
CREATE POLICY IF NOT EXISTS "Users can view their own vision versions"
  ON vision_versions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own vision versions
CREATE POLICY IF NOT EXISTS "Users can insert their own vision versions"
  ON vision_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own vision versions
CREATE POLICY IF NOT EXISTS "Users can update their own vision versions"
  ON vision_versions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own vision versions
CREATE POLICY IF NOT EXISTS "Users can delete their own vision versions"
  ON vision_versions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- USER PROFILES TABLE POLICIES
-- ============================================================================

-- Users can view their own profiles
CREATE POLICY IF NOT EXISTS "Users can view their own profiles"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profiles
CREATE POLICY IF NOT EXISTS "Users can insert their own profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profiles
CREATE POLICY IF NOT EXISTS "Users can update their own profiles"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own profiles
CREATE POLICY IF NOT EXISTS "Users can delete their own profiles"
  ON user_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "System can insert token usage" ON token_usage IS 'Allows AI system to track token usage';
COMMENT ON POLICY "Anyone can view membership tiers" ON membership_tiers IS 'Public pricing information';
COMMENT ON POLICY "Service role can modify membership tiers" ON membership_tiers IS 'Admin-only tier management';
COMMENT ON POLICY "Users can view their own subscriptions" ON customer_subscriptions IS 'User subscription access';
COMMENT ON POLICY "Users can view their own refinements" ON refinements IS 'User refinement history';
COMMENT ON POLICY "Users can view their own assessment responses" ON assessment_responses IS 'User assessment data';
COMMENT ON POLICY "Users can view their own vision board items" ON vision_board_items IS 'User vision board access';
COMMENT ON POLICY "Users can view their own journal entries" ON journal_entries IS 'User journal access';
COMMENT ON POLICY "Users can view their own vision versions" ON vision_versions IS 'User vision access';
COMMENT ON POLICY "Users can view their own profiles" ON user_profiles IS 'User profile access';
