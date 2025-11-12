# Token Balance Reconciliation Guide

## Overview

This guide helps you reconcile a user's token balance stored in `user_profiles` against their actual usage logged in `token_usage`.

## Database Tables

### 1. `token_usage` - Audit Trail Table
**Location:** All token usage is logged here

**Key Columns:**
- `user_id` - UUID of the user
- `action_type` - Type of AI action (see list below)
- `model_used` - AI model used (gpt-4, gpt-5-mini, etc.)
- `tokens_used` - Total tokens used for this operation
- `input_tokens` - Input tokens (if available)
- `output_tokens` - Output tokens (if available)
- `cost_estimate` - Cost in cents
- `success` - Whether the operation succeeded
- `error_message` - Error message if failed
- `metadata` - Additional context (JSONB)
- `created_at` - Timestamp of the operation

**Action Types:**
- `assessment_scoring` - AI scoring of assessment responses
- `vision_generation` - Vision document generation
- `vision_refinement` - Vision refinement operations
- `blueprint_generation` - Actualization blueprint generation
- `chat_conversation` - VIVA chat interactions
- `audio_generation` - Text-to-speech and transcription
- `image_generation` - DALL-E image generation
- `life_vision_category_summary` - Category summaries
- `life_vision_master_assembly` - Master vision assembly
- `prompt_suggestions` - Prompt suggestion generation
- `frequency_flip` - Frequency flipping operations
- `admin_grant` - Admin token grants
- `admin_deduct` - Admin token deductions

### 2. `user_profiles` - Current Balance Table
**Location:** Current token balance is stored here

**Key Columns:**
- `user_id` - UUID of the user (references auth.users)
- `vibe_assistant_tokens_remaining` - Current remaining tokens
- `vibe_assistant_tokens_used` - Total tokens used (lifetime)
- `vibe_assistant_total_cost` - Total cost in dollars (not cents)

## How to Reconcile a User's Balance

### Step 1: View Current vs Calculated Balance

Run the first query in `sql/scripts/reconcile-user-token-balance.sql`:

```sql
-- Replace 'USER_ID_HERE' with the actual user_id UUID
-- This shows:
-- - Current balance from user_profiles
-- - Calculated balance from token_usage
-- - Discrepancies between them
```

**What to look for:**
- **Used Discrepancy**: Difference between `current_used` and `calculated_used`
- **Cost Discrepancy**: Difference between `current_cost` and `calculated_cost`
- Large discrepancies (>1000 tokens) indicate a problem

### Step 2: Review Usage Breakdown

Run the second query to see usage by action type:

```sql
-- Shows breakdown by action_type and model_used
-- Helps identify which features are using the most tokens
```

### Step 3: Review Recent Operations

Run the third query to see the last 50 operations:

```sql
-- Shows recent token usage with full details
-- Helps identify if there are failed operations or errors
```

### Step 4: Calculate Expected Balance

Run the fourth query to calculate what the balance SHOULD be:

```sql
-- Requires knowing the initial grant amount
-- Formula: initial_grant + admin_grants - tokens_used - admin_deductions = remaining
```

**Important:** You need to know:
- Initial token grant (from membership tier or manual grant)
- Any admin grants/deductions

### Step 5: Update Balance (If Needed)

⚠️ **USE WITH CAUTION** - This will overwrite the current balance!

Uncomment and run the UPDATE query in Step 5 of the script:

```sql
-- Make sure to:
-- 1. Replace USER_ID_HERE with actual user_id
-- 2. Replace 5000000 with actual initial grant
-- 3. Review discrepancies first!
-- 4. Backup the user_profiles table before running
```

## Common Scenarios

### Scenario 1: Balance is Higher Than It Should Be

**Possible Causes:**
- Token tracking wasn't implemented when user started using features
- Some operations failed to track tokens
- Admin grants that weren't logged

**Solution:**
1. Review `token_usage` table for gaps
2. Check if user has operations before token tracking was implemented
3. Manually deduct the difference using admin tools

### Scenario 2: Balance is Lower Than It Should Be

**Possible Causes:**
- Failed operations were counted as used
- Double-counting of tokens
- Balance was manually adjusted incorrectly

**Solution:**
1. Review failed operations (`success = false`)
2. Check for duplicate entries in `token_usage`
3. Manually grant tokens to correct the balance

### Scenario 3: Cost Doesn't Match Usage

**Possible Causes:**
- Cost calculation changed over time
- Different models have different costs
- Admin adjustments weren't logged

**Solution:**
1. Review cost calculation logic in `trackTokenUsage()`
2. Check model pricing has been consistent
3. Recalculate cost from token_usage records

## Finding Initial Grant Amount

The initial grant amount is typically:
- **Annual Membership:** 5,000,000 tokens
- **Monthly Membership:** 600,000 tokens per cycle
- **Manual Admin Grant:** Check `token_usage` table for `admin_grant` entries

To find a user's initial grant:

```sql
-- Check for admin grants (these are usually the initial grant)
SELECT 
  tokens_used,
  created_at,
  metadata
FROM token_usage
WHERE user_id = 'USER_ID_HERE'
  AND action_type = 'admin_grant'
ORDER BY created_at ASC
LIMIT 1;
```

## Admin Tools

### View User Balance
**Location:** `/admin/users` (if implemented)

### Adjust User Balance
**API Endpoint:** `POST /api/admin/users/adjust-tokens`

**Request Body:**
```json
{
  "userId": "user-uuid-here",
  "delta": 10000  // Positive for grant, negative for deduction
}
```

This will:
1. Create a `token_usage` record with `admin_grant` or `admin_deduct`
2. Update `user_profiles` balance accordingly

## Monitoring Queries

### Find All Users with Discrepancies

```sql
-- See Step 6 in reconcile-user-token-balance.sql
-- Shows users with balance discrepancies > 100 tokens
```

### Find Users with Low Balance

```sql
SELECT 
  user_id,
  vibe_assistant_tokens_remaining,
  vibe_assistant_tokens_used
FROM user_profiles
WHERE vibe_assistant_tokens_remaining < 10000
ORDER BY vibe_assistant_tokens_remaining ASC;
```

### Find Users with High Usage

```sql
SELECT 
  user_id,
  vibe_assistant_tokens_used,
  vibe_assistant_total_cost
FROM user_profiles
ORDER BY vibe_assistant_tokens_used DESC
LIMIT 20;
```

## Best Practices

1. **Always backup** `user_profiles` before making bulk updates
2. **Review discrepancies** before updating balances
3. **Document** any manual adjustments with notes in metadata
4. **Monitor** for discrepancies regularly (weekly/monthly)
5. **Test** reconciliation script on a test user first

## Troubleshooting

### No Records in token_usage
- User might have started before token tracking was implemented
- Check if user has any AI operations at all
- May need to manually set balance based on membership tier

### Negative Balance
- This shouldn't happen (system prevents it)
- If it does, check for calculation errors
- Grant tokens to bring balance positive

### Balance Doesn't Match Usage
- Check for admin grants/deductions
- Verify initial grant amount
- Check for operations before token tracking started
- Review failed operations (they shouldn't deduct tokens)

---

**Script Location:** `sql/scripts/reconcile-user-token-balance.sql`  
**Last Updated:** February 3, 2025

