-- Update Vibe Assistant token limits to realistic levels
-- Based on enhanced context system requiring 3,000-5,000 tokens per request

-- Update membership tier token limits
UPDATE membership_tiers 
SET 
  monthly_vibe_assistant_tokens = CASE 
    WHEN name = 'Free' THEN 10000        -- 2-3 requests per month
    WHEN name = 'Growth' THEN 50000      -- 10-15 requests per month  
    WHEN name = 'Alignment' THEN 200000  -- 40-60 requests per month
    WHEN name = 'Actualization' THEN 1000000  -- 200-300 requests per month
    ELSE monthly_vibe_assistant_tokens
  END,
  monthly_vibe_assistant_cost_limit = CASE
    WHEN name = 'Free' THEN 0.10         -- ~$0.051/month in OpenAI costs
    WHEN name = 'Growth' THEN 0.50       -- ~$0.255/month in OpenAI costs
    WHEN name = 'Alignment' THEN 2.00    -- ~$1.02/month in OpenAI costs  
    WHEN name = 'Actualization' THEN 10.00  -- ~$5.10/month in OpenAI costs
    ELSE monthly_vibe_assistant_cost_limit
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE name IN ('Free', 'Growth', 'Alignment', 'Actualization');

-- Update existing user allowances to match their tier limits
UPDATE profiles 
SET 
  vibe_assistant_tokens_remaining = CASE
    WHEN membership_tier_id = (SELECT id FROM membership_tiers WHERE name = 'Free') THEN 10000
    WHEN membership_tier_id = (SELECT id FROM membership_tiers WHERE name = 'Growth') THEN 50000
    WHEN membership_tier_id = (SELECT id FROM membership_tiers WHERE name = 'Alignment') THEN 200000
    WHEN membership_tier_id = (SELECT id FROM membership_tiers WHERE name = 'Actualization') THEN 1000000
    ELSE vibe_assistant_tokens_remaining
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE membership_tier_id IS NOT NULL;

-- Add comment explaining the new limits
COMMENT ON COLUMN membership_tiers.monthly_vibe_assistant_tokens IS 'Monthly token allowance based on enhanced context system (3K-5K tokens per request)';
COMMENT ON COLUMN membership_tiers.monthly_vibe_assistant_cost_limit IS 'Monthly cost limit in USD based on GPT-5 input/output pricing';
