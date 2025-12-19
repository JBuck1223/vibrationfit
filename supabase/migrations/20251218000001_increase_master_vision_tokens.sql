-- Increase max_tokens for master_vision_assembly from 4000 to 16000
-- A complete life vision with 12 categories needs much more space!

UPDATE ai_tools
SET max_tokens = 16000
WHERE tool_key = 'master_vision_assembly';


