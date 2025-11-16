# Active vs Legacy Tables Analysis

**Generated:** November 16, 2025
**Source:** Code analysis of `src/` directory

---

## 📊 Summary

| Category | Count |
|----------|-------|
| **Total Tables in DB** | 55 |
| **Actively Used** | 60 (includes views/functions) |
| **Legacy/Unused** | 14 |

---

## ✅ ACTIVELY USED TABLES (Referenced in Code)

### 🔥 Most Used (10+ references)

| Table | References | Primary Use |
|-------|------------|-------------|
| `user_profiles` | 107 | Extended user information, profile management |
| `vision_versions` | 82 | Life vision system (main feature) |
| `intensive_checklist` | 25 | Intensive program tracking |
| `assessment_results` | 24 | User assessments & insights |
| `intensive_purchases` | 20 | Purchase tracking |
| `journal_entries` | 17 | Voice journal feature |
| `life_vision_category_state` | 15 | Vision refinement tracking |
| `audio_tracks` | 15 | Audio library |
| `vision_board_items` | 14 | Vision board feature |
| `voice_profiles` | 12 | Voice analysis |
| `household_members` | 12 | Household account members |
| `audio_sets` | 12 | Audio collections |
| `customer_subscriptions` | 11 | Stripe subscriptions |

### 📍 Moderately Used (5-10 references)

| Table | References | Primary Use |
|-------|------------|-------------|
| `scenes` | 10 | Audio/visual scenes |
| `household_invitations` | 10 | Household invite system |
| `conversation_sessions` | 10 | AI conversation tracking |
| `households` | 9 | Household account definitions |
| `ai_conversations` | 9 | AI chat history |
| `token_usage` | 8 | Token consumption tracking |
| `assessment_responses` | 8 | Assessment answer storage |
| `time_slots` | 7 | Scheduling system |
| `intensive_time_slots` | 7 | Intensive program scheduling |
| `viva_conversations` | 6 | VIVA AI conversations |
| `life_visions` | 6 | Life vision data |
| `audio_variants` | 6 | Audio variations |
| `ai_action_token_overrides` | 6 | Custom token costs |
| `schedules` | 5 | Schedule definitions |
| `intensive_schedules` | 5 | Intensive schedules |

### 💡 Occasionally Used (2-4 references)

| Table | References | Primary Use |
|-------|------------|-------------|
| `vibrational_events` | 4 | Event tracking |
| `vibrational_event_sources` | 4 | Event source definitions |
| `user_referrals` | 4 | Referral program |
| `token_transactions` | 4 | Token grants/deductions |
| `membership_tiers` | 4 | Subscription tier definitions |
| `journal` | 4 | Journal (alternative reference) |
| `intensive_calibration` | 4 | Intensive program config |
| `generated_images` | 4 | AI-generated images |
| `emotional_snapshots` | 4 | Mood tracking |
| `activation_protocols` | 4 | Protocol definitions |
| `vision_progress` | 3 | Vision completion tracking |
| `household_token_summary` | 3 | Household token view |
| `frequency_flip` | 3 | Frequency tracking |
| `daily_activities` | 3 | Daily activity tracking |
| `ai_model_pricing` | 3 | AI pricing configs |
| `referral_clicks` | 2 | Referral tracking |
| `profile_versions` | 2 | Profile history |
| `payment_history` | 2 | Payment records |
| `ideal_state_prompts` | 2 | AI prompt templates |
| `daily_papers` | 2 | Daily planning feature |
| `assessments` | 2 | Assessment definitions |
| `actualization_blueprints` | 2 | Blueprint system |

### 🔹 Rarely Used (1 reference)

| Table | Primary Use |
|-------|-------------|
| `visualization_scenes` | Visualization content |
| `vision_content` | Vision text content |
| `vision_boards` | Vision board data |
| `vibrational_links` | Event linking |
| `user_storage` | User file storage |
| `referral_rewards` | Referral rewards |
| `profiles` | Basic profile info |
| `auth.users` | Supabase auth (external) |
| `assessment_insights` | AI-generated insights |
| `abundance_events` | Abundance tracking |

---

## ❌ LEGACY/UNUSED TABLES (Not Referenced in Code)

### 🗄️ Tables in Database but NOT Used:

| Table | Likely Purpose | Action? |
|-------|---------------|---------|
| `ai_usage_logs` | Historical AI usage tracking | ⚠️ May be for admin/analytics only |
| `blueprint_insights` | Blueprint AI insights | 🔴 Consider removing if unused |
| `blueprint_phases` | Blueprint phase system | 🔴 Consider removing if unused |
| `blueprint_tasks` | Blueprint task system | 🔴 Consider removing if unused |
| `media_metadata` | Media file metadata | ⚠️ May be for backend/storage |
| `member_profiles` | Household member profiles | 🟡 Check if replaced by `user_profiles` |
| `prompt_suggestions_cache` | Cached AI prompts | ⚠️ May be for performance |
| `refinements` | Vision refinements | 🟡 May be legacy - check migration |
| `refinements_backup_20251111` | Backup table | 🔴 Safe to remove (backup) |
| `user_stats` | User statistics | ⚠️ May be for admin dashboard |
| `video_mapping` | Video asset mapping | 🟡 Check if video system is active |
| `vision_audios` | Vision audio files | 🟡 May be replaced by `audio_tracks` |
| `vision_conversations` | Vision-specific chats | 🟡 May be replaced by `viva_conversations` |
| `vision_versions_backup_20251111` | Backup table | 🔴 Safe to remove (backup) |

---

## 🎯 Recommendations

### Immediate Actions:

1. **Remove Backup Tables** (Safe)
   - `refinements_backup_20251111`
   - `vision_versions_backup_20251111`
   - These are November 11 backups - no longer needed

2. **Verify These Are Truly Unused:**
   - `ai_usage_logs` - May be used by admin routes
   - `media_metadata` - May be used by storage backend
   - `user_stats` - May be used by analytics

3. **Investigate Duplicates:**
   - `refinements` vs `life_vision_category_state`
   - `vision_audios` vs `audio_tracks`
   - `vision_conversations` vs `viva_conversations`
   - `member_profiles` vs `user_profiles` (household context)

### Blueprint System Status:

The blueprint tables appear completely unused:
- `blueprint_insights` ❌
- `blueprint_phases` ❌
- `blueprint_tasks` ❌

But `actualization_blueprints` IS used (2 references). This suggests the blueprint system may have been refactored/simplified.

---

## 🔍 How to Verify Before Removing

### Check Admin Routes:

```bash
# Search for table usage in admin routes
grep -r "table_name" src/app/admin/ --include="*.ts" --include="*.tsx"
```

### Check API Routes:

```bash
# Search for table usage in API
grep -r "table_name" src/app/api/ --include="*.ts"
```

### Check Server Components:

```bash
# Some tables may only be used server-side
grep -r "table_name" src/lib/ --include="*.ts"
```

---

## 📋 Safe Cleanup Script

```sql
-- BACKUP FIRST!
-- Run these only after verifying the tables are truly unused

-- Remove backup tables (definitely safe)
DROP TABLE IF EXISTS refinements_backup_20251111;
DROP TABLE IF EXISTS vision_versions_backup_20251111;

-- Consider for removal (verify first!)
-- DROP TABLE IF EXISTS blueprint_insights;
-- DROP TABLE IF EXISTS blueprint_phases;
-- DROP TABLE IF EXISTS blueprint_tasks;
-- DROP TABLE IF EXISTS vision_audios;
-- DROP TABLE IF EXISTS vision_conversations;
```

---

## 🔄 Next Steps

1. **Verify unused tables** in admin panel / analytics
2. **Check git history** to see when they were last actively developed
3. **Create migration** to remove confirmed legacy tables
4. **Test thoroughly** before pushing to production
5. **Keep backups** just in case

---

**Note:** This analysis is based on direct `.from('table')` references. Some tables may be:
- Used only in admin panels
- Used in SQL functions/triggers
- Used by external services
- Reserved for future features

Always verify before removing!

