-- Local Development Database Setup
-- This creates the essential tables for local development

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    profile_completion_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Vibe Assistant fields
    vibe_assistant_tokens_used INTEGER DEFAULT 0,
    vibe_assistant_tokens_remaining INTEGER DEFAULT 100,
    vibe_assistant_total_cost DECIMAL(10,2) DEFAULT 0
);

-- Create assessment tables
CREATE TABLE assessment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_score INTEGER,
    green_line_status TEXT CHECK (green_line_status IN ('above', 'below', 'on')),
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assessment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessment_results(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    response_value TEXT NOT NULL,
    is_custom_response BOOLEAN DEFAULT FALSE,
    ai_score INTEGER,
    ai_green_line TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create vision tables
CREATE TABLE vision_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create journal entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    audio_recordings JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create refinements table (VIVA chat)
CREATE TABLE refinements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT,
    tokens_used INTEGER DEFAULT 0,
    cost_estimate DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE refinements ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own assessments" ON assessment_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assessments" ON assessment_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assessments" ON assessment_results FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own assessment responses" ON assessment_responses FOR SELECT USING (
    EXISTS (SELECT 1 FROM assessment_results WHERE id = assessment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert their own assessment responses" ON assessment_responses FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM assessment_results WHERE id = assessment_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view their own visions" ON vision_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own visions" ON vision_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own visions" ON vision_versions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own journal entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own journal entries" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own journal entries" ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own journal entries" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own refinements" ON refinements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own refinements" ON refinements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_assessment_results_user_id ON assessment_results(user_id);
CREATE INDEX idx_assessment_responses_assessment_id ON assessment_responses(assessment_id);
CREATE INDEX idx_vision_versions_user_id ON vision_versions(user_id);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_refinements_user_id ON refinements(user_id);

-- Insert a test user profile (optional)
-- This will only work if you have a user in auth.users
-- INSERT INTO user_profiles (user_id, email, first_name, last_name) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Test', 'User');
