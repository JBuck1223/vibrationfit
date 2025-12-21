-- Migration: Create vision_refinements table
-- Purpose: Store refinement history with inputs/outputs for VIVA Refine tool
-- Created: 2024-12-21

-- Create vision_refinements table
CREATE TABLE vision_refinements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vision_id UUID NOT NULL REFERENCES vision_versions(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  
  -- Input/Output
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  
  -- Refinement Settings (stored as JSON for flexibility)
  refinement_inputs JSONB DEFAULT '{}'::jsonb,
  -- Structure: { 
  --   add: string[], 
  --   remove: string[], 
  --   emphasize: string, 
  --   deemphasize: string, 
  --   intensity: "less" | "same" | "more",
  --   detail: "simpler" | "same" | "richer",
  --   notes: string
  -- }
  
  weave_settings JSONB DEFAULT '{}'::jsonb,
  -- Structure: { 
  --   enabled: boolean, 
  --   strength: "light" | "medium" | "deep",
  --   style: "inline" | "addon",
  --   note: string
  -- }
  
  -- Status tracking
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure valid vision category
  CONSTRAINT valid_category CHECK (category IN (
    'forward', 'fun', 'travel', 'home', 'family', 'love', 
    'health', 'money', 'work', 'social', 'stuff', 'giving', 
    'spirituality', 'conclusion'
  ))
);

-- Add comment
COMMENT ON TABLE vision_refinements IS 'Stores history of VIVA Refine operations with inputs and outputs';

-- Indexes for performance
CREATE INDEX idx_vision_refinements_user_id ON vision_refinements(user_id);
CREATE INDEX idx_vision_refinements_vision_id ON vision_refinements(vision_id);
CREATE INDEX idx_vision_refinements_category ON vision_refinements(category);
CREATE INDEX idx_vision_refinements_user_vision ON vision_refinements(user_id, vision_id);
CREATE INDEX idx_vision_refinements_created_at ON vision_refinements(created_at DESC);
CREATE INDEX idx_vision_refinements_applied ON vision_refinements(applied) WHERE applied = false;

-- Enable RLS
ALTER TABLE vision_refinements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own refinements
CREATE POLICY "Users can view their own refinements"
  ON vision_refinements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own refinements"
  ON vision_refinements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own refinements"
  ON vision_refinements
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own refinements"
  ON vision_refinements
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_vision_refinements_updated_at
  BEFORE UPDATE ON vision_refinements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

