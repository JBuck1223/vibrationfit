-- Vibe Assistant Refinement System Migration
-- This migration creates the database foundation for the Vibe Assistant (VIVA) system
-- including usage tracking, membership tiers, cost management, and refinement functionality

-- ==============================================
-- CREATE MEMBERSHIP TIERS TABLE FIRST
-- ==============================================

CREATE TABLE IF NOT EXISTS membership_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    monthly_vibe_assistant_tokens INTEGER NOT NULL DEFAULT 0,
    monthly_vibe_assistant_cost_limit DECIMAL(10,4) DEFAULT 0.00,
    price_per_month DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default membership tiers
INSERT INTO membership_tiers (name, description, monthly_vibe_assistant_tokens, monthly_vibe_assistant_cost_limit, price_per_month) VALUES
('Free', 'Basic Vibe Assistant access with limited monthly tokens', 100, 1.00, 0.00),
('Growth', 'Enhanced Vibe Assistant access for conscious creators', 500, 5.00, 19.99),
('Alignment', 'Premium Vibe Assistant access for vision refinement', 2000, 20.00, 49.99),
('Actualization', 'Unlimited Vibe Assistant access for transformation', 10000, 100.00, 99.99)
ON CONFLICT (name) DO NOTHING;

-- Add RLS policies for membership_tiers
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membership tiers are viewable by everyone" ON membership_tiers
    FOR SELECT USING (true);

CREATE POLICY "Only service role can modify membership tiers" ON membership_tiers
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- EXTEND PROFILES TABLE FOR VIBE ASSISTANT USAGE
-- ==============================================

-- Add Vibe Assistant usage tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS vibe_assistant_tokens_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS vibe_assistant_tokens_remaining INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS vibe_assistant_monthly_reset_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS vibe_assistant_total_cost DECIMAL(10,4) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS membership_tier_id UUID REFERENCES membership_tiers(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS vibe_assistant_allowance_reset_count INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_vibe_assistant_tokens_used ON profiles(vibe_assistant_tokens_used);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_tier_id ON profiles(membership_tier_id);
CREATE INDEX IF NOT EXISTS idx_profiles_vibe_assistant_reset_date ON profiles(vibe_assistant_monthly_reset_date);

-- ==============================================
-- CREATE VIBE ASSISTANT LOGS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS vibe_assistant_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vision_id UUID REFERENCES vision_versions(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    operation_type VARCHAR(50) NOT NULL, -- 'refine_vision', 'generate_guidance', 'analyze_alignment'
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0.00,
    refinement_percentage INTEGER DEFAULT 0, -- 0-100, how much to refine
    tonality VARCHAR(50) DEFAULT 'balanced', -- 'encouraging', 'challenging', 'balanced', 'celebratory'
    word_count_target INTEGER DEFAULT NULL,
    emotional_intensity VARCHAR(50) DEFAULT 'moderate', -- 'gentle', 'moderate', 'intense'
    instructions TEXT,
    input_text TEXT,
    output_text TEXT,
    processing_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance and analytics
CREATE INDEX IF NOT EXISTS idx_vibe_assistant_logs_user_id ON vibe_assistant_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_assistant_logs_vision_id ON vibe_assistant_logs(vision_id);
CREATE INDEX IF NOT EXISTS idx_vibe_assistant_logs_created_at ON vibe_assistant_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_vibe_assistant_logs_operation_type ON vibe_assistant_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_vibe_assistant_logs_category ON vibe_assistant_logs(category);

-- Add RLS policies for vibe_assistant_logs
ALTER TABLE vibe_assistant_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vibe assistant logs" ON vibe_assistant_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vibe assistant logs" ON vibe_assistant_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all vibe assistant logs" ON vibe_assistant_logs
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- EXTEND VISION_VERSIONS TABLE FOR REFINEMENT
-- ==============================================

-- Add refinement tracking columns to vision_versions table
ALTER TABLE vision_versions 
ADD COLUMN IF NOT EXISTS vibe_assistant_refinements_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_vibe_assistant_refinement TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS vibe_assistant_refinement_notes TEXT;

-- Add indexes for refinement tracking
CREATE INDEX IF NOT EXISTS idx_vision_versions_vibe_assistant_refinements ON vision_versions(vibe_assistant_refinements_count);
CREATE INDEX IF NOT EXISTS idx_vision_versions_last_refinement ON vision_versions(last_vibe_assistant_refinement);

-- ==============================================
-- HELPER FUNCTIONS FOR ALLOWANCE MANAGEMENT
-- ==============================================

-- Function to get user's current Vibe Assistant allowance
CREATE OR REPLACE FUNCTION get_vibe_assistant_allowance(p_user_id UUID)
RETURNS TABLE (
    tokens_remaining INTEGER,
    tokens_used INTEGER,
    monthly_limit INTEGER,
    cost_limit DECIMAL(10,4),
    reset_date TIMESTAMP WITH TIME ZONE,
    tier_name VARCHAR(100)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.vibe_assistant_tokens_remaining,
        p.vibe_assistant_tokens_used,
        COALESCE(mt.monthly_vibe_assistant_tokens, 0),
        COALESCE(mt.monthly_vibe_assistant_cost_limit, 0.00),
        p.vibe_assistant_monthly_reset_date,
        COALESCE(mt.name, 'Free')
    FROM profiles p
    LEFT JOIN membership_tiers mt ON p.membership_tier_id = mt.id
    WHERE p.user_id = p_user_id;
END;
$$;

-- Function to decrement Vibe Assistant allowance
CREATE OR REPLACE FUNCTION decrement_vibe_assistant_allowance(
    p_user_id UUID,
    p_tokens INTEGER,
    p_cost DECIMAL(10,6)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tokens INTEGER;
    monthly_limit INTEGER;
    cost_limit DECIMAL(10,4);
    current_cost DECIMAL(10,4);
BEGIN
    -- Get current allowance and limits
    SELECT 
        p.vibe_assistant_tokens_remaining,
        COALESCE(mt.monthly_vibe_assistant_tokens, 0),
        COALESCE(mt.monthly_vibe_assistant_cost_limit, 0.00),
        p.vibe_assistant_total_cost
    INTO current_tokens, monthly_limit, cost_limit, current_cost
    FROM profiles p
    LEFT JOIN membership_tiers mt ON p.membership_tier_id = mt.id
    WHERE p.user_id = p_user_id;
    
    -- Check if user has sufficient tokens and hasn't exceeded cost limit
    IF current_tokens >= p_tokens AND (current_cost + p_cost) <= cost_limit THEN
        -- Decrement tokens and add cost
        UPDATE profiles 
        SET 
            vibe_assistant_tokens_remaining = vibe_assistant_tokens_remaining - p_tokens,
            vibe_assistant_tokens_used = vibe_assistant_tokens_used + p_tokens,
            vibe_assistant_total_cost = vibe_assistant_total_cost + p_cost,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id;
        
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- Function to reset monthly Vibe Assistant allowances
CREATE OR REPLACE FUNCTION reset_monthly_vibe_assistant_allowances()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reset_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Find users whose monthly reset date has passed
    FOR user_record IN 
        SELECT 
            p.user_id,
            COALESCE(mt.monthly_vibe_assistant_tokens, 100) as monthly_tokens
        FROM profiles p
        LEFT JOIN membership_tiers mt ON p.membership_tier_id = mt.id
        WHERE p.vibe_assistant_monthly_reset_date < CURRENT_TIMESTAMP
    LOOP
        -- Reset tokens for this user
        UPDATE profiles 
        SET 
            vibe_assistant_tokens_remaining = user_record.monthly_tokens,
            vibe_assistant_tokens_used = 0,
            vibe_assistant_total_cost = 0.00,
            vibe_assistant_monthly_reset_date = CURRENT_TIMESTAMP + INTERVAL '1 month',
            vibe_assistant_allowance_reset_count = vibe_assistant_allowance_reset_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = user_record.user_id;
        
        reset_count := reset_count + 1;
    END LOOP;
    
    RETURN reset_count;
END;
$$;

-- Function to estimate tokens for text (rough approximation)
CREATE OR REPLACE FUNCTION estimate_vibe_assistant_tokens(p_text TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Rough estimation: ~4 characters per token for English text
    -- Add buffer for system prompts and formatting
    RETURN GREATEST(100, LENGTH(p_text) / 4 + 200);
END;
$$;

-- Function to calculate Vibe Assistant cost based on input and output tokens
CREATE OR REPLACE FUNCTION calculate_vibe_assistant_cost(p_input_tokens INTEGER, p_output_tokens INTEGER)
RETURNS DECIMAL(10,6)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- GPT-5 pricing (as of 2025)
    -- Input tokens: $1.25 per million tokens ($0.00125 per 1K)
    -- Output tokens: $10.00 per million tokens ($0.01 per 1K)
    DECLARE
        input_cost DECIMAL(10,6);
        output_cost DECIMAL(10,6);
    BEGIN
        input_cost := (p_input_tokens * 0.00125) / 1000.0;
        output_cost := (p_output_tokens * 0.01) / 1000.0;
        RETURN input_cost + output_cost;
    END;
END;
$$;

-- Legacy function for backward compatibility
CREATE OR REPLACE FUNCTION calculate_vibe_assistant_cost_legacy(p_tokens INTEGER)
RETURNS DECIMAL(10,6)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Conservative estimate treating all tokens as input tokens
    RETURN (p_tokens * 0.00125) / 1000.0;
END;
$$;

-- ==============================================
-- TRIGGERS AND AUTOMATIC UPDATES
-- ==============================================

-- Function to update vision refinement tracking
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

-- Trigger to automatically update vision refinement tracking
CREATE TRIGGER trigger_update_vision_refinement_tracking
    AFTER INSERT ON vibe_assistant_logs
    FOR EACH ROW
    WHEN (NEW.operation_type = 'refine_vision' AND NEW.vision_id IS NOT NULL)
    EXECUTE FUNCTION update_vision_refinement_tracking();

-- Function to update profile timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Triggers to automatically update timestamps
CREATE TRIGGER trigger_update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_membership_tiers_updated_at
    BEFORE UPDATE ON membership_tiers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- INITIAL DATA SETUP
-- ==============================================

-- Set default membership tier for existing users
UPDATE profiles 
SET membership_tier_id = (SELECT id FROM membership_tiers WHERE name = 'Free' LIMIT 1)
WHERE membership_tier_id IS NULL;

-- Initialize Vibe Assistant allowances for existing users
UPDATE profiles 
SET 
    vibe_assistant_tokens_remaining = COALESCE(
        (SELECT monthly_vibe_assistant_tokens FROM membership_tiers WHERE id = profiles.membership_tier_id),
        100
    ),
    vibe_assistant_tokens_used = 0,
    vibe_assistant_total_cost = 0.00,
    vibe_assistant_monthly_reset_date = CURRENT_TIMESTAMP + INTERVAL '1 month'
WHERE vibe_assistant_tokens_remaining = 0 AND vibe_assistant_tokens_used = 0;

-- ==============================================
-- GRANTS AND PERMISSIONS
-- ==============================================

-- Grant necessary permissions for the application
GRANT SELECT, INSERT, UPDATE ON vibe_assistant_logs TO authenticated;
GRANT SELECT ON membership_tiers TO authenticated;
GRANT SELECT, UPDATE ON profiles TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_vibe_assistant_allowance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION estimate_vibe_assistant_tokens(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_vibe_assistant_cost(INTEGER) TO authenticated;

-- Service role permissions (for background jobs and admin operations)
GRANT EXECUTE ON FUNCTION decrement_vibe_assistant_allowance(UUID, INTEGER, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION reset_monthly_vibe_assistant_allowances() TO service_role;
GRANT ALL ON vibe_assistant_logs TO service_role;
GRANT ALL ON membership_tiers TO service_role;

-- ==============================================
-- COMMENTS AND DOCUMENTATION
-- ==============================================

COMMENT ON TABLE membership_tiers IS 'Defines membership tiers with Vibe Assistant token allowances and cost limits';
COMMENT ON TABLE vibe_assistant_logs IS 'Tracks all Vibe Assistant usage including costs, tokens, and refinement details';
COMMENT ON COLUMN profiles.vibe_assistant_tokens_used IS 'Total tokens consumed by user this month';
COMMENT ON COLUMN profiles.vibe_assistant_tokens_remaining IS 'Remaining tokens available this month';
COMMENT ON COLUMN profiles.vibe_assistant_total_cost IS 'Total cost incurred this month in USD';
COMMENT ON COLUMN profiles.vibe_assistant_monthly_reset_date IS 'Date when monthly allowances reset';
COMMENT ON COLUMN vision_versions.vibe_assistant_refinements_count IS 'Number of times this vision has been refined by Vibe Assistant';

COMMENT ON FUNCTION get_vibe_assistant_allowance(UUID) IS 'Returns current Vibe Assistant allowance info for a user';
COMMENT ON FUNCTION decrement_vibe_assistant_allowance(UUID, INTEGER, DECIMAL) IS 'Decrements user allowance and returns success status';
COMMENT ON FUNCTION reset_monthly_vibe_assistant_allowances() IS 'Resets monthly allowances for all eligible users';
COMMENT ON FUNCTION estimate_vibe_assistant_tokens(TEXT) IS 'Estimates token count for given text';
COMMENT ON FUNCTION calculate_vibe_assistant_cost(INTEGER) IS 'Calculates cost in USD for given token count';
