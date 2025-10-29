# Vibration Assessment System

**Last Updated:** January 31, 2025
**Version:** 2.0
**Status:** Production - Current

## Overview

The Vibration Assessment measures alignment across all 12 life categories, providing a "Green Line" status for each area.

## Current Features (As of January 2025)

### Assessment Structure

- **84 questions total** (7 questions per category × 12 categories)
- **Scoring**: Each question scored 1-5 points
- **35 points maximum** per category (5 points × 7 questions)
- **420 points total** (35 points × 12 categories)

### Green Line Thresholds

- **Above Green Line**: 28+ points per category (80%+) - Thriving, aligned, empowered
- **Transitioning**: 21-27 points (60-79%) - Moving toward alignment
- **Below Green Line**: <21 points (<60%) - Growth opportunities (NOT failure - contrast for clarity)

### Process Flow

1. **Start Assessment** (`/assessment`)
   - Goes through all 12 categories
   - 7 questions per category
   - User provides text answers

2. **AI Scoring** (Automatic)
   - Uses GPT-5 (configurable via `/admin/ai-models`)
   - Scores based on empowerment vs victim mindset
   - Scores based on abundance vs scarcity thinking
   - Overall vibrational alignment score

3. **Results** (`/assessment/results`)
   - Overall percentage score
   - Category-by-category scores
   - Green Line status per category
   - Strongest areas highlighted
   - Growth areas identified

## Database Schema

### `assessment_results` Table
- `id` (UUID)
- `user_id` (UUID)
- `overall_percentage` (integer) - Overall score out of 420
- `total_score` (integer)
- `green_line_status` (JSON) - Status per category
- `category_scores` (JSON) - Raw scores per category
- `completed_at` (timestamp)
- Relationship: `assessment_responses(*)`

### `assessment_responses` Table
- `id` (UUID)
- `assessment_result_id` (UUID)
- `user_id` (UUID)
- `category` (string) - Category key (fun, health, etc.)
- `question_text` (text)
- `response_text` (text) - User's answer
- `response_value` (integer 1-5) - AI score
- `green_line` ('above' | 'below') - Green Line status for this response

## Integration Points

- **Life Vision**: Assessment data informs personalized prompts
- **Profile**: Assessment complements profile stories
- **VIVA**: Assessment context used in AI prompts
- **Tokens**: Tracks usage for AI scoring

## User Paths

- Start: `/assessment`
- Results: `/assessment/results`
- In Progress: `/assessment/in-progress`

## Common User Questions

**Q: What does "Below Green Line" mean?**  
A: It means you're experiencing contrast in that area - this is valuable for clarity! It's not failure, it's information about what you want to shift toward.

**Q: Can I retake the assessment?**  
A: Yes, you can take multiple assessments. The latest one is used for personalization.

**Q: How does assessment data affect my Life Vision?**  
A: Your assessment scores and responses help VIVA create more personalized prompts when you're building your vision.

---

**Keep This Updated:** Assessment scoring logic or thresholds should be reflected here!
