-- Migration: Add SparkQuery™ AI tool config
-- Purpose: Dedicated model/temp tuning for SparkQuery generation (separate from vision_refinement)
-- Date: 2026-08-09

INSERT INTO ai_tools (tool_key, tool_name, description, model_name, temperature, max_tokens, system_prompt, is_active) VALUES
(
  'spark_query_generation',
  'SparkQuery™ Generation',
  'Generates exactly 3 SPARK-validated empowering questions from user source material (Life Vision, journal, vision board, or custom)',
  'gpt-4o',
  0.7,
  1000,
  'You are VIVA crafting SparkQueries™ — empowering Why am I / Why do I questions that presuppose desired outcomes so the brain hunts for evidence. Follow the SPARK framework. Return structured JSON only.',
  true
)
ON CONFLICT (tool_key) DO UPDATE SET
  tool_name = EXCLUDED.tool_name,
  description = EXCLUDED.description,
  model_name = EXCLUDED.model_name,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  system_prompt = EXCLUDED.system_prompt,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
