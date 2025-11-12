-- Actualization Blueprints System
-- This migration creates the foundation for AI-powered actualization planning
-- that helps users turn their visions into concrete action plans

-- ==============================================
-- CREATE ACTUALIZATION BLUEPRINTS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS actualization_blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vision_id UUID REFERENCES vision_versions(id) ON DELETE CASCADE,
    vision_board_item_id UUID REFERENCES vision_board_items(id) ON DELETE SET NULL,
    
    -- Blueprint Core Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- matches vision categories
    priority_level VARCHAR(50) DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
    
    -- AI-Generated Content
    ai_analysis TEXT, -- AI's analysis of the opportunity
    opportunity_summary TEXT, -- Why this is a big opportunity for joy/impact
    success_metrics TEXT, -- How to measure success
    potential_challenges TEXT, -- Anticipated obstacles
    recommended_timeline VARCHAR(100), -- "3-6 months", "1-2 years", etc.
    
    -- Action Plan Structure
    phases JSONB, -- Array of phases with tasks, timelines, resources
    resources_needed JSONB, -- People, places, tools, skills, money
    milestones JSONB, -- Key checkpoints and celebrations
    
    -- Status and Progress
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_phase INTEGER DEFAULT 1,
    
    -- Integration Points
    linked_journal_entries UUID[], -- Array of journal entry IDs
    linked_vision_board_items UUID[], -- Array of vision board item IDs
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ==============================================
-- CREATE BLUEPRINT PHASES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS blueprint_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES actualization_blueprints(id) ON DELETE CASCADE,
    
    -- Phase Information
    phase_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_duration VARCHAR(100), -- "2-4 weeks", "3-6 months", etc.
    
    -- Phase Content
    objectives TEXT[], -- Array of phase objectives
    tasks JSONB, -- Array of tasks with details
    resources JSONB, -- Phase-specific resources needed
    success_criteria TEXT, -- How to know this phase is complete
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- CREATE BLUEPRINT TASKS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS blueprint_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES actualization_blueprints(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES blueprint_phases(id) ON DELETE CASCADE,
    
    -- Task Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) DEFAULT 'action' CHECK (task_type IN ('action', 'research', 'connection', 'preparation', 'celebration')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Task Details
    estimated_effort VARCHAR(100), -- "30 minutes", "2-3 hours", "1 day", etc.
    resources_needed TEXT[], -- Specific resources for this task
    instructions TEXT, -- Step-by-step instructions
    success_criteria TEXT, -- How to know this task is complete
    
    -- Status and Progress
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'blocked')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Integration
    linked_journal_entry_id UUID, -- Connect to journal entry
    linked_vision_board_item_id UUID, -- Connect to vision board item
    
    -- Dates
    due_date DATE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- CREATE BLUEPRINT INSIGHTS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS blueprint_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blueprint_id UUID REFERENCES actualization_blueprints(id) ON DELETE CASCADE,
    
    -- Insight Information
    insight_type VARCHAR(100) NOT NULL, -- 'opportunity', 'challenge', 'resource', 'timing', 'connection'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    confidence_level VARCHAR(50) DEFAULT 'medium' CHECK (confidence_level IN ('low', 'medium', 'high')),
    
    -- AI Analysis
    ai_reasoning TEXT, -- Why the AI identified this insight
    supporting_evidence TEXT, -- Evidence from user's data
    recommended_actions TEXT, -- What to do with this insight
    
    -- Status
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'acted_upon', 'dismissed')),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    acted_upon_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Blueprints indexes
CREATE INDEX IF NOT EXISTS idx_blueprints_user_id ON actualization_blueprints(user_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_vision_id ON actualization_blueprints(vision_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_category ON actualization_blueprints(category);
CREATE INDEX IF NOT EXISTS idx_blueprints_status ON actualization_blueprints(status);
CREATE INDEX IF NOT EXISTS idx_blueprints_priority ON actualization_blueprints(priority_level);
CREATE INDEX IF NOT EXISTS idx_blueprints_created_at ON actualization_blueprints(created_at DESC);

-- Phases indexes
CREATE INDEX IF NOT EXISTS idx_phases_blueprint_id ON blueprint_phases(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_phases_status ON blueprint_phases(status);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_blueprint_id ON blueprint_tasks(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_phase_id ON blueprint_tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON blueprint_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON blueprint_tasks(due_date);

-- Insights indexes
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON blueprint_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_blueprint_id ON blueprint_insights(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_insights_type ON blueprint_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_status ON blueprint_insights(status);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE actualization_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_insights ENABLE ROW LEVEL SECURITY;

-- Blueprints policies (with IF NOT EXISTS equivalent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'actualization_blueprints' AND policyname = 'Users can view their own blueprints') THEN
        CREATE POLICY "Users can view their own blueprints" ON actualization_blueprints
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'actualization_blueprints' AND policyname = 'Users can insert their own blueprints') THEN
        CREATE POLICY "Users can insert their own blueprints" ON actualization_blueprints
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'actualization_blueprints' AND policyname = 'Users can update their own blueprints') THEN
        CREATE POLICY "Users can update their own blueprints" ON actualization_blueprints
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'actualization_blueprints' AND policyname = 'Users can delete their own blueprints') THEN
        CREATE POLICY "Users can delete their own blueprints" ON actualization_blueprints
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Phases policies (with IF NOT EXISTS equivalent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blueprint_phases' AND policyname = 'Users can manage phases for their blueprints') THEN
        CREATE POLICY "Users can manage phases for their blueprints" ON blueprint_phases
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM actualization_blueprints 
                    WHERE id = blueprint_phases.blueprint_id 
                    AND user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Tasks policies (with IF NOT EXISTS equivalent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blueprint_tasks' AND policyname = 'Users can manage tasks for their blueprints') THEN
        CREATE POLICY "Users can manage tasks for their blueprints" ON blueprint_tasks
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM actualization_blueprints 
                    WHERE id = blueprint_tasks.blueprint_id 
                    AND user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Insights policies (with IF NOT EXISTS equivalent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blueprint_insights' AND policyname = 'Users can view their own insights') THEN
        CREATE POLICY "Users can view their own insights" ON blueprint_insights
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blueprint_insights' AND policyname = 'Users can insert their own insights') THEN
        CREATE POLICY "Users can insert their own insights" ON blueprint_insights
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blueprint_insights' AND policyname = 'Users can update their own insights') THEN
        CREATE POLICY "Users can update their own insights" ON blueprint_insights
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- ==============================================
-- HELPER FUNCTIONS
-- ==============================================

-- Function to calculate blueprint progress
CREATE OR REPLACE FUNCTION calculate_blueprint_progress(p_blueprint_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    progress_percentage INTEGER;
BEGIN
    -- Count total tasks
    SELECT COUNT(*) INTO total_tasks
    FROM blueprint_tasks
    WHERE blueprint_id = p_blueprint_id;
    
    -- Count completed tasks
    SELECT COUNT(*) INTO completed_tasks
    FROM blueprint_tasks
    WHERE blueprint_id = p_blueprint_id AND status = 'completed';
    
    -- Calculate percentage
    IF total_tasks > 0 THEN
        progress_percentage := ROUND((completed_tasks::DECIMAL / total_tasks) * 100);
    ELSE
        progress_percentage := 0;
    END IF;
    
    RETURN progress_percentage;
END;
$$;

-- Function to update blueprint progress automatically
CREATE OR REPLACE FUNCTION update_blueprint_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update the blueprint's progress percentage
    UPDATE actualization_blueprints
    SET 
        progress_percentage = calculate_blueprint_progress(NEW.blueprint_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.blueprint_id;
    
    RETURN NEW;
END;
$$;

-- Trigger to automatically update blueprint progress (with IF NOT EXISTS equivalent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_blueprint_progress') THEN
        CREATE TRIGGER trigger_update_blueprint_progress
            AFTER INSERT OR UPDATE ON blueprint_tasks
            FOR EACH ROW
            EXECUTE FUNCTION update_blueprint_progress();
    END IF;
END $$;

-- ==============================================
-- COMMENTS AND DOCUMENTATION
-- ==============================================

COMMENT ON TABLE actualization_blueprints IS 'AI-generated action plans to help users actualize their visions';
COMMENT ON TABLE blueprint_phases IS 'Phases within a blueprint with specific objectives and timelines';
COMMENT ON TABLE blueprint_tasks IS 'Individual actionable tasks within blueprint phases';
COMMENT ON TABLE blueprint_insights IS 'AI-generated insights about opportunities, challenges, and resources';

COMMENT ON COLUMN actualization_blueprints.phases IS 'JSON array of phases with tasks, timelines, and resources';
COMMENT ON COLUMN actualization_blueprints.resources_needed IS 'JSON array of people, places, tools, skills, and financial resources';
COMMENT ON COLUMN actualization_blueprints.milestones IS 'JSON array of key checkpoints and celebration points';

COMMENT ON FUNCTION calculate_blueprint_progress(UUID) IS 'Calculates progress percentage based on completed tasks';
COMMENT ON FUNCTION update_blueprint_progress() IS 'Automatically updates blueprint progress when tasks change';
