-- Migration: Add Focus Story AI Tools
-- Purpose: Add tool configurations for Focus Story feature (highlight extraction and story generation)
-- Date: 2026-02-02

-- Focus Highlight Extraction Tool
INSERT INTO ai_tools (tool_key, tool_name, description, model_name, temperature, max_tokens, system_prompt, is_active) VALUES
('focus_highlight_extraction', 'Focus Highlight Extraction', 
 'Analyzes life vision to extract 5-7 vivid, emotionally charged highlights for Focus story narration',
 'gpt-4o', 0.7, 1000,
 'You are VIVA analyzing a Life Vision document to extract the most vivid, emotionally charged moments for audio narration. Identify highlights that are sensory-rich, emotionally activating, and span different times of day. Return structured JSON with category, text, essence word, and time of day.',
 true)
ON CONFLICT (tool_key) DO UPDATE SET
  tool_name = EXCLUDED.tool_name,
  description = EXCLUDED.description,
  model_name = EXCLUDED.model_name,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  system_prompt = EXCLUDED.system_prompt,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Focus Story Generation Tool
INSERT INTO ai_tools (tool_key, tool_name, description, model_name, temperature, max_tokens, system_prompt, is_active) VALUES
('focus_story_generation', 'Focus Story Generation', 
 'Generates immersive day-in-the-life narrative (750-1000 words) from selected vision highlights',
 'gpt-4o', 0.8, 1500,
 'You are VIVA crafting an immersive day-in-the-life narrative. Write in first person, present tense, with sensory-rich descriptions. Flow naturally from morning awakening through evening wind-down, weaving the provided highlights into a cohesive story. Show, do not tell - create visceral experiences through specific sensory details.',
 true)
ON CONFLICT (tool_key) DO UPDATE SET
  tool_name = EXCLUDED.tool_name,
  description = EXCLUDED.description,
  model_name = EXCLUDED.model_name,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  system_prompt = EXCLUDED.system_prompt,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
