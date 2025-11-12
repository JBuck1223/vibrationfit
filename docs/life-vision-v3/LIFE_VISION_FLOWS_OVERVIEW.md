# Life Vision Flows - Complete Overview

**Last Updated:** November 12, 2025  
**Status:** ✅ Current System Documentation

---

## 📋 Two Distinct Life Vision Flows

VibrationFit has **TWO separate Life Vision flows** for different purposes:

---

## 1️⃣ `/life-vision/new` - Creation Flow

**Purpose:** Create a brand new Life Vision from scratch  
**Expert Guide:** [LIFE_VISION_NEW_SYSTEM_EXPERT_GUIDE.md](./LIFE_VISION_NEW_SYSTEM_EXPERT_GUIDE.md)

### 6-Step User Journey

```
Step 1: /life-vision/new/category/[key]
        → Clarity from Current State (what's working, frequency flip)

Step 2: /life-vision/new/category/[key]/imagination
        → Unleash Imagination (ideal state prompts)

Step 3: /life-vision/new/category/[key]/blueprint
        → Being/Doing/Receiving loops (AI generated, user edits)

Step 4: /life-vision/new/category/[key]/scenes
        → Creative Visualization Scene Builder (1-8 dynamic scenes)

Step 5: /life-vision/new/assembly
        → Master Assembly (combines all categories, shows richness stats)

Step 6: /life-vision/new/final
        → Final Polish (forward/conclusion, perspective selector, activation)
```

### Key Features
- ✅ **12 life categories** (Fun, Health, Travel, Love, Family, Social, Home, Work, Money, Stuff, Giving, Spirituality)
- ✅ **Density-aware** (90-110% input preservation)
- ✅ **Dynamic scenes** (1-8 scenes based on input richness)
- ✅ **4-Layer Conscious Creation Architecture**
- ✅ **Perspective selector** (I/My vs We/Our)
- ✅ **Pre-written bookend templates** (3 woo levels)

### Database Storage
- `life_vision_category_state` - Step-by-step category data
- `vision_versions` - Final assembled vision (status: 'complete')
- `ideal_state_prompts` - Generated ideal state prompts
- `frequency_flip` - Contrast-to-clarity transformations
- `vibration_scenes` - Generated visualization scenes

### Related Documentation
- [01-OVERVIEW.md](./01-OVERVIEW.md) - V3 overview
- [LIFE_VISION_NEW_SYSTEM_EXPERT_GUIDE.md](./LIFE_VISION_NEW_SYSTEM_EXPERT_GUIDE.md) - Complete creation flow
- [conscious_creation_architecture.md](./conscious_creation_architecture.md) - Writing architecture

---

## 2️⃣ `/life-vision/[id]/refine` - Refinement Flow

**Purpose:** Refine and edit an existing Life Vision  
**Expert Guide:** [DRAFT_VISION_EXPERT_GUIDE.md](./DRAFT_VISION_EXPERT_GUIDE.md)

### Refinement Journey

```
/life-vision/[id]/refine
  → Category-by-category refinement
  → VIVA chat for suggestions
  → Visual indicators (yellow borders) for modified categories
  → Draft version management

/life-vision/[id]/refine/draft
  → Review full draft
  → Compare to active version
  → Commit as new version OR discard
```

### Key Features
- ✅ **Draft vision system** (`is_draft=true` in `vision_versions`)
- ✅ **refined_categories tracking** (JSONB array of modified categories)
- ✅ **VIVA chat integration** (conversational refinement)
- ✅ **Visual change indicators** (neon yellow borders)
- ✅ **Atomic commits** (all changes applied at once)
- ✅ **Version history** (keeps previous versions)

### Database Storage
- `vision_versions` - Drafts stored with `is_draft=true`, `is_active=false`
- `refined_categories` (JSONB) - Tracks which categories were modified
- Active versions have `is_draft=false`, `is_active=true`

### Related Documentation
- [DRAFT_VISION_EXPERT_GUIDE.md](./DRAFT_VISION_EXPERT_GUIDE.md) - Draft vision system
- [REFINED_CATEGORIES_TRACKING_GUIDE.md](./REFINED_CATEGORIES_TRACKING_GUIDE.md) - Tracking system
- [DRAFT_VISION_IMPLEMENTATION_SUMMARY.md](./DRAFT_VISION_IMPLEMENTATION_SUMMARY.md) - Implementation

---

## 🔀 How They Work Together

### Complete User Journey

```
1. User creates first vision
   → /life-vision/new (6-step creation flow)
   → Result: Complete vision (status='complete')

2. User wants to update vision months later
   → /life-vision/[id]/refine (refinement flow)
   → Result: New version with tracked changes

3. User creates new vision from scratch
   → /life-vision/new (creation flow again)
   → Result: New separate vision document
```

### Database Relationship

```sql
-- Creation flow saves to:
vision_versions (status='complete', is_draft=false, is_active=true)

-- Refinement flow creates:
vision_versions (status='draft', is_draft=true, is_active=false)
  → On commit: New version (status='complete', is_draft=false, is_active=true)
  → Old version: (is_active=false)
```

---

## 📊 Quick Comparison

| Feature | `/life-vision/new` (Creation) | `/life-vision/[id]/refine` (Refinement) |
|---------|-------------------------------|------------------------------------------|
| **Purpose** | Create from scratch | Edit existing vision |
| **Steps** | 6-step journey | 2-page refinement |
| **VIVA Role** | Guide creation process | Suggest improvements |
| **Scenes** | Generated in Step 4 | Not regenerated |
| **Blueprint** | Being/Doing/Receiving in Step 3 | Edit text directly |
| **Assembly** | Automated (Step 5) | Manual editing |
| **Database** | `life_vision_category_state` | `vision_versions` drafts |
| **Tracking** | Step-by-step state | `refined_categories` JSONB |
| **Result** | New complete vision | Updated version |

---

## 🎯 When to Use Each Flow

### Use `/life-vision/new` (Creation) when:
- ✅ User has never created a Life Vision
- ✅ User wants to start completely fresh
- ✅ User wants step-by-step guidance through all 12 categories
- ✅ User wants AI-generated scenes and blueprints

### Use `/life-vision/[id]/refine` (Refinement) when:
- ✅ User already has a vision and wants to update it
- ✅ User wants to tweak specific categories
- ✅ User wants conversational editing with VIVA
- ✅ User wants to see visual indicators of changes

---

## 🛠️ Technical Architecture

### Shared Components
Both flows use:
- ✅ Same prompt system (`/src/lib/viva/prompts/`)
- ✅ Same AI models configuration
- ✅ Same design system components
- ✅ Same token tracking
- ✅ VIVA persona and golden rules

### Different Components

**Creation Flow** (`/life-vision/new`):
- `life_vision_category_state` table
- Scene generation service
- Blueprint generation API
- Dynamic scene count logic
- Richness metadata tracking

**Refinement Flow** (`/life-vision/[id]/refine`):
- Draft versions in `vision_versions`
- `refined_categories` tracking
- VIVA chat integration
- Category-by-category editing
- Version comparison

---

## 📚 Documentation Index

### Creation Flow Docs
1. [LIFE_VISION_NEW_SYSTEM_EXPERT_GUIDE.md](./LIFE_VISION_NEW_SYSTEM_EXPERT_GUIDE.md) - Complete guide
2. [01-OVERVIEW.md](./01-OVERVIEW.md) - V3 overview
3. [conscious_creation_architecture.md](./conscious_creation_architecture.md) - Writing architecture

### Refinement Flow Docs
1. [DRAFT_VISION_EXPERT_GUIDE.md](./DRAFT_VISION_EXPERT_GUIDE.md) - Draft system guide
2. [REFINED_CATEGORIES_TRACKING_GUIDE.md](./REFINED_CATEGORIES_TRACKING_GUIDE.md) - Tracking
3. [DRAFT_VISION_IMPLEMENTATION_SUMMARY.md](./DRAFT_VISION_IMPLEMENTATION_SUMMARY.md) - Implementation

### Supporting Docs
- [02-BUILD-COMPLETE.md](./02-BUILD-COMPLETE.md) - Build summary
- [06-TESTING-GUIDE.md](./06-TESTING-GUIDE.md) - Testing
- [07-DEPLOYMENT-CHECKLIST.md](./07-DEPLOYMENT-CHECKLIST.md) - Deployment

---

## ✅ Current Status

| Flow | Status | Documentation | Database | Frontend | Backend |
|------|--------|---------------|----------|----------|---------|
| **Creation** | ✅ Complete | ✅ Current | ✅ Deployed | ✅ Built | ✅ Tested |
| **Refinement** | ✅ Complete | ✅ Current | ✅ Deployed | ✅ Built | ✅ Tested |

**Both flows are production-ready and fully documented!** 🎉

---

**Last Updated:** November 12, 2025  
**Maintained By:** Development Team  
**Questions?** See individual expert guides linked above.

