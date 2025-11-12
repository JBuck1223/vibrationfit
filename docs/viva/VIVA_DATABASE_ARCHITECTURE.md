# VIVA Database Architecture
## Complete Table Reference

This document provides a comprehensive overview of all database tables that VIVA uses to build its understanding and provide personalized, cross-category conversations.

---

## 📋 Quick Reference - All Fields by Table

### `user_profiles` Fields
- id, user_id, age, gender, location_city, location_state, location_country, timezone
- lifestyle, marital_status, household_income, occupation, industry
- interests[], hobbies[], values[], goals[], priorities[]
- strengths[], personality_traits[]
- romance_partnership_story, family_parenting_story, career_work_story, money_wealth_story, home_environment_story, health_vitality_story, fun_recreation_story, travel_adventure_story, social_friends_story, possessions_lifestyle_story, giving_legacy_story, spirituality_growth_story
- current_challenges, biggest_dreams, barriers_to_success
- created_at, updated_at

### `assessment_results` Fields
- id, user_id
- overall_score, overall_vibration, green_line_status
- category_scores (JSONB)
- top_categories[], focus_areas[], alignment_score, resistance_score
- created_at, completed_at, updated_at

### `assessment_responses` Fields
- id, user_id, assessment_id
- category, question_id, question_text, response_value
- is_custom_response, custom_text
- ai_score, ai_green_line, ai_insights
- created_at

### `assessment_insights` Fields
- id, user_id, assessment_id
- insight_type, category, insight_text, priority
- supporting_data (JSONB)
- created_at

### `vision_versions` Fields
- id, user_id, title, version_number
- forward, fun, health, travel, romance, family, social, home, business, money, possessions, giving, spirituality, conclusion
- is_active, completion_percentage
- audio_url, audio_duration
- created_at, updated_at

### `journal_entries` Fields
- id, user_id, date, category, content
- entry_type, mood, emotional_tone
- media_urls[]
- ai_tags[], ai_insights, sentiment_score
- created_at, updated_at

### `refinements` Fields
- id, user_id
- category, operation_type
- input_text, output_text, prompt_used
- user_rating, user_feedback, approved
- model_used, total_tokens, cost_usd, reasoning_tier
- created_at, updated_at

### `viva_conversations` Fields (✅ NEW)
- id, user_id, category, session_id
- cycle_number, viva_prompt, user_response
- context_data (JSONB)
- created_at, updated_at

### `vibrational_links` Fields (✅ NEW)
- id, user_id, category_a, category_b, strength
- shared_themes[], connection_type, notes
- evidence_count
- last_updated, created_at

---

## 📋 Table Summary

**Core Tables** (existing):
- `user_profiles` - Demographics, lifestyle, values, personal stories
- `assessment_results` - Category scores, overall vibration, green line status
- `assessment_responses` - Individual question responses
- `assessment_insights` - AI-generated recommendations
- `vision_versions` - 14-category vision content (Forward + 12 + Conclusion)
- `journal_entries` - Evidence, patterns, emotional tone
- `refinements` - AI interaction history and quality tracking

**VIVA Tables** (newly created):
- ✅ `viva_conversations` - Conversation history and session management
- ✅ `vibrational_links` - Cross-category emotional connections

---

# Table: `user_profiles`
