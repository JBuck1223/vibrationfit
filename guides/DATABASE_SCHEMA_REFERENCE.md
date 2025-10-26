# VibrationFit Database Schema Reference 📊

Complete SQL schema for all VibrationFit tables with production-ready definitions.

**Last Updated:** January 2025  
**Database:** PostgreSQL (Supabase)  
**Version:** 1.0

---

## Table of Contents

1. [User Profiles](#1-user-profiles)
2. [Vision Versions](#2-vision-versions)
3. [Assessment System](#3-assessment-system)
4. [Journal Entries](#4-journal-entries)
5. [Audio Tracks](#5-audio-tracks)
6. [Vision Board Items](#6-vision-board-items)
7. [Token Usage](#7-token-usage)
8. [AI Conversations](#8-ai-conversations)

---

## 1. User Profiles

### `user_profiles`

Stores user demographic information and token tracking.

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- ===== BASIC PROFILE FIELDS =====
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  profile_picture_url TEXT,
  date_of_birth DATE,
  gender TEXT,
  ethnicity TEXT,
  
  -- ===== RELATIONSHIP & FAMILY =====
  relationship_status TEXT,
  relationship_length TEXT,
  partner_name TEXT,
  has_children BOOLEAN DEFAULT false,
  number_of_children INTEGER DEFAULT 0,
  children_ages TEXT[],
  
  -- ===== LOCATION =====
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  living_situation TEXT,
  time_at_location TEXT,
  
  -- ===== CAREER & INCOME =====
  employment_type TEXT,
  occupation TEXT,
  company TEXT,
  time_in_role TEXT,
  currency TEXT,
  household_income TEXT,
  savings_retirement TEXT,
  assets_equity TEXT,
  consumer_debt TEXT,
  
  -- ===== LIFE VISION STORIES (12 CATEGORIES) =====
  current_story TEXT,
  desired_story TEXT,
  health_vitality_story TEXT,
  romance_partnership_story TEXT,
  family_parenting_story TEXT,
  social_friends_story TEXT,
  career_work_story TEXT,
  money_wealth_story TEXT,
  fun_recreation_story TEXT,
  travel_adventure_story TEXT,
  home_environment_story TEXT,
  possessions_lifestyle_story TEXT,
  spirituality_growth_story TEXT,
  giving_legacy_story TEXT,
  
  -- ===== STRUCTURED DATA (12 CATEGORIES) =====
  -- Fun & Recreation
  hobbies TEXT[],
  leisure_time_weekly TEXT,
  
  -- Travel & Adventure
  travel_frequency TEXT, -- 'never' | 'yearly' | 'quarterly' | 'monthly'
  passport BOOLEAN,
  countries_visited INTEGER,
  
  -- Social & Friends
  close_friends_count TEXT,
  social_preference TEXT, -- 'introvert' | 'ambivert' | 'extrovert'
  
  -- Possessions & Lifestyle
  lifestyle_category TEXT, -- 'minimalist' | 'moderate' | 'comfortable' | 'luxury'
  primary_vehicle TEXT,
  
  -- Spirituality & Growth
  spiritual_practice TEXT,
  meditation_frequency TEXT,
  personal_growth_focus BOOLEAN,
  
  -- Giving & Legacy
  volunteer_status TEXT,
  charitable_giving TEXT,
  legacy_mindset BOOLEAN,
  
  -- Additional fields
  units TEXT,
  height INTEGER,
  weight INTEGER,
  exercise_frequency TEXT,
  health_conditions TEXT,
  medications TEXT,
  education_level TEXT,
  
  -- ===== MEDIA =====
  progress_photos TEXT[],
  story_recordings JSONB, -- Audio/video recordings with transcripts
  
  -- ===== TOKEN TRACKING =====
  vibe_assistant_tokens_used INTEGER DEFAULT 0,
  vibe_assistant_tokens_remaining INTEGER DEFAULT 100,
  vibe_assistant_total_cost DECIMAL(10,2) DEFAULT 0,
  token_rollover_cycles INTEGER DEFAULT 0,
  token_last_drip_date TIMESTAMPTZ,
  auto_topup_enabled BOOLEAN DEFAULT false,
  auto_topup_pack_id TEXT,
  storage_quota_gb INTEGER DEFAULT 5,
  
  -- ===== VERSIONING SYSTEM =====
  version_number INTEGER DEFAULT 1,
  is_draft BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  version_notes TEXT,
  parent_version_id UUID REFERENCES user_profiles(id),
  completion_percentage INTEGER DEFAULT 0,
  
  -- ===== METADATA =====
  ai_tags JSONB,
  
  -- ===== TIMESTAMPS =====
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profiles" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profiles" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

**Key Fields:**
- `user_id` - Links to Supabase auth.users
- `audio_recordings` - JSONB array of voice/video recordings with metadata
- Token tracking fields for VIVA usage monitoring

---

## 2. Vision Versions

### `vision_versions`

Stores Life Vision documents across 12 categories + 2 meta sections.

```sql
CREATE TABLE IF NOT EXISTS vision_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  version_number INTEGER NOT NULL DEFAULT 1,
  
  -- 12 Life Category Sections
  forward TEXT DEFAULT '',          -- Meta: Forward
  fun TEXT DEFAULT '',              -- Fun / Recreation
  travel TEXT DEFAULT '',           -- Travel / Adventure
  home TEXT DEFAULT '',             -- Home / Environment
  family TEXT DEFAULT '',           -- Family / Parenting
  romance TEXT DEFAULT '',          -- Romance / Partnership
  health TEXT DEFAULT '',           -- Health / Vitality
  money TEXT DEFAULT '',            -- Money / Abundance
  business TEXT DEFAULT '',         -- Business / Career
  social TEXT DEFAULT '',           -- Social / Friends
  possessions TEXT DEFAULT '',      -- Possessions / Lifestyle
  giving TEXT DEFAULT '',           -- Giving / Contribution
  spirituality TEXT DEFAULT '',     -- Spirituality / Growth
  conclusion TEXT DEFAULT '',       -- Meta: Conclusion
  
  -- Status & Progress
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'complete')),
  completion_percentage INTEGER NOT NULL DEFAULT 0 
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Audio Generation
  last_audio_generated_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vision_versions_user_id ON vision_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_vision_versions_status ON vision_versions(status);
CREATE INDEX IF NOT EXISTS idx_vision_versions_created_at ON vision_versions(created_at DESC);

-- Row Level Security
ALTER TABLE vision_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own visions" ON vision_versions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visions" ON vision_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visions" ON vision_versions
  FOR UPDATE USING (auth.uid() = user_id);
```

**Key Features:**
- 14 sections total (12 categories + 2 meta)
- Version control with `version_number`
- Completion tracking via `completion_percentage`

---

## 3. Assessment System

### `assessment_results`

Main assessment results with Green Line status across 12 categories.

```sql
CREATE TYPE assessment_status AS ENUM (
  'not_started',
  'in_progress',
  'completed'
);

CREATE TYPE green_line_status AS ENUM (
  'above',      -- 80%+ (56-70 points) - Above the Green Line
  'transition', -- 60-79% (42-55 points) - In transition
  'below'       -- <60% (14-41 points) - Below the Green Line
);

CREATE TYPE assessment_category AS ENUM (
  'money', 'health', 'family', 'romance', 'social', 'business',
  'fun', 'travel', 'home', 'possessions', 'giving', 'spirituality'
);

CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Optional link to profile version
  profile_version_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Assessment status
  status assessment_status NOT NULL DEFAULT 'not_started',
  
  -- Scores
  total_score INTEGER DEFAULT 0,
  max_possible_score INTEGER DEFAULT 840, -- 12 categories × 70 max points
  overall_percentage INTEGER DEFAULT 0,
  
  -- Category data (JSONB for flexibility)
  category_scores JSONB DEFAULT '{}',
  -- Example: {"money": 56, "health": 42, "family": 68}
  
  green_line_status JSONB DEFAULT '{}',
  -- Example: {"money": "above", "health": "transition", "family": "above"}
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata
  assessment_version INTEGER DEFAULT 1,
  notes TEXT,
  
  CONSTRAINT valid_scores CHECK (total_score >= 0 AND total_score <= max_possible_score)
);

-- Indexes
CREATE INDEX idx_assessment_results_user_id ON assessment_results(user_id);
CREATE INDEX idx_assessment_results_status ON assessment_results(status);
CREATE INDEX idx_assessment_results_created_at ON assessment_results(created_at DESC);
```

### `assessment_responses`

Individual question responses.

```sql
CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessment_results(id) ON DELETE CASCADE,
  
  -- Question data
  question_id TEXT NOT NULL, -- e.g., "money_1", "health_3"
  question_text TEXT NOT NULL,
  category assessment_category NOT NULL,
  
  -- Response data
  response_value INTEGER NOT NULL CHECK (response_value IN (2, 4, 6, 8, 10)),
  response_text TEXT NOT NULL,
  response_emoji TEXT,
  green_line TEXT NOT NULL CHECK (green_line IN ('above', 'neutral', 'below')),
  
  -- Timestamps
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_assessment_question UNIQUE (assessment_id, question_id)
);

CREATE INDEX idx_assessment_responses_assessment_id ON assessment_responses(assessment_id);
CREATE INDEX idx_assessment_responses_category ON assessment_responses(category);
```

### `assessment_insights`

VIVA-generated insights based on responses.

```sql
CREATE TABLE assessment_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessment_results(id) ON DELETE CASCADE,
  category assessment_category NOT NULL,
  
  -- Insight data
  insight_type TEXT NOT NULL,
  -- e.g., "strength", "growth_area", "pattern", "recommendation"
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score NUMERIC(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  supporting_responses JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assessment_insights_assessment_id ON assessment_insights(assessment_id);
CREATE INDEX idx_assessment_insights_category ON assessment_insights(category);
```

---

## 4. Journal Entries

### `journal_entries`

Daily journal entries with media support.

```sql
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Entry data
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  
  -- Categories (array of life category labels)
  categories TEXT[] DEFAULT '{}',
  
  -- Media
  image_urls TEXT[] DEFAULT '{}',
  
  -- Audio Recordings Storage (JSONB array)
  audio_recordings JSONB DEFAULT '[]'::jsonb NOT NULL,
  -- Example structure:
  -- [{
  --   "url": "https://media.vibrationfit.com/uploads/.../recording.webm",
  --   "transcript": "This is my journal entry...",
  --   "type": "audio" | "video",
  --   "category": "journal",
  --   "duration": 120,
  --   "created_at": "2025-01-26T12:00:00Z"
  -- }]
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC);

-- Row Level Security
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journal entries" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries" ON journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries" ON journal_entries
  FOR DELETE USING (auth.uid() = user_id);
```

**Key Features:**
- Multiple categories per entry
- Image and video uploads via `image_urls` array
- Voice/video recordings stored in JSONB with transcripts

---

## 5. Audio Tracks

### `audio_tracks`

AI-narrated audio for life vision sections.

```sql
CREATE TYPE audio_generation_status AS ENUM (
  'pending', 'processing', 'completed', 'failed'
);

CREATE TABLE IF NOT EXISTS audio_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vision_id UUID NOT NULL REFERENCES vision_versions(id) ON DELETE CASCADE,
  
  -- Section identification
  section_key TEXT NOT NULL, 
  -- e.g., 'meta_introduction', 'health', 'money', etc.
  
  content_hash TEXT NOT NULL, -- SHA256 of normalized text
  text_content TEXT NOT NULL,
  
  -- Audio generation details
  voice_id TEXT NOT NULL, -- ElevenLabs voice ID
  s3_bucket TEXT NOT NULL,
  s3_key TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  status audio_generation_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (vision_id, section_key, content_hash)
);

-- Indexes
CREATE INDEX idx_audio_tracks_user_id ON audio_tracks(user_id);
CREATE INDEX idx_audio_tracks_vision_id ON audio_tracks(vision_id);
CREATE INDEX idx_audio_tracks_status ON audio_tracks(status);
CREATE INDEX idx_audio_tracks_section_key ON audio_tracks(section_key);

-- Row Level Security
ALTER TABLE audio_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own audio tracks" ON audio_tracks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audio tracks" ON audio_tracks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audio tracks" ON audio_tracks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audio tracks" ON audio_tracks
  FOR DELETE USING (auth.uid() = user_id);
```

**Key Features:**
- One audio track per vision section
- Content hashing prevents duplicate generation
- Stores S3 location and CDN URL

---

## 6. Vision Board Items

### `vision_board_items`

Vision board items with status tracking.

```sql
CREATE TABLE IF NOT EXISTS vision_board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Item details
  name TEXT NOT NULL,
  description TEXT,
  
  -- Media
  image_url TEXT,
  
  -- Categories (array of life category labels)
  categories TEXT[] DEFAULT '{}',
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'actualized', 'inactive')),
  actualized_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vision_board_items_user_id ON vision_board_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vision_board_items_status ON vision_board_items(status);
CREATE INDEX IF NOT EXISTS idx_vision_board_items_created_at ON vision_board_items(created_at DESC);

-- Row Level Security
ALTER TABLE vision_board_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vision board items" ON vision_board_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vision board items" ON vision_board_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vision board items" ON vision_board_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vision board items" ON vision_board_items
  FOR DELETE USING (auth.uid() = user_id);
```

**Key Features:**
- Multiple categories per item
- Status workflow: active → actualized
- Image support for visual goals

---

## 7. Token Usage

### `token_usage`

Tracks AI token usage and costs.

```sql
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'assessment_scoring',
    'vision_generation',
    'vision_refinement',
    'blueprint_generation',
    'chat_conversation',
    'audio_generation',
    'image_generation'
  )),
  
  -- Model and usage
  model_used TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_estimate NUMERIC(10, 4) DEFAULT 0, -- in cents
  
  -- Status
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX idx_token_usage_action_type ON token_usage(action_type);
CREATE INDEX idx_token_usage_model_used ON token_usage(model_used);
CREATE INDEX idx_token_usage_created_at ON token_usage(created_at DESC);
CREATE INDEX idx_token_usage_user_created ON token_usage(user_id, created_at DESC);
```

---

## 8. AI Conversations

### `ai_conversations`

Stores VIVA chat conversation history.

```sql
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message data
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  
  -- Context
  context JSONB DEFAULT '{}',
  -- Contains: { visionBuildPhase, category, isInitialGreeting, ... }
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at DESC);

-- Row Level Security
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);
```

**Note:** Currently only stores assistant responses. User messages are tracked in conversation flow but not persisted.

---

## Relationships Diagram

```
auth.users
    ├── user_profiles
    ├── vision_versions
    │       └── audio_tracks
    ├── assessment_results
    │       ├── assessment_responses
    │       └── assessment_insights
    ├── journal_entries
    ├── vision_board_items
    ├── token_usage
    └── ai_conversations
```

---

## Common Queries

### Get User's Active Vision
```sql
SELECT * FROM vision_versions 
WHERE user_id = $1 
  AND status = 'complete'
ORDER BY updated_at DESC 
LIMIT 1;
```

### Get Categories Below Green Line
```sql
SELECT key, value 
FROM jsonb_each_text(
  (SELECT green_line_status 
   FROM assessment_results 
   WHERE user_id = $1 
     AND status = 'completed'
   ORDER BY completed_at DESC 
   LIMIT 1)
)
WHERE value = 'below';
```

### Get Recent Journal Entries
```sql
SELECT * FROM journal_entries 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 10;
```

### Count Vision Board Items by Status
```sql
SELECT 
  status, 
  COUNT(*) as count
FROM vision_board_items 
WHERE user_id = $1 
GROUP BY status;
```

---

## Row Level Security (RLS) Summary

All tables enforce RLS policies ensuring users can only:
- **View** their own data
- **Insert** records with their own user_id
- **Update** their own records
- **Delete** their own records

Service role key is required for system operations (token tracking, insights generation).

---

**Last Updated:** January 2025  
**Version:** 1.0

---

## ⚠️ Note: This Document Reflects Live Production Schema

This document represents the **actual live schema** in your production Supabase database, based on applied migrations and TypeScript interfaces. It includes all versioning fields, token tracking, audio recordings, and other production features currently in use.

### Key Differences from Original Designs:
- **Profile Versioning System** - Active/Draft/Complete workflow
- **Token Tracking** - VIVA usage monitoring and cost tracking  
- **Audio Recordings** - JSONB storage for voice/video with transcripts
- **Completion Tracking** - Percentage-based progress metrics
- **Version Control** - Full version history with parent references

### Migration History (Applied):
1. `20250120000003_add_missing_tables.sql` - Token tracking, AI fields
2. `20250126000000_profile_versioning_system.sql` - Versioning, completion tracking
3. `20250126000001_add_audio_recordings_to_journal_entries.sql` - Audio support
4. `20251025123932_remove_entry_type_from_journal_entries.sql` - Schema cleanup
