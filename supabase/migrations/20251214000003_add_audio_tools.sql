-- Add audio transcription and TTS tools to ai_tools table
-- Every AI API call should be tracked in ai_tools

-- First, ensure the models exist in ai_model_pricing
INSERT INTO ai_model_pricing (model_name, provider, model_family, input_price_per_1k, output_price_per_1k, price_per_unit, unit_type, is_active, supports_temperature, supports_json_mode, supports_streaming, is_reasoning_model, max_tokens_param, token_multiplier, context_window)
VALUES
  ('whisper-1', 'OpenAI', 'Whisper', 0, 0, 0.006, 'minute', true, false, false, false, false, 'max_tokens', 1, NULL),
  ('tts-1', 'OpenAI', 'TTS', 0, 0, 0.015, 'per_1k_chars', true, false, false, true, false, 'max_tokens', 1, NULL),
  ('tts-1-hd', 'OpenAI', 'TTS', 0, 0, 0.030, 'per_1k_chars', true, false, false, true, false, 'max_tokens', 1, NULL),
  ('dall-e-3', 'OpenAI', 'DALL-E', 0, 0, 0.040, 'image_1024x1024', true, false, false, false, false, 'max_tokens', 1, NULL),
  ('dall-e-2', 'OpenAI', 'DALL-E', 0, 0, 0.020, 'image_1024x1024', true, false, false, false, false, 'max_tokens', 1, NULL)
ON CONFLICT (model_name) DO UPDATE SET
  price_per_unit = EXCLUDED.price_per_unit,
  unit_type = EXCLUDED.unit_type;

-- Now add the tools
INSERT INTO ai_tools (tool_key, tool_name, description, model_name, temperature, max_tokens, system_prompt, is_active) VALUES

-- Audio Transcription (Whisper)
('audio_transcription', 'Audio Transcription', 
 'Transcribes audio recordings to text using Whisper API',
 'whisper-1', 0, 0, 
 NULL, 
 true),

-- Text-to-Speech (TTS)
('audio_generation', 'Audio Generation (TTS)', 
 'Generates audio from text using OpenAI TTS API',
 'tts-1', 0, 0, 
 NULL, 
 true),

-- High Quality TTS
('audio_generation_hd', 'Audio Generation HD (TTS)', 
 'Generates high-quality audio from text using OpenAI TTS HD API',
 'tts-1-hd', 0, 0, 
 NULL, 
 true),

-- Image Generation (DALL-E 3)
('image_generation_dalle3', 'Image Generation (DALL-E 3)', 
 'Generates images from text prompts using DALL-E 3',
 'dall-e-3', 0, 0, 
 NULL, 
 true),

-- Image Generation (DALL-E 2)
('image_generation_dalle2', 'Image Generation (DALL-E 2)', 
 'Generates images from text prompts using DALL-E 2',
 'dall-e-2', 0, 0, 
 NULL, 
 true)

ON CONFLICT (tool_key) DO UPDATE SET
  tool_name = EXCLUDED.tool_name,
  description = EXCLUDED.description,
  model_name = EXCLUDED.model_name,
  updated_at = NOW();

COMMENT ON COLUMN ai_tools.temperature IS 
  'Temperature setting (0 for non-chat models like Whisper/TTS)';

COMMENT ON COLUMN ai_tools.max_tokens IS 
  'Max tokens (0 for non-chat models that dont use token limits)';

COMMENT ON COLUMN ai_tools.system_prompt IS 
  'System prompt (NULL for non-chat models like Whisper/TTS)';

