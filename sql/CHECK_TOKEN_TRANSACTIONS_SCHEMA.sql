-- ============================================================================
-- Check token_transactions Table Schema
-- ============================================================================
-- Run this first to see what columns your token_transactions table actually has

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'token_transactions'
ORDER BY ordinal_position;

