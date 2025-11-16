# Production Schema Reference (Read-Only)

**Last Updated:** November 16, 2025 (8:22 AM)
**Source:** Production database (current working state)
**Note:** Some tables may be empty - prioritizing code/schema over historical data

⚠️ **This is documentation ONLY. Do NOT use this to make changes to production.**

---

## 📊 Database Overview

### Connection Info
- **Project:** vibrationfit
- **Project Ref:** nxjhqibnlbwzzphewncj
- **Region:** us-east-2
- **Database Version:** PostgreSQL 17.6

### Table Count
Production contains 55 tables with 938 columns across various features.

### Current State (Nov 16, 2025)
- ✅ Schema structure: Complete (55 tables, 70 functions)
- ✅ Column definitions: Fully documented (942 lines)
- ⚠️ Row data: Some tables empty (work preserved over historical data)
- ✅ Core functionality: Token system, journal, membership tiers

---

## 📋 Core Tables (Current State)

| Table | Rows | Purpose | Status |
|-------|------|---------|--------|
| `token_usage` | 273 | AI token tracking | ✅ Has data |
| `user_profiles` | 2 | Extended user data | ✅ Has data |
| `journal_entries` | 1 | Voice journal entries | ✅ Has data |
| `vision_versions` | 0 | Life vision iterations | ⚠️ Empty |
| `audio_tracks` | 0 | Audio content library | ⚠️ Empty |
| `profiles` | 0 | Basic user profiles | ⚠️ Empty |
| `refinements` | 0 | Vision refinements | ⚠️ Empty |
| `actualization_blueprints` | 0 | Action plans | ⚠️ Empty |

**Note:** Schema structure is complete. Empty tables can be populated as needed. Your code and recent work are preserved.

---

## 🗂️ Table Categories

### User & Profile Management
- `profiles` - Core user profiles linked to auth
- `user_profiles` - Extended profile information
- `profile_versions` - Profile history/versions
- `member_profiles` - Household member profiles
- `user_stats` - User statistics and metrics
- `user_storage` - User file storage tracking

### Life Vision System
- `vision_versions` - User life visions
- `vision_progress` - Vision completion tracking
- `vision_conversations` - AI conversations about visions
- `vision_board_items` - Vision board elements
- `vision_audios` - Generated audio for visions
- `life_vision_category_state` - Category refinement state
- `refinements` - Vision refinements/iterations

### Actualization & Blueprints
- `actualization_blueprints` - Action plans
- `blueprint_phases` - Blueprint stages
- `blueprint_tasks` - Individual tasks
- `blueprint_insights` - AI-generated insights

### Assessment System
- `assessment_responses` - User responses
- `assessment_results` - Assessment scores
- `assessment_insights` - AI analysis

### Audio System
- `audio_sets` - Audio collections
- `audio_tracks` - Individual tracks
- `audio_variants` - Different versions
- `scenes` - Audio scenes

### AI & Conversation
- `ai_conversations` - General AI chats
- `viva_conversations` - VIVA AI conversations
- `conversation_sessions` - Session tracking
- `ai_usage_logs` - AI usage tracking
- `ai_model_pricing` - Model cost configs
- `ai_action_token_overrides` - Custom token costs

### Token & Billing System
- `token_usage` - Token consumption tracking
- `token_transactions` - Token grants/deductions
- `membership_tiers` - Subscription tier definitions
- `payment_history` - Payment records
- `intensive_purchases` - One-time purchase tracking

### Household Accounts
- `households` - Household definitions
- `household_members` - Members in households
- `household_invitations` - Pending invites

### Journal & Daily
- `journal_entries` - Voice journal entries
- `daily_papers` - Daily planning entries
- `emotional_snapshots` - Mood tracking

### Vibrational System
- `vibrational_events` - Event tracking
- `vibrational_links` - Event connections
- `vibrational_event_sources` - Event sources
- `abundance_events` - Abundance tracking
- `frequency_flip` - Frequency shift tracking

### Media & Assets
- `generated_images` - AI images
- `video_mapping` - Video assets
- `media_metadata` - Media file info

### System & Utility
- `prompt_suggestions_cache` - Cached AI prompts
- `intensive_checklist` - Intensive program checklist

---

## 🔑 Key Relationships

### User → Everything
```
auth.users (Supabase Auth)
  ↓
profiles (user_id)
  ↓
├─ user_profiles
├─ vision_versions
├─ journal_entries
├─ assessment_responses
├─ token_usage
└─ [most other tables]
```

### Households
```
households
  ↓
household_members
  ├─ profiles (user_id)
  └─ member_profiles (profile_id)
```

### Vision System
```
vision_versions
  ↓
├─ refinements
├─ vision_conversations
├─ vision_progress
├─ life_vision_category_state
└─ vision_audios
```

### Token System
```
membership_tiers
  ↓
token_transactions (grants)
  ↓
token_usage (consumption)
```

---

## 📁 Detailed Schema

**See:** `supabase/CURRENT_SCHEMA_COLUMNS.txt` for complete column listing

---

## 🔒 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies like:
- "Users can manage their own [resource]"
- "Users can view household [resource]"
- "Service role has full access"

### Database Roles
- `postgres` - Superuser (production only)
- `authenticator` - Connection role
- `anon` - Unauthenticated users
- `authenticated` - Logged-in users
- `service_role` - Backend services
- `cursor_reader` - Read-only access (for this tool)

---

## 🎯 Common Queries for Agents

### Get User's Vision
```sql
SELECT * FROM vision_versions 
WHERE user_id = '[user_uuid]' 
  AND is_active = true;
```

### Get User's Token Balance
```sql
SELECT get_user_token_balance('[user_uuid]');
```

### Get User's Current Tier
```sql
SELECT get_user_tier('[user_uuid]');
```

### Check User's Audio Library
```sql
SELECT * FROM audio_tracks 
WHERE user_id = '[user_uuid]'
ORDER BY created_at DESC;
```

---

## 📊 Schema Stats

```
Total Tables: 50+
Total Functions: 80+
Total Triggers: 20+
Total Indexes: 100+
Total Policies (RLS): 100+
```

---

## ⚠️ Important Notes

### DO NOT:
- ❌ Run migrations from Cursor
- ❌ Use `supabase db push` 
- ❌ Use `supabase db reset` with production URL
- ❌ Modify production data directly
- ❌ Share production credentials

### DO:
- ✅ Use this doc for understanding schema
- ✅ Query read-only when needed
- ✅ Test changes on local database first
- ✅ Use Supabase Dashboard for viewing data
- ✅ Ask before making any changes

---

## 🔄 Keeping This Updated

To refresh this reference (safe operation):

```bash
# Get updated column info
psql "CONNECTION_STRING" -c "
SELECT table_name, column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position
" > supabase/CURRENT_SCHEMA_COLUMNS.txt
```

**Note:** This is READ-ONLY and safe to run anytime.

---

## 📞 Questions?

- Check: `docs/SUPABASE_COMMANDS_SIMPLE_GUIDE.md`
- Reference: `docs/HOLY_GRAIL_SUPABASE_CONNECTION.md`
- Schema details: `supabase/CURRENT_SCHEMA_COLUMNS.txt`

---

**Last Verified:** November 16, 2025 at 8:22 AM
**Status:** ✅ Schema complete and documented - work preserved over historical data
**Schema Files:**
- `supabase/COMPLETE_SCHEMA_DUMP.sql` (278KB) - Full structure
- `supabase/CURRENT_SCHEMA_COLUMNS.txt` (942 lines) - All columns

