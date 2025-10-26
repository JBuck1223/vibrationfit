-- Recreate local database with production schema
-- This matches your actual production database structure

-- Create user_profiles table with all production columns
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_picture_url TEXT,
    date_of_birth DATE,
    gender TEXT,
    ethnicity TEXT,
    relationship_status TEXT,
    relationship_length TEXT,
    has_children BOOLEAN,
    number_of_children INTEGER,
    children_ages JSONB,
    units TEXT,
    height INTEGER,
    weight INTEGER,
    exercise_frequency TEXT,
    living_situation TEXT,
    time_at_location TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    employment_type TEXT,
    occupation TEXT,
    company TEXT,
    time_in_role TEXT,
    currency TEXT,
    household_income TEXT,
    savings_retirement TEXT,
    assets_equity TEXT,
    consumer_debt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    partner_name TEXT,
    version_notes TEXT,
    progress_photos JSONB,
    vibe_assistant_tokens_used INTEGER DEFAULT 0,
    vibe_assistant_tokens_remaining INTEGER DEFAULT 100,
    vibe_assistant_monthly_reset_date TIMESTAMPTZ,
    vibe_assistant_total_cost DECIMAL(10,2) DEFAULT 0,
    membership_tier_id UUID,
    vibe_assistant_allowance_reset_count INTEGER DEFAULT 0,
    romance_partnership_story TEXT,
    family_parenting_story TEXT,
    career_work_story TEXT,
    money_wealth_story TEXT,
    home_environment_story TEXT,
    health_vitality_story TEXT,
    fun_recreation_story TEXT,
    travel_adventure_story TEXT,
    social_friends_story TEXT,
    possessions_lifestyle_story TEXT,
    giving_legacy_story TEXT,
    spirituality_growth_story TEXT,
    ai_tags JSONB,
    hobbies JSONB,
    leisure_time_weekly TEXT,
    travel_frequency TEXT,
    passport TEXT,
    countries_visited JSONB,
    close_friends_count TEXT,
    social_preference TEXT,
    lifestyle_category TEXT,
    primary_vehicle TEXT,
    spiritual_practice TEXT,
    meditation_frequency TEXT,
    personal_growth_focus TEXT,
    volunteer_status TEXT,
    charitable_giving TEXT,
    legacy_mindset TEXT,
    story_recordings JSONB,
    token_rollover_cycles INTEGER DEFAULT 0,
    token_last_drip_date TIMESTAMPTZ,
    auto_topup_enabled BOOLEAN DEFAULT false,
    auto_topup_pack_id TEXT,
    storage_quota_gb INTEGER DEFAULT 5,
    version_number INTEGER DEFAULT 1,
    is_draft BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT false,
    parent_version_id UUID,
    completion_percentage INTEGER DEFAULT 0
);

-- Create assessment_results table
CREATE TABLE assessment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_version_id UUID,
    status TEXT,
    total_score INTEGER,
    max_possible_score INTEGER,
    overall_percentage INTEGER,
    category_scores JSONB,
    green_line_status TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assessment_version TEXT,
    notes TEXT
);

-- Create journal_entries table
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE,
    title TEXT,
    content TEXT,
    categories JSONB,
    image_urls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    audio_recordings JSONB DEFAULT '[]'::jsonb
);

-- Create vision_versions table
CREATE TABLE vision_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT,
    status TEXT,
    completion_percent INTEGER,
    forward TEXT,
    fun TEXT,
    travel TEXT,
    home TEXT,
    family TEXT,
    romance TEXT,
    health TEXT,
    money TEXT,
    business TEXT,
    social TEXT,
    possessions TEXT,
    giving TEXT,
    spirituality TEXT,
    conclusion TEXT,
    has_audio BOOLEAN DEFAULT false,
    audio_url TEXT,
    audio_duration INTEGER,
    voice_type TEXT,
    background_music TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    vibe_assistant_refinements_count INTEGER DEFAULT 0,
    last_vibe_assistant_refinement TIMESTAMPTZ,
    vibe_assistant_refinement_notes TEXT,
    last_audio_generated_at TIMESTAMPTZ,
    ai_generated BOOLEAN DEFAULT false,
    conversation_count INTEGER DEFAULT 0,
    emotional_patterns JSONB,
    cross_category_themes JSONB
);

-- Create refinements table
CREATE TABLE refinements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vision_id UUID,
    category TEXT,
    operation_type TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    cost_usd DECIMAL(10,4),
    refinement_percentage INTEGER,
    tonality TEXT,
    word_count_target INTEGER,
    emotional_intensity TEXT,
    instructions TEXT,
    input_text TEXT,
    output_text TEXT,
    processing_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    viva_notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refinements ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own assessments" ON assessment_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assessments" ON assessment_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assessments" ON assessment_results FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own journal entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own journal entries" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own journal entries" ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own journal entries" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own visions" ON vision_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own visions" ON vision_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own visions" ON vision_versions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own refinements" ON refinements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own refinements" ON refinements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_assessment_results_user_id ON assessment_results(user_id);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_vision_versions_user_id ON vision_versions(user_id);
CREATE INDEX idx_refinements_user_id ON refinements(user_id);
