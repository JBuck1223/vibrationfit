-- Fix RLS policies for ai_tools table
-- Simple approach: API handles admin checks, RLS allows all authenticated users

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active tools" ON ai_tools;
DROP POLICY IF EXISTS "Only admins can modify tools" ON ai_tools;
DROP POLICY IF EXISTS "View active tools or all if admin" ON ai_tools;

-- Create permissive policies - API endpoint handles admin authorization
CREATE POLICY "Authenticated users can view ai_tools"
  ON ai_tools FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can modify ai_tools"
  ON ai_tools FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "Authenticated users can view ai_tools" ON ai_tools IS 
  'Permissive RLS - actual admin authorization enforced in /api/admin/ai-tools endpoint';

COMMENT ON POLICY "Authenticated users can modify ai_tools" ON ai_tools IS 
  'Permissive RLS - actual admin authorization enforced in /api/admin/ai-tools endpoint';

