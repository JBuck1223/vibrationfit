# Old Vision Generation Files - Archive Documentation

## Overview

The old vision generation system has been replaced by the new `/life-vision/new` flow that uses VIVA's AI-powered creation process. This document identifies which files are no longer needed and can be archived or deleted.

## Still Active (Keep These)

### API Routes
- **`/api/vision`** (GET/POST route.ts) - ✅ ACTIVE
  - Used by: `/life-vision/[id]/page.tsx` (line 390)
  - Purpose: CRUD operations for vision_versions
  - Status: Core functionality, keep

### Pages
- **`/life-vision/create-with-viva`** - ✅ ACTIVE but deprecated
  - Uses: `VisionBuilder.tsx` component
  - Calls: `/api/viva/vision/generate`
  - Status: Old interface, still functional but users should use `/life-vision/new`
  - Action: Consider deprecation notice or redirect

## Outdated (Can Be Archived)

### API Routes

1. **`/api/vision/generate`** (route.ts) - ❌ OUTDATED
   - Old vision generation from conversations
   - Replaced by: `/api/viva/master-vision`, `/api/viva/category-summary`
   - Status: Not referenced anywhere
   - **Action: ARCHIVE or DELETE**

2. **`/api/vision/chat`** (route.ts) - ❌ OUTDATED
   - Old discovery path chat handler
   - Included: `discovery-templates.ts`
   - Replaced by: `/api/viva/chat`
   - Status: Not referenced anywhere
   - **Action: ARCHIVE or DELETE**

3. **`/api/vision/conversation`** (route.ts) - ❌ OUTDATED
   - Old conversation save/retrieve logic
   - Used old `vision_conversations` table
   - Replaced by: `/api/viva/conversations` with sessions
   - Status: Not referenced anywhere
   - **Action: ARCHIVE or DELETE**

4. **`/api/vision/progress`** (route.ts) - ❌ OUTDATED
   - Old vision progress tracking
   - Used old `vision_progress` table
   - Replaced by: Check `completion_percent` in `vision_versions`
   - Status: Not referenced anywhere
   - **Action: ARCHIVE or DELETE**

### Components

5. **`VisionBuilder.tsx`** - ⚠️ USED BUT DEPRECATED
   - Used by: `/life-vision/create-with-viva/page.tsx`
   - Old conversational vision builder
   - Replaced by: `/life-vision/new` with VIVA chat
   - Status: Still functional but deprecated
   - **Action: Keep for now, add deprecation notice**

### API Routes (Duplicate)
6. **`/api/viva/vision/generate`** - ❌ DUPLICATE
   - Zod-based vision generation using vision-composer
   - Used by: `VisionBuilder.tsx`
   - Note: Different from `/api/viva/vision-generate`
   - **Action: Can archive if removing VisionBuilder**

7. **`/api/viva/vision-generate`** - ✅ ACTIVE
   - Full action-based vision generation
   - Includes: analyze, start_conversation, continue_conversation, generate_vision
   - Uses: ConversationManager, vision-composer, profile-analyzer
   - Status: Used by modern VIVA system
   - **Action: KEEP**

## New System Flow

### Current Production Path
```
User → /life-vision/new
     ↓
Category Input Pages (/life-vision/new/category/[key])
  - Uses: /api/viva/prompt-suggestions (for prompts)
  - Uses: /api/viva/category-summary (for summaries)
  - Saves to: refinements table
     ↓
Assembly Page (/life-vision/new/assembly)
  - Uses: /api/viva/master-vision (for final document)
  - Saves to: vision_versions table
     ↓
View Vision (/life-vision/[id])
  - Uses: /api/vision (for CRUD operations)
```

### Old Deprecated Path
```
User → /life-vision/create-with-viva
     ↓
VisionBuilder component
  - Uses: /api/viva/vision/generate
  - Old chatbot-style interface
  - Direct category-by-category writing
```

## Database Tables

### Still Active
- `vision_versions` - Main vision storage ✅
- `refinements` - Vision generation history ✅
- `viva_conversations` - New conversation sessions ✅
- `user_profiles` - Profile data ✅
- `assessment_results` - Assessment data ✅

### Potentially Deprecated (Check First!)
- `vision_conversations` - Old conversation storage ⚠️
- `vision_progress` - Old progress tracking ⚠️

**Before deleting these tables, check:**
- Are there any existing records?
- Do any migrations reference them?
- Are they used for reporting/analytics?

## Archive Instructions

### Option 1: Git Archive Branch
```bash
# Create archive branch
git checkout -b archive/old-vision-generation

# Keep only the outdated files
# (keep current changes on main branch)

# Or create an archive directory
mkdir -p archived-code/old-vision-generation
# Move old files there
```

### Option 2: Delete with Confidence
Since these files have no references:

```bash
# Archive old API routes
rm -rf src/app/api/vision/generate
rm -rf src/app/api/vision/chat
rm -rf src/app/api/vision/conversation  
rm -rf src/app/api/vision/progress

# If removing VisionBuilder too:
rm src/components/VisionBuilder.tsx
rm src/app/life-vision/create-with-viva/page.tsx
rm -rf src/app/api/viva/vision/generate

# Update navigation files to remove old links
```

### Files to Update After Removal
- `src/components/Footer.tsx` - Remove `/life-vision/create-with-viva` link
- `src/app/sitemap/page.tsx` - Remove deprecated page
- `src/lib/navigation/menu-definitions.ts` - Remove menu item
- `SITEMAP.md` - Update documentation

## Safety Checklist

- [ ] No search results found for old endpoints
- [ ] No broken imports after removal
- [ ] No references in database queries
- [ ] Production environment checked
- [ ] Navigation menus updated
- [ ] Documentation updated
- [ ] Git history preserved (don't use `git filter-branch`)

## Migration Notes

### If Users Have Old Data
- Visions created with old system stored in `vision_versions` - this is fine
- Old conversations in `vision_conversations` can be ignored
- Old progress in `vision_progress` can be ignored
- Current system reads from `vision_versions` directly

## Questions to Ask User

1. **Do you want to keep `/life-vision/create-with-viva` as an alternative interface?**
   - If yes: Keep it, add deprecation notice
   - If no: Remove and redirect to `/life-vision/new`

2. **Should we clean up the database tables?**
   - `vision_conversations` - likely safe to drop
   - `vision_progress` - likely safe to drop

3. **Do you want to preserve these files for historical reference?**
   - Archive in separate branch
   - Or delete cleanly

