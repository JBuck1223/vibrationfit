-- Switch Blueprint Generation to GPT-4o for Better UX
-- GPT-5 takes 30-60 seconds (reasoning model), GPT-4o takes 2-5 seconds
-- For real-time user interactions, speed matters more than the slight cost difference

-- Update blueprint_generation to use gpt-4o
UPDATE ai_tools
SET model_name = 'gpt-4o'
WHERE tool_key = 'blueprint_generation';

-- Update vision_refinement to use gpt-4o as well (if it exists)
UPDATE ai_tools
SET model_name = 'gpt-4o'
WHERE tool_key = 'vision_refinement' AND model_name = 'gpt-5';

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Blueprint Generation now using: %', 
    (SELECT model_name FROM ai_tools WHERE tool_key = 'blueprint_generation');
  RAISE NOTICE 'Vision Refinement now using: %', 
    (SELECT model_name FROM ai_tools WHERE tool_key = 'vision_refinement');
END $$;

