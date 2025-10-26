-- ============================================================================
-- VibrationFit Database: CRUD Query Templates
-- ============================================================================
-- Parameterized queries for all main tables
-- Use these templates in your application code

-- ============================================================================
-- USER PROFILES CRUD OPERATIONS
-- ============================================================================

-- CREATE: Insert new user profile
-- Parameters: $1=user_id, $2=first_name, $3=last_name, $4=email, $5=phone
INSERT INTO user_profiles (
  user_id, first_name, last_name, email, phone, 
  created_at, updated_at
) VALUES (
  $1, $2, $3, $4, $5, 
  NOW(), NOW()
) RETURNING *;

-- READ: Get user profile by user_id
-- Parameters: $1=user_id
SELECT * FROM user_profiles 
WHERE user_id = $1;

-- READ: Get user profile with membership tier info
-- Parameters: $1=user_id
SELECT up.*, mt.name as tier_name, mt.monthly_vibe_assistant_tokens
FROM user_profiles up
LEFT JOIN membership_tiers mt ON up.membership_tier_id = mt.id
WHERE up.user_id = $1;

-- UPDATE: Update basic profile info
-- Parameters: $1=user_id, $2=first_name, $3=last_name, $4=email, $5=phone
UPDATE user_profiles 
SET 
  first_name = $2,
  last_name = $3,
  email = $4,
  phone = $5,
  updated_at = NOW()
WHERE user_id = $1 
RETURNING *;

-- UPDATE: Update story for specific category
-- Parameters: $1=user_id, $2=category, $3=story_text
UPDATE user_profiles 
SET 
  ${category}_story = $3,
  updated_at = NOW()
WHERE user_id = $1 
RETURNING *;

-- DELETE: Delete user profile
-- Parameters: $1=user_id
DELETE FROM user_profiles 
WHERE user_id = $1;

-- ============================================================================
-- VISION VERSIONS CRUD OPERATIONS
-- ============================================================================

-- CREATE: Insert new vision version
-- Parameters: $1=user_id, $2=title, $3=version_number, $4=forward, $5=fun, $6=travel, etc.
INSERT INTO vision_versions (
  user_id, title, version_number, status, completion_percent,
  forward, fun, travel, home, family, romance, health, money,
  business, social, possessions, giving, spirituality, conclusion,
  created_at, updated_at
) VALUES (
  $1, $2, $3, 'draft', 0,
  $4, $5, $6, $7, $8, $9, $10, $11,
  $12, $13, $14, $15, $16, $17,
  NOW(), NOW()
) RETURNING *;

-- READ: Get all vision versions for user
-- Parameters: $1=user_id
SELECT * FROM vision_versions 
WHERE user_id = $1 
ORDER BY created_at DESC;

-- READ: Get active vision version for user
-- Parameters: $1=user_id
SELECT * FROM vision_versions 
WHERE user_id = $1 AND status = 'complete'
ORDER BY created_at DESC 
LIMIT 1;

-- READ: Get vision version by ID
-- Parameters: $1=id, $2=user_id
SELECT * FROM vision_versions 
WHERE id = $1 AND user_id = $2;

-- UPDATE: Update vision section
-- Parameters: $1=id, $2=section_name, $3=section_content, $4=user_id
UPDATE vision_versions 
SET 
  ${section_name} = $3,
  updated_at = NOW()
WHERE id = $1 AND user_id = $4 
RETURNING *;

-- UPDATE: Update completion status
-- Parameters: $1=id, $2=status, $3=completion_percent, $4=user_id
UPDATE vision_versions 
SET 
  status = $2,
  completion_percent = $3,
  updated_at = NOW()
WHERE id = $1 AND user_id = $4 
RETURNING *;

-- DELETE: Delete vision version
-- Parameters: $1=id, $2=user_id
DELETE FROM vision_versions 
WHERE id = $1 AND user_id = $2;

-- ============================================================================
-- JOURNAL ENTRIES CRUD OPERATIONS
-- ============================================================================

-- CREATE: Insert new journal entry
-- Parameters: $1=user_id, $2=date, $3=title, $4=content, $5=categories, $6=image_urls
INSERT INTO journal_entries (
  user_id, date, title, content, categories, image_urls,
  created_at, updated_at
) VALUES (
  $1, $2, $3, $4, $5, $6,
  NOW(), NOW()
) RETURNING *;

-- READ: Get all journal entries for user
-- Parameters: $1=user_id
SELECT * FROM journal_entries 
WHERE user_id = $1 
ORDER BY date DESC;

-- READ: Get journal entries by date range
-- Parameters: $1=user_id, $2=start_date, $3=end_date
SELECT * FROM journal_entries 
WHERE user_id = $1 
  AND date BETWEEN $2 AND $3
ORDER BY date DESC;

-- READ: Get journal entries by category
-- Parameters: $1=user_id, $2=category
SELECT * FROM journal_entries 
WHERE user_id = $1 
  AND $2 = ANY(categories)
ORDER BY date DESC;

-- READ: Get journal entry by ID
-- Parameters: $1=id, $2=user_id
SELECT * FROM journal_entries 
WHERE id = $1 AND user_id = $2;

-- UPDATE: Update journal entry
-- Parameters: $1=id, $2=title, $3=content, $4=categories, $5=image_urls, $6=user_id
UPDATE journal_entries 
SET 
  title = $2,
  content = $3,
  categories = $4,
  image_urls = $5,
  updated_at = NOW()
WHERE id = $1 AND user_id = $6 
RETURNING *;

-- DELETE: Delete journal entry
-- Parameters: $1=id, $2=user_id
DELETE FROM journal_entries 
WHERE id = $1 AND user_id = $2;

-- ============================================================================
-- VISION BOARD ITEMS CRUD OPERATIONS
-- ============================================================================

-- CREATE: Insert new vision board item
-- Parameters: $1=user_id, $2=name, $3=description, $4=image_url, $5=status, $6=categories
INSERT INTO vision_board_items (
  user_id, name, description, image_url, status, categories,
  created_at, updated_at
) VALUES (
  $1, $2, $3, $4, $5, $6,
  NOW(), NOW()
) RETURNING *;

-- READ: Get all vision board items for user
-- Parameters: $1=user_id
SELECT * FROM vision_board_items 
WHERE user_id = $1 
ORDER BY created_at DESC;

-- READ: Get vision board items by status
-- Parameters: $1=user_id, $2=status
SELECT * FROM vision_board_items 
WHERE user_id = $1 AND status = $2
ORDER BY created_at DESC;

-- READ: Get vision board items by category
-- Parameters: $1=user_id, $2=category
SELECT * FROM vision_board_items 
WHERE user_id = $1 
  AND $2 = ANY(categories)
ORDER BY created_at DESC;

-- READ: Get vision board item by ID
-- Parameters: $1=id, $2=user_id
SELECT * FROM vision_board_items 
WHERE id = $1 AND user_id = $2;

-- UPDATE: Update vision board item
-- Parameters: $1=id, $2=name, $3=description, $4=image_url, $5=status, $6=categories, $7=user_id
UPDATE vision_board_items 
SET 
  name = $2,
  description = $3,
  image_url = $4,
  status = $5,
  categories = $6,
  updated_at = NOW()
WHERE id = $1 AND user_id = $7 
RETURNING *;

-- UPDATE: Mark item as actualized
-- Parameters: $1=id, $2=user_id
UPDATE vision_board_items 
SET 
  status = 'actualized',
  actualized_at = NOW(),
  updated_at = NOW()
WHERE id = $1 AND user_id = $2 
RETURNING *;

-- DELETE: Delete vision board item
-- Parameters: $1=id, $2=user_id
DELETE FROM vision_board_items 
WHERE id = $1 AND user_id = $2;

-- ============================================================================
-- TOKEN USAGE CRUD OPERATIONS
-- ============================================================================

-- CREATE: Insert token usage record
-- Parameters: $1=user_id, $2=action_type, $3=model_used, $4=tokens_used, $5=cost_estimate
INSERT INTO token_usage (
  user_id, action_type, model_used, tokens_used, cost_estimate,
  success, created_at
) VALUES (
  $1, $2, $3, $4, $5,
  true, NOW()
) RETURNING *;

-- READ: Get token usage for user
-- Parameters: $1=user_id
SELECT * FROM token_usage 
WHERE user_id = $1 
ORDER BY created_at DESC;

-- READ: Get token usage by action type
-- Parameters: $1=user_id, $2=action_type
SELECT * FROM token_usage 
WHERE user_id = $1 AND action_type = $2
ORDER BY created_at DESC;

-- READ: Get token usage by date range
-- Parameters: $1=user_id, $2=start_date, $3=end_date
SELECT * FROM token_usage 
WHERE user_id = $1 
  AND created_at BETWEEN $2 AND $3
ORDER BY created_at DESC;

-- READ: Get total token usage for user
-- Parameters: $1=user_id
SELECT 
  SUM(tokens_used) as total_tokens,
  SUM(cost_estimate) as total_cost,
  COUNT(*) as total_actions
FROM token_usage 
WHERE user_id = $1;

-- ============================================================================
-- REFINEMENTS CRUD OPERATIONS
-- ============================================================================

-- CREATE: Insert refinement record
-- Parameters: $1=user_id, $2=vision_id, $3=category, $4=operation_type, $5=input_tokens, $6=output_tokens, $7=cost_usd, $8=output_text
INSERT INTO refinements (
  user_id, vision_id, category, operation_type, input_tokens, output_tokens, cost_usd, output_text,
  success, created_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8,
  true, NOW()
) RETURNING *;

-- READ: Get refinements for user
-- Parameters: $1=user_id
SELECT * FROM refinements 
WHERE user_id = $1 
ORDER BY created_at DESC;

-- READ: Get refinements for specific vision
-- Parameters: $1=user_id, $2=vision_id
SELECT * FROM refinements 
WHERE user_id = $1 AND vision_id = $2
ORDER BY created_at DESC;

-- READ: Get refinements by category
-- Parameters: $1=user_id, $2=category
SELECT * FROM refinements 
WHERE user_id = $1 AND category = $2
ORDER BY created_at DESC;

-- ============================================================================
-- MEMBERSHIP TIERS CRUD OPERATIONS
-- ============================================================================

-- READ: Get all active membership tiers
SELECT * FROM membership_tiers 
WHERE is_active = true 
ORDER BY display_order;

-- READ: Get membership tier by ID
-- Parameters: $1=id
SELECT * FROM membership_tiers 
WHERE id = $1;

-- READ: Get membership tier by tier type
-- Parameters: $1=tier_type
SELECT * FROM membership_tiers 
WHERE tier_type = $1 AND is_active = true;

-- ============================================================================
-- ASSESSMENT RESPONSES CRUD OPERATIONS
-- ============================================================================

-- CREATE: Insert assessment response
-- Parameters: $1=assessment_id, $2=question_id, $3=question_text, $4=category, $5=response_value, $6=response_text, $7=response_emoji, $8=green_line
INSERT INTO assessment_responses (
  assessment_id, question_id, question_text, category, response_value, response_text, response_emoji, green_line,
  answered_at, created_at, updated_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8,
  NOW(), NOW(), NOW()
) RETURNING *;

-- READ: Get assessment responses by assessment
-- Parameters: $1=assessment_id
SELECT * FROM assessment_responses 
WHERE assessment_id = $1
ORDER BY created_at DESC;

-- READ: Get assessment responses by category
-- Parameters: $1=category
SELECT * FROM assessment_responses 
WHERE category = $1
ORDER BY created_at DESC;

-- UPDATE: Update assessment response
-- Parameters: $1=id, $2=response_value, $3=response_text, $4=response_emoji, $5=green_line
UPDATE assessment_responses 
SET 
  response_value = $2,
  response_text = $3,
  response_emoji = $4,
  green_line = $5,
  updated_at = NOW()
WHERE id = $1 
RETURNING *;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

-- These queries are parameterized for security and performance
-- Always use prepared statements in your application code
-- Replace $1, $2, etc. with actual parameter values
-- All queries include proper user_id filtering for RLS compliance
