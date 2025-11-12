# VibrationFit Database Schema Analysis

## Database Overview
- **Platform**: Supabase (PostgreSQL 14+)
- **Connection**: SSL-enabled with Row Level Security (RLS)
- **Authentication**: Supabase Auth with service role access
- **Total Tables**: 9 main tables + auth system tables

---

## 📊 Core Tables Analysis

### 1. **user_profiles** (Primary User Data)
**Purpose**: Comprehensive user profile with personal, financial, and story data
**Row Count**: 1 active profile

**Key Columns**:
- `id` (UUID, PK) - Primary key
- `user_id` (UUID, FK) - References auth.users(id)
- `first_name`, `last_name`, `email`, `phone` - Basic info
- `profile_picture_url` - Avatar storage
- `date_of_birth`, `gender`, `ethnicity` - Demographics
- `relationship_status`, `has_children` - Family info
- `height`, `weight`, `exercise_frequency` - Health metrics
- `city`, `state`, `country` - Location data
- `employment_type`, `occupation`, `company` - Career info
- `household_income`, `savings_retirement` - Financial data
- `*_story` fields (12 categories) - Life vision narratives
- `vibe_assistant_tokens_*` - AI usage tracking
- `membership_tier_id` - Subscription reference

**Notable Features**:
- Comprehensive life story tracking across 12 categories
- Token-based AI usage system
- Version control with `version_number`, `is_draft`, `is_active`
- Array fields for `children_ages`, `progress_photos`, `hobbies`

### 2. **vision_versions** (Life Vision Documents)
**Purpose**: Version-controlled life vision documents with 14 sections
**Row Count**: 2 versions

**Key Columns**:
- `id` (UUID, PK) - Primary key
- `user_id` (UUID, FK) - References auth.users(id)
- `version_number` (INTEGER) - Version control
- `title` (TEXT) - Document title
- `status` (TEXT) - 'draft' or 'complete'
- `completion_percent` (INTEGER) - Progress tracking
- **14 Life Categories**: `forward`, `fun`, `travel`, `home`, `family`, `romance`, `health`, `money`, `business`, `social`, `possessions`, `giving`, `spirituality`, `conclusion`
- `has_audio` (BOOLEAN) - Audio generation flag
- `audio_url`, `audio_duration`, `voice_type` - Audio metadata
- `ai_generated` (BOOLEAN) - AI creation flag
- `emotional_patterns`, `cross_category_themes` - AI analysis

**Notable Features**:
- Complete life vision across 12 categories + 2 meta sections
- Audio generation integration
- AI-powered refinement tracking
- Emotional pattern analysis

### 3. **journal_entries** (Daily Journaling)
**Purpose**: User journal entries with multimedia support
**Row Count**: 5 entries

**Key Columns**:
- `id` (UUID, PK) - Primary key
- `user_id` (UUID, FK) - References auth.users(id)
- `date` (DATE) - Entry date
- `title` (TEXT) - Entry title
- `content` (TEXT) - Main content
- `categories` (TEXT[]) - Life categories
- `image_urls` (TEXT[]) - Media attachments
- `audio_recordings` (JSONB[]) - Audio/video recordings

**Notable Features**:
- Multimedia support (images, audio, video)
- Category-based organization
- Array fields for flexible media storage

### 4. **vision_board_items** (Goal Tracking)
**Purpose**: Individual goals and aspirations with status tracking
**Row Count**: 4 items

**Key Columns**:
- `id` (UUID, PK) - Primary key
- `user_id` (UUID, FK) - References auth.users(id)
- `name` (TEXT) - Item name
- `description` (TEXT) - Detailed description
- `image_url` (TEXT) - Visual representation
- `status` (TEXT) - Current status
- `categories` (TEXT[]) - Life categories
- `actualized_at` (TIMESTAMP) - Completion date

**Notable Features**:
- Status-based goal tracking
- Visual representation support
- Category organization

### 5. **assessment_responses** (User Assessments)
**Purpose**: User assessment responses with AI scoring
**Row Count**: 84 responses

**Key Columns**:
- `id` (UUID, PK) - Primary key
- `assessment_id` (UUID, FK) - Assessment reference
- `question_id` (UUID, FK) - Question reference
- `question_text` (TEXT) - Question content
- `category` (TEXT) - Life category
- `response_value` (INTEGER) - Numeric response
- `response_text` (TEXT) - Text response
- `response_emoji` (TEXT) - Emotional indicator
- `green_line` (TEXT) - Alignment status
- `ai_green_line` (TEXT) - AI-determined alignment
- `is_custom_response` (BOOLEAN) - Custom flag

**Notable Features**:
- AI-powered response analysis
- "Green Line" alignment concept
- Multi-modal responses (numeric, text, emoji)

### 6. **token_usage** (AI Usage Tracking)
**Purpose**: Detailed AI token usage and cost tracking
**Row Count**: 62 usage records

**Key Columns**:
- `id` (UUID, PK) - Primary key
- `user_id` (UUID, FK) - References auth.users(id)
- `action_type` (TEXT) - Type of AI action
- `model_used` (TEXT) - AI model identifier
- `tokens_used`, `input_tokens`, `output_tokens` - Token counts
- `cost_estimate` (NUMERIC) - Cost in cents
- `success` (BOOLEAN) - Operation status
- `error_message` (TEXT) - Error details
- `metadata` (JSONB) - Additional context

**Notable Features**:
- Granular cost tracking
- Multiple AI action types
- Success/failure monitoring

### 7. **membership_tiers** (Subscription Plans)
**Purpose**: Subscription tier definitions and pricing
**Row Count**: 9 tiers

**Key Columns**:
- `id` (UUID, PK) - Primary key
- `name` (TEXT) - Tier name
- `tier_type` (ENUM) - Tier classification
- `price_monthly`, `price_yearly` (INTEGER) - Pricing in cents
- `monthly_vibe_assistant_tokens` (INTEGER) - Token allowance
- `features` (JSONB[]) - Feature list
- `stripe_product_id`, `stripe_price_id` - Stripe integration
- `is_popular` (BOOLEAN) - Marketing flag

**Notable Features**:
- Token-based pricing model
- Stripe integration ready
- Feature-based differentiation

### 8. **refinements** (AI Vision Refinements)
**Purpose**: AI-powered vision document refinements
**Row Count**: 1 refinement

**Key Columns**:
- `id` (UUID, PK) - Primary key
- `user_id` (UUID, FK) - References auth.users(id)
- `vision_id` (UUID, FK) - References vision_versions(id)
- `category` (TEXT) - Life category refined
- `operation_type` (TEXT) - Refinement type
- `input_tokens`, `output_tokens` - Token usage
- `cost_usd` (NUMERIC) - Cost tracking
- `refinement_percentage` (INTEGER) - Improvement metric
- `tonality`, `emotional_intensity` - Style parameters
- `input_text`, `output_text` - Before/after content

**Notable Features**:
- AI-powered content improvement
- Style and emotional parameters
- Cost and token tracking

### 9. **customer_subscriptions** (Active Subscriptions)
**Purpose**: Active user subscriptions (currently empty)
**Row Count**: 0 subscriptions

---

## 🔗 Key Relationships

### Primary Keys
- All tables use UUID primary keys
- Consistent `id` naming convention

### Foreign Keys
- `user_id` → `auth.users(id)` (most tables)
- `membership_tier_id` → `membership_tiers(id)` (user_profiles)
- `assessment_id` → assessments table (assessment_responses)
- `vision_id` → `vision_versions(id)` (refinements)

### Notable Relationships
- **One-to-Many**: Users → Vision Versions, Journal Entries, Vision Board Items
- **Many-to-One**: All user data → User Profile
- **Token Tracking**: All AI actions → Token Usage

---

## 📈 Performance Considerations

### Existing Indexes (from migrations)
- `idx_user_profiles_user_id` - User lookup
- `idx_vision_versions_user_id` - User visions
- `idx_token_usage_user_id` - User token tracking
- `idx_token_usage_action_type` - Action filtering
- `idx_token_usage_created_at` - Time-based queries

### Missing Indexes (Recommended)
```sql
-- Journal entries by user and date
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, date DESC);

-- Vision board items by user and status
CREATE INDEX idx_vision_board_items_user_status ON vision_board_items(user_id, status);

-- Assessment responses by user and category
CREATE INDEX idx_assessment_responses_user_category ON assessment_responses(user_id, category);

-- Token usage by user and action type
CREATE INDEX idx_token_usage_user_action ON token_usage(user_id, action_type);

-- Vision versions by user and status
CREATE INDEX idx_vision_versions_user_status ON vision_versions(user_id, status);
```

---

## 🔒 Row Level Security (RLS)

### Current RLS Status
All tables have RLS enabled with user-specific policies:
- **SELECT**: Users can only see their own data
- **INSERT**: Users can only insert their own data
- **UPDATE**: Users can only update their own data
- **DELETE**: Users can only delete their own data

### Missing RLS Policies
```sql
-- Token usage table needs system insert policy
CREATE POLICY "System can insert token usage"
  ON token_usage FOR INSERT
  WITH CHECK (true);

-- Membership tiers should be publicly readable
CREATE POLICY "Anyone can view membership tiers"
  ON membership_tiers FOR SELECT
  USING (true);
```

---

## 🚀 CRUD Query Templates

### User Profiles
```sql
-- CREATE
INSERT INTO user_profiles (user_id, first_name, last_name, email) 
VALUES ($1, $2, $3, $4) RETURNING *;

-- READ
SELECT * FROM user_profiles WHERE user_id = $1;

-- UPDATE
UPDATE user_profiles SET first_name = $2, last_name = $3 
WHERE user_id = $1 RETURNING *;

-- DELETE
DELETE FROM user_profiles WHERE user_id = $1;
```

### Vision Versions
```sql
-- CREATE
INSERT INTO vision_versions (user_id, title, version_number, forward, fun, travel) 
VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;

-- READ
SELECT * FROM vision_versions WHERE user_id = $1 ORDER BY created_at DESC;

-- UPDATE
UPDATE vision_versions SET forward = $2, completion_percent = $3 
WHERE id = $1 RETURNING *;

-- DELETE
DELETE FROM vision_versions WHERE id = $1 AND user_id = $2;
```

### Journal Entries
```sql
-- CREATE
INSERT INTO journal_entries (user_id, date, title, content, categories, image_urls) 
VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;

-- READ
SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY date DESC;

-- UPDATE
UPDATE journal_entries SET content = $2, image_urls = $3 
WHERE id = $1 RETURNING *;

-- DELETE
DELETE FROM journal_entries WHERE id = $1 AND user_id = $2;
```

---

## 📊 Database Statistics

- **Total Tables**: 9 main tables
- **Total Records**: ~160+ records
- **Largest Table**: assessment_responses (84 records)
- **Most Active**: token_usage (62 AI operations)
- **User Data**: 1 active user profile
- **Content**: 2 vision versions, 5 journal entries, 4 vision board items

---

## 🔧 Recommendations

### 1. **Index Optimization**
Add the missing indexes listed above for better query performance.

### 2. **RLS Policy Updates**
Implement the missing RLS policies for system operations.

### 3. **Data Archiving**
Consider archiving old token_usage records to maintain performance.

### 4. **Backup Strategy**
Implement regular backups of user data and vision content.

### 5. **Monitoring**
Set up monitoring for:
- Token usage patterns
- Database performance
- RLS policy effectiveness

---

*Analysis completed on: $(date)*
*Database: Supabase PostgreSQL*
*Connection: SSL-enabled with RLS*
