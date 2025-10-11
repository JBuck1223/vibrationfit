# Assessment System Database Schema

## Overview
This migration creates the complete database schema for VibrationFit's vibrational assessment tool, which measures users' "Green Line status" across 12 life categories.

## Migration File
`20250111000000_create_assessment_tables.sql`

## To Apply Migration
```bash
# Start Docker Desktop first, then:
npx supabase db reset
# Or if already running:
npx supabase db push
```

## Tables Created

### 1. `assessment_results`
Main table storing overall assessment data for each user.

**Key Fields:**
- `id` - UUID primary key
- `user_id` - Foreign key to auth.users
- `status` - Enum: `not_started`, `in_progress`, `completed`
- `total_score` - Sum of all category scores (0-840)
- `category_scores` - JSONB: `{"money": 56, "health": 42, ...}`
- `green_line_status` - JSONB: `{"money": "above", "health": "transition", ...}`
- `started_at`, `completed_at` - Timestamps

### 2. `assessment_responses`
Individual question responses.

**Key Fields:**
- `id` - UUID primary key
- `assessment_id` - Foreign key to assessment_results
- `question_id` - Text ID (e.g., "money_1")
- `category` - Enum matching 12 life categories
- `response_value` - Integer: 2, 4, 6, 8, or 10
- `response_text` - The selected answer text
- `green_line` - Classification: `above`, `neutral`, `below`

### 3. `assessment_insights`
VIVA-generated insights based on assessment data.

**Key Fields:**
- `id` - UUID primary key
- `assessment_id` - Foreign key to assessment_results
- `category` - Which life category this insight relates to
- `insight_type` - Type: `strength`, `growth_area`, `pattern`, `recommendation`
- `title` - Short insight title
- `description` - Full insight text
- `confidence_score` - 0-1 confidence level

## Enums Created

### `assessment_status`
- `not_started` - Assessment hasn't been started
- `in_progress` - Assessment is partially complete
- `completed` - All questions answered

### `green_line_status`
- `above` - 80%+ (56-70 points) - Above the Green Line
- `transition` - 60-79% (42-55 points) - In transition
- `below` - <60% (14-41 points) - Below the Green Line

### `assessment_category`
12 life categories matching the Life Vision system:
- `money` - Money / Wealth
- `health` - Health / Vitality
- `family` - Family / Parenting
- `romance` - Love / Romance
- `social` - Social / Friends
- `business` - Business / Career
- `fun` - Fun / Recreation
- `travel` - Travel / Adventure
- `home` - Home / Environment
- `possessions` - Possessions / Stuff
- `giving` - Giving / Legacy
- `spirituality` - Spirituality

## Helper Functions

### `calculate_category_score(assessment_id, category)`
Returns the total score for a specific category (0-70 points).

### `get_green_line_status(score)`
Returns Green Line status for a given score:
- 56-70 points → `above`
- 42-55 points → `transition`
- 14-41 points → `below`

### `update_assessment_scores()`
Trigger function that automatically recalculates:
- Category scores
- Green Line statuses
- Total score
- Overall percentage

Fires after any INSERT, UPDATE, or DELETE on `assessment_responses`.

## Security

All tables have Row Level Security (RLS) enabled:
- Users can only access their own assessments
- Users can CRUD their own responses
- Insights are read-only for users (VIVA writes)

## Scoring System

### Per Question
- 5 options per question
- Values: 2, 4, 6, 8, 10
- Mapped to Green Line: `below`, `neutral`, `above`

### Per Category
- 7 questions per category
- Max score: 70 points (7 × 10)
- Min score: 14 points (7 × 2)

### Overall Assessment
- 12 categories × 70 max = 840 total points
- Percentage = (total_score / 840) × 100

## Integration Points

### With Profile System
- Optional `profile_version_id` links assessment to profile
- Assessment data informs VIVA vision generation

### With VIVA
- Assessment responses → Insights generation
- Green Line status → Vision recommendations
- Pattern detection → Personalized guidance

## Example Queries

```sql
-- Get user's latest assessment
SELECT * FROM assessment_results
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1;

-- Get all responses for an assessment
SELECT * FROM assessment_responses
WHERE assessment_id = 'xxx'
ORDER BY category, question_id;

-- Get category breakdown
SELECT 
  category,
  category_scores->category::text as score,
  green_line_status->category::text as status
FROM assessment_results
WHERE id = 'xxx';

-- Get insights for a category
SELECT * FROM assessment_insights
WHERE assessment_id = 'xxx'
  AND category = 'money'
ORDER BY confidence_score DESC;
```

## Next Steps

After migration:
1. Build API routes (`/api/assessment/*`)
2. Create UI components for assessment flow
3. Implement VIVA integration for insights
4. Add navigation to main app

