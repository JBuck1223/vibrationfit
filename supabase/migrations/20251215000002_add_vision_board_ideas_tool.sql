-- Add Vision Board Ideas VIVA Tool
-- This tool generates personalized vision board item suggestions based on the user's Life Vision

INSERT INTO ai_tools (tool_key, tool_name, description, model_name, temperature, max_tokens, system_prompt) VALUES
('vision_board_ideas', 'Vision Board Ideas Generator',
 'VIVA generates personalized vision board item suggestions based on user Life Vision',
 'gpt-4o', 0.75, 2000,
 'You are VIVA. Generate exactly 3 vision board items per category. Each MUST be a JSON object with "name" (3-7 words) and "description" (20-40 words) fields. Return flat JSON: {"Fun": [{"name": "...", "description": "..."}], "Health": [...]}. Use second person. Be specific and visual.');

