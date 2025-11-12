-- Create vibrational links table for cross-category awareness
-- This connects different life categories based on emotional patterns, themes, and user behavior

CREATE TABLE IF NOT EXISTS public.vibrational_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_a TEXT NOT NULL, -- e.g., 'money', 'health', 'romance'
    category_b TEXT NOT NULL, -- e.g., 'money', 'health', 'romance'
    strength NUMERIC NOT NULL CHECK (strength >= 0 AND strength <= 1), -- 0-1 correlation
    shared_themes TEXT[] DEFAULT '{}', -- e.g., ['security','freedom','balance','creativity']
    connection_type TEXT, -- 'emotional', 'thematic', 'behavioral', 'temporal'
    notes TEXT, -- AI-generated context about why these categories are linked
    evidence_count INTEGER DEFAULT 0, -- Number of times this link has been reinforced
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure we don't duplicate links
    UNIQUE(user_id, category_a, category_b)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_vibrational_links_user ON vibrational_links(user_id);
CREATE INDEX IF NOT EXISTS idx_vibrational_links_category_a ON vibrational_links(user_id, category_a);
CREATE INDEX IF NOT EXISTS idx_vibrational_links_strength ON vibrational_links(user_id, strength DESC);
CREATE INDEX IF NOT EXISTS idx_vibrational_links_themes ON vibrational_links USING GIN(shared_themes);

-- RLS policies
ALTER TABLE vibrational_links ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vibrational_links' 
        AND policyname = 'Users can view their own vibrational links'
    ) THEN
        CREATE POLICY "Users can view their own vibrational links" ON vibrational_links
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vibrational_links' 
        AND policyname = 'Users can insert their own vibrational links'
    ) THEN
        CREATE POLICY "Users can insert their own vibrational links" ON vibrational_links
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vibrational_links' 
        AND policyname = 'Users can update their own vibrational links'
    ) THEN
        CREATE POLICY "Users can update their own vibrational links" ON vibrational_links
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_vibrational_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vibrational_links_updated_at
    BEFORE UPDATE ON vibrational_links
    FOR EACH ROW
    EXECUTE FUNCTION update_vibrational_links_updated_at();
