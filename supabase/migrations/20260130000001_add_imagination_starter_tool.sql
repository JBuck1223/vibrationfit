-- Add Imagination Starter VIVA Tool
-- This tool generates "Get Me Started" draft text for the imagination step
-- Uses raw profile clarity + contrast to create a starting point users can edit

INSERT INTO ai_tools (tool_key, tool_name, description, model_name, temperature, max_tokens, system_prompt) VALUES
('imagination_starter', 'Imagination Starter',
 'Generates draft imagination text from profile clarity/contrast data. Output is meant to be edited by user.',
 'gpt-4o', 0.8, 1500,
 'You are a warm, creative writing assistant helping someone draft their ideal life vision. Write naturally and conversationally, using their own words and details from their profile. Output is a DRAFT meant to be edited - leave room for expansion, avoid being too polished or complete.');
