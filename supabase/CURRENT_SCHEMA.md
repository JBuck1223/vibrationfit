# 🗄️ VibrationFit Database Schema - Current State

**Last Updated:** November 12, 2025  
**Source:** Fresh dump from production Supabase database  
**Total Tables:** 51

---

## 📋 Table of Contents

1. [Life Vision System (V3)](#life-vision-system-v3)
2. [User Management](#user-management)
3. [Assessment System](#assessment-system)
4. [Token & Payment System](#token--payment-system)
5. [AI & Content Generation](#ai--content-generation)
6. [Media & Assets](#media--assets)
7. [Legacy/Deprecated Tables](#legacydeprecated-tables)

---

## 🎯 Life Vision System (V3)

### `life_vision_category_state` ✅ **ACTIVE**
**Purpose:** V3 per-category state storage (clean, optimized)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `category` | varchar(50) | Life category (fun, health, travel, etc.) |
| `transcript` | text | Step 1: User audio/text transcript |
| `ai_summary` | text | Step 1: VIVA-generated category summary |
| `ideal_state` | text | Step 2: User imagination/ideal state answers |
| `blueprint_data` | jsonb | Step 3: Being/Doing/Receiving loops |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Constraints:**
- CHECK: category IN ('fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality')
- UNIQUE: (user_id, category)

---

### `vision_versions` ✅ **ACTIVE**
**Purpose:** Complete assembled life visions

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `version_number` | integer | Version number for this user |
| `title` | text | Vision title |
| `status` | text | 'draft' or 'complete' |
| `completion_percent` | integer | % complete (0-100) |
| **Bookends** |
| `forward` | text | Opening invocation |
| `conclusion` | text | Closing statement |
| `perspective` | text | 'singular' (I/my) or 'plural' (we/our) |
| **12 Categories** |
| `fun` | text | Fun/Recreation content |
| `health` | text | Health/Vitality content |
| `travel` | text | Travel/Adventure content |
| `love` | text | Love/Romance/Partnership content |
| `family` | text | Family/Parenting content |
| `social` | text | Social/Friends content |
| `home` | text | Home/Environment content |
| `work` | text | Work/Business/Career content |
| `money` | text | Money/Wealth content |
| `stuff` | text | Stuff/Possessions/Lifestyle content |
| `giving` | text | Giving/Legacy content |
| `spirituality` | text | Spirituality/Growth content |
| **Audio & Metadata** |
| `has_audio` | boolean | Whether audio exists |
| `audio_url` | text | Audio file URL |
| `audio_duration` | text | Duration string |
| `voice_type` | text | Voice used |
| `background_music` | text | Music track |
| `last_audio_generated_at` | timestamptz | Last audio generation |
| **V3 Fields** |
| `activation_message` | text | Custom activation/next steps |
| `richness_metadata` | jsonb | Density stats per category |
| `perspective` | text | 'singular' (I/my) or 'plural' (we/our) |
| `refined_categories` | jsonb | Array of categories that have been refined |
| **Timestamps** |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |
| `is_draft` | boolean | Draft status |
| `is_active` | boolean | Active/current vision |

**Note:** Cleaned on 2025-11-11 (removed 7 deprecated columns)

---

### `scenes` ✅ **ACTIVE**
**Purpose:** Visualization scenes for vision categories

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `category` | text | Life category |
| `scene_text` | text | Scene description |
| `scene_title` | text | Scene title |
| `essence_word` | text | Single essence word |
| `created_at` | timestamptz | Creation timestamp |

---

### `frequency_flip` ✅ **ACTIVE**
**Purpose:** Contrast-to-clarity transformations

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `category` | varchar(50) | Life category |
| `input_text` | text | Original contrast/complaint |
| `clarity_seed` | text | Transformed clarity statement |
| `created_at` | timestamptz | Creation timestamp |

---

### `refinements` ⚠️ **LEGACY**
**Purpose:** Old vibe-assistant operations (V3 data moved to `life_vision_category_state`)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `vision_id` | uuid | Associated vision |
| `category` | varchar(50) | Life category |
| `operation_type` | varchar(50) | Operation: refine_vision, generate_guidance |
| `input_text` | text | Input |
| `output_text` | text | Output |
| `viva_notes` | text | AI reasoning notes |
| `created_at` | timestamptz | Creation timestamp |
| `migrated_to_v3` | boolean | Whether data moved to V3 table |

**Note:** Cleaned on 2025-11-11 (removed 16 deprecated columns). V3 uses `life_vision_category_state` instead.

---

## 👤 User Management

### `user_profiles` ✅ **ACTIVE**
**Purpose:** Extended user profile data with versioning support

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| **Personal Information** |
| `first_name` | text | First name |
| `last_name` | text | Last name |
| `email` | text | Email address |
| `phone` | text | Phone number |
| `profile_picture_url` | text | Profile picture URL |
| `date_of_birth` | date | Birthday |
| `gender` | text | Gender/Identity |
| `ethnicity` | text | Ethnicity |
| `education` | text | Education level |
| `education_description` | text | Education details |
| **Relationship & Family** |
| `relationship_status` | text | Single, In a Relationship, Married |
| `relationship_length` | text | Length of current relationship |
| `partner_name` | text | Partner's name |
| `has_children` | boolean | Has children flag |
| `number_of_children` | integer | Number of children (0-20) |
| `children_ages` | text[] | Array of children ages |
| `children` | jsonb | Children details |
| **Health & Fitness** |
| `units` | text | US or Metric |
| `height` | numeric(5,2) | Height |
| `weight` | numeric(6,2) | Weight |
| `exercise_frequency` | text | Exercise frequency |
| **Location & Home** |
| `living_situation` | text | Own, Rent, etc. |
| `time_at_location` | text | Time at current location |
| `city` | text | City |
| `state` | text | State |
| `postal_code` | text | Postal/ZIP code |
| `country` | text | Country (default: United States) |
| **Work & Career** |
| `employment_type` | text | Employee, Business Owner, etc. |
| `occupation` | text | Job title |
| `company` | text | Company name |
| `time_in_role` | text | Time in current role |
| **Financial** |
| `currency` | text | Currency (default: USD) |
| `household_income` | text | Household income range |
| `savings_retirement` | text | Savings/retirement range |
| `assets_equity` | text | Assets/equity range |
| `consumer_debt` | text | Consumer debt range |
| **Fun & Lifestyle** |
| `hobbies` | text[] | Array of hobbies |
| `leisure_time_weekly` | text | Weekly leisure time |
| `lifestyle_category` | enum | Lifestyle category |
| **Travel & Adventure** |
| `travel_frequency` | enum | Travel frequency |
| `passport` | boolean | Has valid passport |
| `countries_visited` | integer | Number of countries visited |
| `trips` | jsonb | Trip details |
| **Social & Friends** |
| `close_friends_count` | text | Number of close friends |
| `social_preference` | enum | Social preference |
| **Possessions & Vehicles** |
| `has_vehicle` | boolean | Has vehicle flag |
| `primary_vehicle` | text | Primary vehicle |
| `vehicles` | jsonb | Vehicle details |
| `toys` | jsonb | Toys/possessions details |
| **Spirituality & Growth** |
| `spiritual_practice` | text | Spiritual practice type |
| `meditation_frequency` | text | Meditation frequency |
| `personal_growth_focus` | boolean | Personal growth focus flag |
| **Giving & Legacy** |
| `volunteer_status` | text | Volunteer status |
| `charitable_giving` | text | Charitable giving |
| `legacy_mindset` | boolean | Legacy mindset flag |
| **Life Vision Categories (Clarity)** |
| `clarity_fun` | text | Fun/Recreation clarity |
| `clarity_health` | text | Health/Vitality clarity |
| `clarity_travel` | text | Travel/Adventure clarity |
| `clarity_love` | text | Love/Romance clarity |
| `clarity_family` | text | Family clarity |
| `clarity_social` | text | Social/Friends clarity |
| `clarity_home` | text | Home/Environment clarity |
| `clarity_work` | text | Work/Career clarity |
| `clarity_money` | text | Money/Wealth clarity |
| `clarity_stuff` | text | Stuff/Possessions clarity |
| `clarity_giving` | text | Giving/Legacy clarity |
| `clarity_spirituality` | text | Spirituality/Growth clarity |
| **Life Vision Categories (Dream)** |
| `dream_fun` | text | Fun/Recreation dreams |
| `dream_health` | text | Health/Vitality dreams |
| `dream_travel` | text | Travel/Adventure dreams |
| `dream_love` | text | Love/Romance dreams |
| `dream_family` | text | Family dreams |
| `dream_social` | text | Social/Friends dreams |
| `dream_home` | text | Home/Environment dreams |
| `dream_work` | text | Work/Career dreams |
| `dream_money` | text | Money/Wealth dreams |
| `dream_stuff` | text | Stuff/Possessions dreams |
| `dream_giving` | text | Giving/Legacy dreams |
| `dream_spirituality` | text | Spirituality/Growth dreams |
| **Life Vision Categories (Contrast)** |
| `contrast_fun` | text | Fun/Recreation contrasts |
| `contrast_health` | text | Health/Vitality contrasts |
| `contrast_travel` | text | Travel/Adventure contrasts |
| `contrast_love` | text | Love/Romance contrasts |
| `contrast_family` | text | Family contrasts |
| `contrast_social` | text | Social/Friends contrasts |
| `contrast_home` | text | Home/Environment contrasts |
| `contrast_work` | text | Work/Career contrasts |
| `contrast_money` | text | Money/Wealth contrasts |
| `contrast_stuff` | text | Stuff/Possessions contrasts |
| `contrast_giving` | text | Giving/Legacy contrasts |
| `contrast_spirituality` | text | Spirituality/Growth contrasts |
| **Life Vision Categories (Worry)** |
| `worry_fun` | text | Fun/Recreation worries |
| `worry_health` | text | Health/Vitality worries |
| `worry_travel` | text | Travel/Adventure worries |
| `worry_love` | text | Love/Romance worries |
| `worry_family` | text | Family worries |
| `worry_social` | text | Social/Friends worries |
| `worry_home` | text | Home/Environment worries |
| `worry_work` | text | Work/Career worries |
| `worry_money` | text | Money/Wealth worries |
| `worry_stuff` | text | Stuff/Possessions worries |
| `worry_giving` | text | Giving/Legacy worries |
| `worry_spirituality` | text | Spirituality/Growth worries |
| **Household** |
| `household_id` | uuid | Foreign key to households |
| `is_household_admin` | boolean | Household admin flag |
| `allow_shared_tokens` | boolean | Allow shared tokens flag |
| **Media & Recordings** |
| `progress_photos` | text[] | Array of progress photo URLs |
| `story_recordings` | jsonb | Story recording metadata |
| `ai_tags` | jsonb | AI-generated tags |
| **Versioning** |
| `version_number` | integer | Version number (default: 1) |
| `is_draft` | boolean | Draft status |
| `is_active` | boolean | Active version flag |
| `parent_version_id` | uuid | Parent version ID (self-reference) |
| `version_notes` | text | Version notes |
| **Timestamps** |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |

**Constraints:**
- UNIQUE: One active non-draft profile per user
- UNIQUE: One draft profile per user
- CHECK: Various enum validations for gender, ethnicity, employment_type, etc.
- FOREIGN KEY: `parent_version_id` references `user_profiles(id)` (self-referencing)
- FOREIGN KEY: `household_id` references `households(id)`
- FOREIGN KEY: `user_id` references `auth.users(id)` on delete CASCADE

---

### `voice_profiles` ✅ **ACTIVE**
**Purpose:** User voice/tone analysis for AI personalization

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `formality` | integer | 1-10 scale |
| `energy` | integer | 1-10 scale |
| `detail` | integer | 1-10 scale |
| `woo` | integer | 1-10 scale (spiritual language comfort) |
| `analysis` | jsonb | Full voice analysis |
| `created_at` | timestamptz | Creation timestamp |

---

### `profiles` ✅ **ACTIVE**
**Purpose:** Supabase default profile table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key (auth.users id) |
| `first_name` | text | First name |
| `last_name` | text | Last name |
| `email` | text | Email |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |
| `stripe_customer_id` | text | Stripe customer ID |
| `subscription_status` | text | Subscription status |

---

## 📊 Assessment System

### `assessment_results` ✅ **ACTIVE**
**Purpose:** User assessment completions and scores

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `assessment_type` | text | Type of assessment |
| `overall_percentage` | integer | Overall score (0-100) |
| `green_line_status` | text | Above/Below Green Line |
| `category_scores` | jsonb | Scores per category |
| `insights` | jsonb | Generated insights |
| `completed_at` | timestamptz | Completion timestamp |
| `created_at` | timestamptz | Creation timestamp |

---

### `assessment_responses` ✅ **ACTIVE**
**Purpose:** Individual question responses

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `assessment_result_id` | uuid | Foreign key to assessment_results |
| `user_id` | uuid | Foreign key to auth.users |
| `question_id` | text | Question identifier |
| `category` | text | Life category |
| `response_text` | text | User's text response |
| `response_value` | integer | Numeric response |
| `created_at` | timestamptz | Creation timestamp |

---

### `assessment_insights` ✅ **ACTIVE**
**Purpose:** AI-generated assessment insights

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `assessment_result_id` | uuid | Foreign key to assessment_results |
| `user_id` | uuid | Foreign key to auth.users |
| `category` | text | Life category |
| `insight_type` | text | Type of insight |
| `insight_text` | text | Insight content |
| `priority_level` | integer | Priority (1-5) |
| `created_at` | timestamptz | Creation timestamp |

---

## 💰 Token & Payment System

### `token_transactions` ✅ **ACTIVE**
**Purpose:** All token movements (grants, purchases, usage)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `amount` | integer | Token amount (positive = add, negative = deduct) |
| `transaction_type` | text | Type: grant, purchase, usage, refund |
| `description` | text | Human-readable description |
| `reference_id` | text | External reference (e.g., Stripe payment ID) |
| `metadata` | jsonb | Additional data |
| `created_at` | timestamptz | Transaction timestamp |
| `previous_balance` | integer | Balance before transaction |
| `new_balance` | integer | Balance after transaction |

**Note:** Source of truth for token balance (sum of all amounts)

---

### `token_usage` ⚠️ **LEGACY (Read-Only)**
**Purpose:** AI usage tracking (historical data only)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `action_type` | text | Action performed |
| `model_used` | text | AI model |
| `tokens_used` | integer | Tokens consumed |
| `cost_estimate` | numeric | Cost in cents |
| `input_tokens` | integer | Input token count |
| `output_tokens` | integer | Output token count |
| `metadata` | jsonb | Additional context |
| `created_at` | timestamptz | Timestamp |

**Note:** Historical tracking only. Use `token_transactions` for balance calculations.

---

### `payment_history` ✅ **ACTIVE**
**Purpose:** Stripe payment records

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `stripe_payment_intent_id` | text | Stripe payment intent ID |
| `amount_cents` | integer | Amount in cents |
| `status` | text | Payment status |
| `tokens_granted` | integer | Tokens granted for this payment |
| `created_at` | timestamptz | Payment timestamp |

---

### `customer_subscriptions` ✅ **ACTIVE**
**Purpose:** Stripe subscription management

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `stripe_subscription_id` | text | Stripe subscription ID |
| `stripe_customer_id` | text | Stripe customer ID |
| `plan_id` | text | Plan identifier |
| `status` | text | Subscription status |
| `current_period_start` | timestamptz | Current billing period start |
| `current_period_end` | timestamptz | Current billing period end |
| `cancel_at_period_end` | boolean | Whether canceling |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |

---

## 🤖 AI & Content Generation

### `ai_usage_logs` ✅ **ACTIVE**
**Purpose:** Detailed AI operation logs

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `operation_type` | text | Operation performed |
| `tokens_used` | integer | Tokens consumed |
| `model_used` | text | AI model |
| `response_time_ms` | integer | Response time |
| `success` | boolean | Whether successful |
| `error_message` | text | Error details |
| `created_at` | timestamptz | Timestamp |

---

### `ai_conversations` ✅ **ACTIVE**
**Purpose:** VIVA conversation sessions

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `conversation_type` | text | Type of conversation |
| `messages` | jsonb | Message history |
| `context` | jsonb | Conversation context |
| `status` | text | active/archived |
| `created_at` | timestamptz | Start timestamp |
| `updated_at` | timestamptz | Last message timestamp |

---

### `viva_conversations` ✅ **ACTIVE**
**Purpose:** Master VIVA assistant conversations

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `messages` | jsonb | Full conversation history |
| `created_at` | timestamptz | Start timestamp |
| `updated_at` | timestamptz | Last message timestamp |

---

### `prompt_suggestions_cache` ✅ **ACTIVE**
**Purpose:** Cached AI-generated prompts

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `category` | text | Life category |
| `suggestions` | jsonb | Suggested prompts |
| `encouragement` | text | Encouraging message |
| `profile_hash` | text | Hash of profile data used |
| `created_at` | timestamptz | Creation timestamp |
| `expires_at` | timestamptz | Expiration timestamp |

---

### `generated_images` ✅ **ACTIVE**
**Purpose:** AI-generated images (DALL-E, etc.)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `prompt` | text | Generation prompt |
| `image_url` | text | Generated image URL |
| `storage_path` | text | Storage location |
| `model_used` | text | AI model |
| `status` | text | Generation status |
| `error_message` | text | Error details |
| `created_at` | timestamptz | Timestamp |

---

## 📁 Media & Assets

### `media_metadata` ✅ **ACTIVE**
**Purpose:** Centralized media file tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `bucket` | text | Supabase storage bucket |
| `storage_path` | text | Full storage path |
| `public_url` | text | Public URL |
| `file_name` | text | Original filename |
| `file_type` | text | File extension |
| `file_size` | bigint | Size in bytes |
| `mime_type` | text | MIME type |
| `folder` | text | Folder/category |
| `category` | text | Content category |
| `tags` | text[] | Search tags |
| `title` | text | Display title |
| `description` | text | Description |
| `created_at` | timestamptz | Upload timestamp |

---

### `audio_sets` ✅ **ACTIVE**
**Purpose:** Collections of audio tracks

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `title` | text | Set title |
| `description` | text | Set description |
| `cover_image_url` | text | Cover image |
| `is_active` | boolean | Active status |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |

---

### `audio_tracks` ✅ **ACTIVE**
**Purpose:** Individual audio files

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `audio_set_id` | uuid | Foreign key to audio_sets |
| `user_id` | uuid | Foreign key to auth.users |
| `title` | text | Track title |
| `description` | text | Track description |
| `duration` | text | Duration string |
| `audio_url` | text | Audio file URL |
| `transcript` | text | Audio transcript |
| `order_index` | integer | Position in set |
| `is_active` | boolean | Active status |
| `created_at` | timestamptz | Creation timestamp |

---

### `audio_variants` ✅ **ACTIVE**
**Purpose:** Different versions of audio tracks

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `audio_track_id` | uuid | Foreign key to audio_tracks |
| `variant_type` | text | Variant type (voice, speed, etc.) |
| `audio_url` | text | Variant audio URL |
| `created_at` | timestamptz | Creation timestamp |

---

### `vision_audios` ✅ **ACTIVE**
**Purpose:** Generated vision audio files

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `vision_id` | uuid | Foreign key to vision_versions |
| `user_id` | uuid | Foreign key to auth.users |
| `audio_url` | text | Audio file URL |
| `duration` | text | Duration string |
| `voice_type` | text | Voice used |
| `background_music` | text | Music track |
| `generation_status` | text | Status |
| `error_message` | text | Error details |
| `created_at` | timestamptz | Creation timestamp |

---

### `vision_board_items` ✅ **ACTIVE**
**Purpose:** Items on user vision boards

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `vision_id` | uuid | Associated vision |
| `item_type` | text | Type: image, text, quote |
| `content` | text | Item content |
| `image_url` | text | Image URL |
| `position_x` | numeric | X position on canvas |
| `position_y` | numeric | Y position on canvas |
| `created_at` | timestamptz | Creation timestamp |

---

## 📝 Journaling & Tracking

### `journal_entries` ✅ **ACTIVE**
**Purpose:** Daily journal entries

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `entry_date` | date | Entry date |
| `content` | text | Journal content |
| `mood` | text | Mood indicator |
| `tags` | text[] | Entry tags |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |

---

### `daily_papers` ✅ **ACTIVE**
**Purpose:** Daily paper exercises

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `paper_date` | date | Paper date |
| `content` | jsonb | Paper content |
| `completed` | boolean | Completion status |
| `created_at` | timestamptz | Creation timestamp |

---

### `emotional_snapshots` ✅ **ACTIVE**
**Purpose:** Emotional state tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `snapshot_date` | timestamptz | Snapshot timestamp |
| `emotion_type` | text | Emotion category |
| `intensity` | integer | Intensity (1-10) |
| `notes` | text | Context notes |
| `created_at` | timestamptz | Creation timestamp |

---

### `vibrational_events` ✅ **ACTIVE**
**Purpose:** Tracked vibrational moments

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `event_date` | timestamptz | Event timestamp |
| `event_type` | text | Event category |
| `description` | text | Event description |
| `vibration_level` | integer | Vibration score (1-10) |
| `created_at` | timestamptz | Creation timestamp |

---

## 🗑️ Legacy/Deprecated Tables

### `refinements_backup_20251111` ⚠️ **BACKUP**
**Purpose:** Backup of refinements table before cleanup

### `vision_versions_backup_20251111` ⚠️ **BACKUP**
**Purpose:** Backup of vision_versions table before cleanup

### `actualization_blueprints` ⚠️ **BROKEN**
**Purpose:** Gap analysis tool (broken - deprecated API removed)
**Status:** Not functional, needs rebuild

---

## 📈 Other Active Tables

### `user_stats` ✅ **ACTIVE**
**Purpose:** Aggregated user statistics

### `token_drips` ✅ **ACTIVE**
**Purpose:** Scheduled token grants (monthly drips)

### `member_profiles` ✅ **ACTIVE**
**Purpose:** Membership-level profiles

### `membership_tiers` ✅ **ACTIVE**
**Purpose:** Membership tier definitions

### `intensive_purchases` ✅ **ACTIVE**
**Purpose:** Special program purchases

### `intensive_checklist` ✅ **ACTIVE**
**Purpose:** Program checklist items

### `abundance_events` ✅ **ACTIVE**
**Purpose:** Abundance tracking events

### `conversation_sessions` ✅ **ACTIVE**
**Purpose:** General conversation tracking

### `blueprint_insights` ✅ **ACTIVE**
**Purpose:** Blueprint-related insights

### `blueprint_phases` ✅ **ACTIVE**
**Purpose:** Blueprint phase tracking

### `blueprint_tasks` ✅ **ACTIVE**
**Purpose:** Blueprint task management

### `video_mapping` ✅ **ACTIVE**
**Purpose:** Video content mapping

### `vibrational_event_sources` ✅ **ACTIVE**
**Purpose:** Sources for vibrational events

### `vibrational_links` ✅ **ACTIVE**
**Purpose:** Connections between vibrational elements

### `vision_conversations` ✅ **ACTIVE**
**Purpose:** Vision-related conversations

### `vision_progress` ✅ **ACTIVE**
**Purpose:** Vision completion tracking

### `profile_versions` ✅ **ACTIVE**
**Purpose:** Profile version history

### `ai_action_token_overrides` ✅ **ACTIVE**
**Purpose:** Custom token cost overrides

---

## 🔍 Key Schema Facts

### Life Vision V3 Architecture
- **Primary Table:** `life_vision_category_state` (per-category data)
- **Master Assembly:** `vision_versions` (complete visions)
- **Supporting:** `scenes`, `frequency_flip`, `prompt_suggestions_cache`
- **Deprecated:** `refinements` (data migrated to V3)

### Token System
- **Source of Truth:** `token_transactions` (sum all amounts = balance)
- **Usage Tracking:** `token_usage` (historical AI usage)
- **Payments:** `payment_history`, `customer_subscriptions`

### User Profile System
- **Main:** `user_profiles` (extended data)
- **Voice:** `voice_profiles` (AI personalization)
- **Auth:** `profiles` (Supabase default)

### Database Cleanup Status
- ✅ **Cleaned 2025-11-11:**
  - `vision_versions` (removed 7 deprecated columns)
  - `refinements` (removed 16 deprecated columns)
- ✅ **Backups Created:** `*_backup_20251111` tables
- ✅ **V3 Tables Created:** `life_vision_category_state`

---

## 📖 Usage Notes

### For AI Agents
1. **ALWAYS reference this file** for current schema state
2. **DO NOT rely on old migration files** - they may be outdated
3. **Check table comments** for purpose and status
4. **Verify column existence** before writing queries

### For Developers
1. **Source of Truth:** This file reflects production state
2. **After migrations:** Regenerate this file
3. **Before schema changes:** Check this file first
4. **Deprecating columns:** Add to "Legacy" section with date

---

**Last Schema Dump:** `docs/COMPLETE_SCHEMA_DUMP.sql` (7,377 lines)  
**Generated:** November 12, 2025

