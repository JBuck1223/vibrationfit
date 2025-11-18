# Documentation Cleanup Plan

**Created:** November 18, 2025  
**Status:** Ready for Execution

## Problem

The codebase has **500+ markdown files**, many created by AI agents during development that are now:
- ❌ Outdated (system has moved on)
- ❌ Duplicated (same info in multiple places)
- ❌ Misplaced (root folder instead of docs/)
- ❌ Abandoned (feature was changed/removed)
- ❌ Redundant (status docs that say "COMPLETE" from months ago)

## Categories of Docs

### 1. ROOT FOLDER DOCS (Should be in docs/ or deleted)
```
./AWS_MEDIACONVERT_SITE_ASSETS_SETUP.md
./DATEPICKER_SELECT_IMPROVEMENTS.md
./INTENSIVE_MVP_READY.md
./RECONCILIATION_SUMMARY.md
./SELECT_DATEPICKER_COMPLETE.md
./SUPABASE_CLI_QUICK_REFERENCE.md
./TEST_RECONCILIATION.md
./UPLOAD_FIX_SUMMARY.md
./VIDEO_FIXES_2024-11-10.md
./VIDEO_MARKETING_TRACKING_GUIDE.md
./VIDEO_OPTIMIZATION_IMPLEMENTATION_COMPLETE.md
./VIDEO_PLAYBACK_OPTIMIZATION_GUIDE.md
./WEBM_RECORDING_OPTIMIZATION.md
```

**Action:** Move to appropriate docs/ subfolders or DELETE if outdated

### 2. DUPLICATE ORGANIZATION (guides/ vs docs/)
We have TWO top-level doc folders with overlapping content:
- `/docs/` - Current primary location
- `/guides/` - Legacy location with duplicates

**Duplicates Found:**
- `guides/AWS_MEDIACONVERT_SITE_ASSETS_SETUP_2024-11-10.md` + `docs/video-system/AWS_MEDIACONVERT_SETUP.md`
- `guides/VIDEO_*` + `docs/video-system/VIDEO_*`
- `guides/RECORDING_*` + `docs/features/AUDIO_*`
- Many more...

**Action:** Consolidate into `/docs/`, delete `/guides/`

### 3. OUTDATED "COMPLETE" STATUS DOCS
Docs with "COMPLETE", "SUCCESS", "STATUS" in the name from old features:
```
./docs/architecture/CENTRALIZED_CONFIG_COMPLETE.md
./docs/architecture/CHECKOUT_FLOW_COMPLETE.md
./docs/architecture/NEW_USER_FLOW_IMPLEMENTATION_COMPLETE.md
./docs/database/DATABASE_CLEANUP_COMPLETE.md
./docs/database/MIGRATION_COMPLETE.md
./docs/features/AUDIO_EDITOR_COMPLETE.md
./docs/layouts/LAYOUT_UNIFICATION_COMPLETE.md
./docs/life-vision-v3/FRONTEND_BUILD_SUCCESS.md
./docs/life-vision-v3/LIFE_VISION_V3_BUILD_COMPLETE.md
./docs/life-vision-v3/LIFE_VISION_V3_COMPLETE.md
./docs/life-vision-v3/REFINEMENTS_CLEANUP_COMPLETE.md
./docs/life-vision-v3/STATUS_FIELD_REMOVAL_COMPLETE.md
./docs/viva/VIVA_RESTRUCTURE_COMPLETE.md
./docs/viva/VIVA_RESTRUCTURE_COMPLETE_ALL_PHASES.md
./docs/viva/VIVA_VISION_GENERATION_COMPLETE.md
```

**Action:** ARCHIVE or DELETE (feature is done, doc no longer needed)

### 4. REDUNDANT/OVERLAPPING GUIDES
Multiple docs covering the same topic:
- **Database Schema:** 5+ different docs
- **Token System:** 15+ docs
- **VIVA System:** 10+ docs
- **Video Processing:** 8+ docs
- **Supabase CLI:** 4+ docs

**Action:** Consolidate into ONE current doc per topic, archive old versions

### 5. NODE_MODULES README FILES (Not our docs)
```
./lambda-video-processor/node_modules/**/*.md (300+ files)
./scripts/archive/functions/audio-mixer/node_modules/**/*.md (200+ files)
```

**Action:** IGNORE (these are dependency docs, not ours)

### 6. TEMP FOLDER DOCS
```
./temp/intensive-mode-trigger.md
./temp/intensive-mvp-complete.md
./temp/intensive-single-source-of-truth.md
```

**Action:** DELETE (temp folder should be gitignored anyway)

---

## Cleanup Strategy

### Phase 1: Quick Wins (Delete Obviously Outdated)
1. ✅ Delete all docs in `/temp/`
2. ✅ Delete root-level "COMPLETE" and "SUCCESS" docs
3. ✅ Delete docs with old dates in filename (2024-11-10, etc.)
4. ✅ Move `/temp/` to `.gitignore` if not already

### Phase 2: Consolidate Duplicate Locations
1. ✅ Merge `/guides/` into `/docs/` (keep only current versions)
2. ✅ Delete duplicate files after merge
3. ✅ Update any internal links

### Phase 3: Archive Old Status Docs
1. ✅ Move "COMPLETE"/"STATUS" docs to `/docs/archived/old-status-docs/`
2. ✅ Add README explaining these are historical

### Phase 4: Consolidate by Topic
1. ✅ **Token System:** Keep 1-2 essential docs, archive rest
2. ✅ **VIVA System:** Keep current expert guide, archive old restructure docs
3. ✅ **Life Vision:** Keep current implementation guide, archive v3 build docs
4. ✅ **Database:** Keep schema reference + migration guide, archive others

### Phase 5: Create Documentation Index
1. ✅ Update `/docs/README.md` with current structure
2. ✅ Create topic-based navigation
3. ✅ Link to archived docs if needed for history

---

## New Documentation Rules

### For AI Agents (Add to `.cursorrules`):

```markdown
## Documentation Guidelines

### When to Create Docs
- ✅ System architecture changes
- ✅ New feature implementation guides
- ✅ API endpoint documentation
- ❌ Status updates ("COMPLETE", "SUCCESS")
- ❌ Temporary build notes
- ❌ Duplicate information

### Where to Put Docs
- **Architecture:** `/docs/architecture/`
- **Features:** `/docs/features/`
- **Database:** `/docs/database/` or `/supabase/`
- **API Guides:** `/docs/api/`
- **System Guides:** `/docs/viva/`, `/docs/token-system/`, etc.
- **Technical Decisions:** `/docs/technical/`

### Doc Naming
- Use descriptive names: `TOKEN_SYSTEM_ARCHITECTURE.md` ✅
- Not status names: `TOKEN_COMPLETE.md` ❌
- Not dates unless archived: `VIDEO_FIXES_2024-11-10.md` ❌

### When to Archive
- Feature completely replaced
- Doc is outdated but has historical value
- Move to `/docs/archived/[topic]/`

### When to Delete
- Temp status updates
- Duplicate information
- Incorrect/misleading information
- No historical value
```

---

## Recommended Final Structure

```
docs/
├── README.md                           ← Navigation index
│
├── architecture/                       ← System design
│   ├── MASTER_SITE_ARCHITECTURE.md
│   ├── HOUSEHOLD_ACCOUNTS.md
│   ├── TOKEN_SYSTEM.md
│   └── PROFILE_SYSTEM.md
│
├── features/                           ← Feature docs
│   ├── life-vision/
│   │   ├── OVERVIEW.md
│   │   ├── IMPLEMENTATION_GUIDE.md
│   │   └── EXPERT_GUIDE.md
│   ├── viva/
│   │   ├── SYSTEM_OVERVIEW.md
│   │   └── PROMPT_ARCHITECTURE.md
│   └── journal/
│       └── AUDIO_PROCESSING.md
│
├── database/                           ← Database docs
│   ├── SCHEMA_REFERENCE.md
│   └── MIGRATION_GUIDE.md
│
├── deployment/                         ← Deploy guides
│   ├── AWS_SETUP.md
│   ├── SUPABASE_WORKFLOW.md
│   └── VIDEO_PROCESSING.md
│
├── design-system/                      ← UI/UX docs
│   ├── README.md
│   └── COMPONENT_GUIDE.md
│
├── technical/                          ← Technical decisions
│   ├── CATEGORY_KEY_HARDCODING_AUDIT.md
│   └── DOCUMENTATION_CLEANUP_PLAN.md (this file)
│
└── archived/                           ← Historical docs
    ├── 2024-11/
    ├── 2025-01/
    └── README.md
```

---

## Files to Keep (Essential)

### Must Keep
- `PRODUCT_BRIEF.md` - Product vision
- `README.md` - Project readme
- `supabase/CURRENT_SCHEMA.md` - Schema reference
- `supabase/MIGRATION_STRATEGY.md` - Migration workflow
- `docs/technical/CATEGORY_KEY_HARDCODING_AUDIT.md` - Active audit
- `docs/life-vision-v3/LIFE_VISION_NEW_SYSTEM_EXPERT_GUIDE.md` - Current system

### Review Before Deleting
- Anything in `docs/architecture/` (might be current)
- Anything in `src/lib/viva/knowledge/` (used by AI assistant)
- Anything in `.cursorrules` or `rules/` (active rules)

---

## Execution Checklist

- [ ] Phase 1: Delete temp and obviously outdated (5 min)
- [ ] Phase 2: Consolidate guides/ into docs/ (15 min)
- [ ] Phase 3: Archive old status docs (10 min)
- [ ] Phase 4: Consolidate by topic (30 min)
- [ ] Phase 5: Create new README index (15 min)
- [ ] Add doc guidelines to `.cursorrules`
- [ ] Git commit with clear message

**Total Time:** ~1.5 hours

---

## Post-Cleanup Verification

After cleanup, should have:
- ✅ ~50-75 essential docs (down from 500+)
- ✅ Clear folder structure
- ✅ One source of truth per topic
- ✅ Easy to find current information
- ✅ Historical docs preserved in archive/

---

## Prevention for Future

1. **Add to `.cursorrules`:**
   ```
   - NEVER create "COMPLETE" or "STATUS" docs
   - ALWAYS put docs in appropriate docs/ subfolder
   - NEVER put docs in project root
   - UPDATE existing doc instead of creating new version
   ```

2. **Monthly Doc Review:**
   - First Monday of each month
   - Archive anything > 3 months old that's marked "COMPLETE"
   - Update current docs with any changes

3. **Pre-Commit Hook (Optional):**
   - Warn if creating .md file in root
   - Warn if filename contains "COMPLETE", "STATUS", "SUCCESS"

---

Want me to execute this cleanup plan?

