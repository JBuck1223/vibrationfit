# Life Vision Creation Flow

## Overview

The `/life-vision/new` flow guides users through creating their Life Vision document across 12 categories using VIVA's AI assistance.

## Flow Structure

### 1. Landing Page (`/life-vision/new`)
- Introduction to VIVA
- 12 categories overview
- "How It Works" explanation
- Navigates to first category (Fun)

### 2. Category Pages (`/life-vision/new/category/[key]`)
- One page per category (12 total)
- Personalized prompt suggestions from VIVA
- Audio/video recording or text input
- Profile & assessment context display
- AI summary generation
- Progress tracking

### 3. Assembly (`/life-vision/new/assembly`)
- Combines all 12 category summaries
- Generates master Life Vision document
- Saves to `vision_versions` table

## Key Prompts & Processing

### Category Summary Prompt
**Location:** `src/app/api/viva/category-summary/route.ts`
- Generates per-category summaries from user input
- Uses profile and assessment data for context
- Outputs: "What's going well" and "Challenges" format

**AI Config:** `LIFE_VISION_CATEGORY_SUMMARY`
- Default: `gpt-4o` (0.7 temp, 1500 max tokens)
- Admin-configurable at: `/admin/ai-models`

### Master Vision Assembly Prompt  
**Location:** `src/app/api/viva/master-vision/route.ts`
- Combines all 12 category summaries into unified document
- Follows "The Life I Choose" 5-phase methodology
- Uses `flattenProfile` and `flattenAssessment` from shared utilities

**AI Config:** `LIFE_VISION_MASTER_ASSEMBLY`
- Default: `gpt-4-turbo` (0.7 temp, 4000 max tokens)
- Admin-configurable at: `/admin/ai-models`

### Prompt Suggestions
**Location:** `src/app/api/viva/prompt-suggestions/route.ts`
- Generates personalized prompts based on profile/assessment
- Three prompt types: Peak Experiences, What Feels Amazing, What Feels Bad
- Cached for performance

**AI Config:** `PROMPT_SUGGESTIONS`
- Default: `gpt-4o` (0.8 temp, 1000 max tokens)
- Admin-configurable at: `/admin/ai-models`

## Data Flattening Utilities

**Location:** `src/lib/viva/prompt-flatteners.ts`

All profile and assessment data for AI prompts uses standardized flattening functions:

- `flattenProfile()` - Full profile object to key:value format
- `flattenAssessment()` - Compact assessment without scores
- `flattenAssessmentWithScores()` - Assessment with green line details
- `flattenAssessmentResponsesNumbered()` - Numbered Q&A format
- `flattenProfileStories()` - Category-specific user narratives
- `ellipsize()` - Truncate values for token efficiency

**Usage:**
```typescript
import { flattenProfile, flattenAssessment } from '@/lib/viva/prompt-flatteners'

const profileText = flattenProfile(userProfile)
const assessmentText = flattenAssessment(assessmentData)
```

## Database Storage

### refinements Table
- Stores transcripts and AI summaries per category
- Auto-saved during recording and processing
- Fields: `transcript`, `ai_summary`, `category`

### vision_versions Table  
- Stores complete vision documents
- Created during assembly
- Fields: `forward`, `fun`, `health`, `travel`, `love`, `family`, `social`, `home`, `work`, `money`, `stuff`, `giving`, `spirituality`, `conclusion`

### prompt_suggestions_cache Table
- Caches generated prompts per category
- Improves load times
- Can be regenerated via UI

## AI Model Configuration

All AI models can be configured via `/admin/ai-models`:

- **LIFE_VISION_CATEGORY_SUMMARY** - Per-category summaries
- **LIFE_VISION_MASTER_ASSEMBLY** - Master document assembly  
- **PROMPT_SUGGESTIONS** - Personalized prompt generation

## File Structure

```
/life-vision/new/
├── page.tsx                    # Landing page
├── README.md                   # This file
├── Prompts/                    # Reference prompt documents
│   ├── master-vision-assembly-prompt
│   ├── per-category-summary-prompt.md
│   └── shared-system-prompt.md
└── category/
    └── [key]/
        └── page.tsx           # Category input page
└── assembly/
    └── page.tsx               # Master assembly page

/src/lib/viva/
└── prompt-flatteners.ts       # Shared data flattening utilities

/src/app/api/viva/
├── category-summary/route.ts  # Category summary generation
├── master-vision/route.ts     # Master vision assembly
├── prompt-suggestions/route.ts # Personalized prompts
└── chat/route.ts             # Streaming chat interface
```

## Key Features

- **Profile-Aware:** Uses 70+ profile fields for context
- **Assessment-Informed:** Incorporates Green Line status and scores
- **Voice Preservation:** 80%+ user words in final output
- **Streaming:** Real-time token-by-token responses
- **Token Tracking:** All AI usage logged and tracked
- **Admin Configurable:** Models adjustable via admin panel

## References

- **Brand Kit:** `vibrationfit-brand-kit.html`
- **Design System:** `src/lib/design-system/components.tsx`
- **AI Config:** `src/lib/ai/config.ts`
- **Prompt Flatteners:** `src/lib/viva/prompt-flatteners.ts`

