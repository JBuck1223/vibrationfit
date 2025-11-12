-- Manual SQL commands to rename vibe_assistant_logs to refinements
-- Run these commands in your Supabase SQL editor or database client

-- 1. Rename the table
ALTER TABLE vibe_assistant_logs RENAME TO refinements;

-- 2. Rename the indexes
ALTER INDEX IF EXISTS idx_vibe_assistant_logs_user_id RENAME TO idx_refinements_user_id;
ALTER INDEX IF EXISTS idx_vibe_assistant_logs_vision_id RENAME TO idx_refinements_vision_id;
ALTER INDEX IF EXISTS idx_vibe_assistant_logs_created_at RENAME TO idx_refinements_created_at;
ALTER INDEX IF EXISTS idx_vibe_assistant_logs_operation_type RENAME TO idx_refinements_operation_type;
ALTER INDEX IF EXISTS idx_vibe_assistant_logs_category RENAME TO idx_refinements_category;
ALTER INDEX IF EXISTS idx_vibe_assistant_logs_viva_notes RENAME TO idx_refinements_viva_notes;

-- 3. Update RLS policies
DROP POLICY IF EXISTS "Users can view their own vibe assistant logs" ON refinements;
DROP POLICY IF EXISTS "Users can insert their own vibe assistant logs" ON refinements;
DROP POLICY IF EXISTS "Service role can manage all vibe assistant logs" ON refinements;

CREATE POLICY "Users can view their own refinements" ON refinements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own refinements" ON refinements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all refinements" ON refinements
    FOR ALL USING (auth.role() = 'service_role');

-- 4. Update the trigger
DROP TRIGGER IF EXISTS trigger_update_vision_refinement_tracking ON refinements;
CREATE TRIGGER trigger_update_vision_refinement_tracking
    AFTER INSERT ON refinements
    FOR EACH ROW
    WHEN (NEW.operation_type = 'refine_vision' AND NEW.vision_id IS NOT NULL)
    EXECUTE FUNCTION update_vision_refinement_tracking();

-- 5. Update grants
GRANT SELECT, INSERT, UPDATE ON refinements TO authenticated;
GRANT ALL ON refinements TO service_role;

-- 6. Add comments
COMMENT ON TABLE refinements IS 'Tracks all vision refinements including costs, tokens, and refinement details';
COMMENT ON COLUMN refinements.viva_notes IS 'VIVA Notes: AI explanation of refinement reasoning and approach';
COMMENT ON COLUMN refinements.refinement_percentage IS 'Percentage of refinement applied (0-100)';
COMMENT ON COLUMN refinements.tonality IS 'Tone of the refinement: encouraging, challenging, balanced, celebratory';
COMMENT ON COLUMN refinements.emotional_intensity IS 'Emotional intensity: gentle, moderate, intense';
COMMENT ON COLUMN refinements.operation_type IS 'Type of operation: refine_vision, generate_guidance, analyze_alignment';
COMMENT ON COLUMN refinements.category IS 'Life category being refined: health, money, family, etc.';
