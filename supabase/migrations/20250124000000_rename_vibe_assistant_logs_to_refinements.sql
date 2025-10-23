-- Rename vibe_assistant_logs table to refinements
-- This migration renames the table to better reflect its purpose

-- Rename the table
ALTER TABLE vibe_assistant_logs RENAME TO refinements;

-- Rename the indexes to match the new table name
ALTER INDEX IF EXISTS idx_vibe_assistant_logs_user_id RENAME TO idx_refinements_user_id;
ALTER INDEX IF EXISTS idx_vibe_assistant_logs_vision_id RENAME TO idx_refinements_vision_id;
ALTER INDEX IF EXISTS idx_vibe_assistant_logs_created_at RENAME TO idx_refinements_created_at;
ALTER INDEX IF EXISTS idx_vibe_assistant_logs_operation_type RENAME TO idx_refinements_operation_type;
ALTER INDEX IF EXISTS idx_vibe_assistant_logs_category RENAME TO idx_refinements_category;
ALTER INDEX IF EXISTS idx_vibe_assistant_logs_viva_notes RENAME TO idx_refinements_viva_notes;

-- Update RLS policies to reference the new table name
DROP POLICY IF EXISTS "Users can view their own vibe assistant logs" ON refinements;
DROP POLICY IF EXISTS "Users can insert their own vibe assistant logs" ON refinements;
DROP POLICY IF EXISTS "Service role can manage all vibe assistant logs" ON refinements;

-- Recreate policies with new names
CREATE POLICY "Users can view their own refinements" ON refinements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own refinements" ON refinements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all refinements" ON refinements
    FOR ALL USING (auth.role() = 'service_role');

-- Update the trigger function to reference the new table name
CREATE OR REPLACE FUNCTION update_vision_refinement_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update vision_versions table with refinement info
    UPDATE vision_versions 
    SET 
        vibe_assistant_refinements_count = vibe_assistant_refinements_count + 1,
        last_vibe_assistant_refinement = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.vision_id;
    
    RETURN NEW;
END;
$$;

-- Update the trigger to reference the new table name
DROP TRIGGER IF EXISTS trigger_update_vision_refinement_tracking ON refinements;
CREATE TRIGGER trigger_update_vision_refinement_tracking
    AFTER INSERT ON refinements
    FOR EACH ROW
    WHEN (NEW.operation_type = 'refine_vision' AND NEW.vision_id IS NOT NULL)
    EXECUTE FUNCTION update_vision_refinement_tracking();

-- Update grants and permissions
REVOKE ALL ON vibe_assistant_logs FROM authenticated;
REVOKE ALL ON vibe_assistant_logs FROM service_role;

GRANT SELECT, INSERT, UPDATE ON refinements TO authenticated;
GRANT ALL ON refinements TO service_role;

-- Update comments
COMMENT ON TABLE refinements IS 'Tracks all vision refinements including costs, tokens, and refinement details';
COMMENT ON COLUMN refinements.viva_notes IS 'VIVA Notes: AI explanation of refinement reasoning and approach';
COMMENT ON COLUMN refinements.refinement_percentage IS 'Percentage of refinement applied (0-100)';
COMMENT ON COLUMN refinements.tonality IS 'Tone of the refinement: encouraging, challenging, balanced, celebratory';
COMMENT ON COLUMN refinements.emotional_intensity IS 'Emotional intensity: gentle, moderate, intense';
COMMENT ON COLUMN refinements.operation_type IS 'Type of operation: refine_vision, generate_guidance, analyze_alignment';
COMMENT ON COLUMN refinements.category IS 'Life category being refined: health, money, family, etc.';
