-- Remove unused AI models from ai_model_pricing
-- Only keep models that are actively used in ai_tools or may be used for testing

-- Models to DELETE (not in ai_tools table and unlikely to be used):
-- gpt-4, gpt-4-turbo (replaced by gpt-4o)
-- gpt-4o-2024-11-20 (dated version, auto-normalizes to gpt-4o)
-- gpt-3.5-turbo (outdated, not used)

-- KEEPING: gpt-5, gpt-5-mini, gpt-5-nano (may be tested in future)

DELETE FROM ai_model_pricing
WHERE model_name IN (
  'gpt-4',
  'gpt-4-turbo',
  'gpt-4o-2024-11-20',
  'gpt-3.5-turbo'
);

-- Verify remaining models
DO $$
DECLARE
  v_count INTEGER;
  v_model RECORD;
BEGIN
  SELECT COUNT(*) INTO v_count FROM ai_model_pricing WHERE is_active = true;
  RAISE NOTICE 'Active models remaining: %', v_count;
  
  RAISE NOTICE 'Remaining models:';
  FOR v_model IN 
    SELECT model_name FROM ai_model_pricing WHERE is_active = true ORDER BY model_name
  LOOP
    RAISE NOTICE '  - %', v_model.model_name;
  END LOOP;
END $$;

COMMENT ON TABLE ai_model_pricing IS 
  'Only contains models actively used in ai_tools. Dated OpenAI versions (e.g., gpt-4o-2024-08-06) are auto-normalized to base names (gpt-4o) in code.';

