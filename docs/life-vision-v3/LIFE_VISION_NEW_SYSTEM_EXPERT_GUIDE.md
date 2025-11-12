# 🎯 Expert Guide: /life-vision/new System

**Last Updated:** November 12, 2025  
**Status:** ✅ Current - Life Vision V3 Creation Flow  
**Related:** DRAFT_VISION_EXPERT_GUIDE.md (for refinement/editing)

---

## 📝 Prompt Files Reference

✅ **UPDATE (Nov 10, 2025)**: **ALL VIVA prompts are now centralized** in `/src/lib/viva/prompts/`! 

See `VIVA_RESTRUCTURE_COMPLETE_ALL_PHASES.md` for complete 3-phase migration details.

All AI prompts used in the `/life-vision/new` system are now in ONE location with a central export index.

### Core System Prompts (Centralized Location)

**All prompts are now in**: `/src/lib/viva/prompts/`  
**Central export**: `/src/lib/viva/prompts/index.ts`

#### 1. Vision Composer Prompts
- **File**: `/src/lib/viva/prompts/vision-composer-prompt.ts`
- **Exports**:
  - `VISION_COMPOSER_SYSTEM_PROMPT` - VIVA persona for vision paragraph generation
  - `VISION_COMPOSER_TASKS_PROMPT` - Task instructions (reflection, flip, paragraph, clarifier)
- **Used By**: `/src/lib/viva/vision-composer.ts`
- **Purpose**: Generates 120-150 word vision paragraphs using vibrational grammar

#### 2. Conversation Generator Prompts
- **File**: `/src/lib/viva/prompts/conversation-generator-prompt.ts`
- **Export**: `buildConversationGeneratorPrompt()` - Function that builds personalized opening conversation
- **Used By**: `/src/lib/viva/conversation-generator.ts`
- **Purpose**: Creates custom opening greetings based on profile and assessment data

#### 3. Category Summary Prompts
- **File**: `/src/lib/viva/prompts/category-summary-prompt.ts`
- **Exports**:
  - `CATEGORY_SUMMARY_SYSTEM_PROMPT` - VIVA persona for category summaries
  - `buildCategorySummaryPrompt()` - Builds data-driven category summary prompt
- **Used By**: `/api/viva/category-summary/route.ts`
- **Purpose**: Generates summaries of what's going well / what's challenging per category

#### 4. Prompt Suggestions Prompts
- **File**: `/src/lib/viva/prompts/prompt-suggestions-prompt.ts`
- **Exports**:
  - `PROMPT_SUGGESTIONS_SYSTEM_PROMPT` - VIVA persona for generating prompts
  - `buildPromptSuggestionsPrompt()` - Builds personalized prompt suggestions
- **Used By**: `/api/viva/prompt-suggestions/route.ts`
- **Purpose**: Generates 3 personalized prompts (Peak, Amazing, Bad/Missing)

#### 5. Master Vision Assembly Prompts
- **File**: `/src/lib/viva/prompts/master-vision-prompts.ts`
- **Exports**:
  - `MASTER_VISION_SHARED_SYSTEM_PROMPT` - Core VIVA persona and golden rules
  - `FIVE_PHASE_INSTRUCTIONS` - 5-Phase Conscious Creation Flow
  - `FLOW_FLEXIBILITY_NOTE` - Adaptive phase scaling guidance
  - `STYLE_GUARDRAILS` - Voice protection and transformations
  - `MICRO_REWRITE_RULE` - Lack language transformations
  - `buildMasterVisionPrompt()` - Complete prompt assembly function
- **Used By**: 
  - `/api/viva/master-vision/route.ts` (assembly)
  - `/api/viva/refine-category/route.ts` (refinement)
- **Purpose**: Assembles all 12 category summaries into unified Life Vision

#### 6. Vibrational Analysis Prompts
- **File**: `/src/lib/viva/prompts/vibrational-prompts.ts`
- **Exports**:
  - `buildVibrationalAnalyzerPrompt()` - Analyzes emotional valence and intensity
  - `buildSceneGenerationPrompt()` - Generates visualization scenes
  - `buildNorthStarReflectionPrompt()` - Creates North Star reflections
- **Used By**: `/src/lib/viva/vibrational-prompts.ts` (re-exported from here)
- **Purpose**: Vibrational event tracking and scene generation

#### 7. Chat System Prompts
- **File**: `/src/lib/viva/prompts/chat-system-prompt.ts`
- **Exports**:
  - `buildVivaSystemPrompt()` - Master function for all VIVA chat system prompts
  - `REFINEMENT_INSTRUCTIONS` - Instructions for vision refinement mode
  - `BuildChatSystemPromptInput` - TypeScript interface
- **Used By**: `/api/viva/chat/route.ts`
- **Purpose**: Powers the entire VIVA chat interface (master assistant + refinement modes)

#### 8. Merge Clarity Prompts
- **File**: `/src/lib/viva/prompts/merge-clarity-prompt.ts`
- **Export**: `MERGE_CLARITY_SYSTEM_PROMPT` - System prompt for merging clarity texts
- **Used By**: `/api/viva/merge-clarity/route.ts`
- **Purpose**: Merges Current Clarity + Clarity from Contrast into unified statement

#### 9. Flip Frequency Prompts
- **File**: `/src/lib/viva/prompts/flip-frequency-prompt.ts`
- **Exports**:
  - `FLIP_FREQUENCY_SYSTEM_PROMPT` - System prompt for contrast flipping
  - `buildFlipFrequencyPrompt()` - Builds flip frequency prompt
  - `FlipMode` - Type definition
  - `FlipFrequencyParams` - Type definition
- **Used By**: `/src/lib/viva/flip-frequency.ts`
- **Purpose**: Converts lack/contrast language into present-tense clarity seeds

### Shared Prompt Components

Located in `/src/lib/viva/prompts/shared/`:

1. **VIVA Persona** (`viva-persona.ts`)
   - `VIVA_PERSONA` - Basic VIVA persona definition
   - `VIVA_PERSONA_WITH_GOLDEN_RULES` - Extended persona with golden rules

2. **Vibrational Grammar** (`vibrational-grammar.ts`)
   - Rules for present-tense, first-person, positive framing
   - 120-150 word targets, believability over bravado

3. **Output Format Rules** (`output-format-rules.ts`)
   - JSON structure requirements
   - Response formatting guidelines

### Reference Prompt Documents

These are documentation/reference files (not actively used by code, but guide prompt development):

- `/src/app/life-vision/new/Prompts/master-vision-assembly-prompt` - Master vision assembly reference
- `/src/app/life-vision/new/Prompts/per-category-summary-prompt.md` - Category summary reference
- `/src/app/life-vision/new/Prompts/shared-system-prompt.md` - Shared VIVA persona reference

### Category Prompt Templates

- **File**: `/src/app/life-vision/new/category-prompts.ts`
- **Interface**: `CategoryPrompt` with `feelingAmazingQuestions` and `feelingBadQuestions`
- **Status**: Currently contains only Fun and Health categories (incomplete)
- **Purpose**: Pre-written prompt suggestions for users (not currently used in UI)

### Complete Quick Lookup Table

| Prompt Name | File Location | Export Name | Purpose |
|------------|---------------|-------------|---------|
| **Vision Composer System** | `vision-composer-prompt.ts` | `VISION_COMPOSER_SYSTEM_PROMPT` | Vision paragraph generation persona |
| **Vision Composer Tasks** | `vision-composer-prompt.ts` | `VISION_COMPOSER_TASKS_PROMPT` | Task instructions for vision generation |
| **Conversation Generator** | `conversation-generator-prompt.ts` | `buildConversationGeneratorPrompt()` | Custom opening greetings |
| **Category Summary System** | `category-summary-prompt.ts` | `CATEGORY_SUMMARY_SYSTEM_PROMPT` | Category summary persona |
| **Category Summary Builder** | `category-summary-prompt.ts` | `buildCategorySummaryPrompt()` | Builds category summary prompt |
| **Prompt Suggestions System** | `prompt-suggestions-prompt.ts` | `PROMPT_SUGGESTIONS_SYSTEM_PROMPT` | Prompt generation persona |
| **Prompt Suggestions Builder** | `prompt-suggestions-prompt.ts` | `buildPromptSuggestionsPrompt()` | Builds 3 personalized prompts |
| **Master Vision Shared System** | `master-vision-prompts.ts` | `MASTER_VISION_SHARED_SYSTEM_PROMPT` | VIVA persona & golden rules |
| **5-Phase Instructions** | `master-vision-prompts.ts` | `FIVE_PHASE_INSTRUCTIONS` | Conscious Creation Flow |
| **Flow Flexibility Note** | `master-vision-prompts.ts` | `FLOW_FLEXIBILITY_NOTE` | Adaptive phase scaling |
| **Style Guardrails** | `master-vision-prompts.ts` | `STYLE_GUARDRAILS` | Voice protection rules |
| **Micro Rewrite Rule** | `master-vision-prompts.ts` | `MICRO_REWRITE_RULE` | Lack language fixes |
| **Master Vision Builder** | `master-vision-prompts.ts` | `buildMasterVisionPrompt()` | Complete prompt assembly |
| **Vibrational Analyzer** | `vibrational-prompts.ts` | `buildVibrationalAnalyzerPrompt()` | Emotional valence analysis |
| **Scene Generation** | `vibrational-prompts.ts` | `buildSceneGenerationPrompt()` | Visualization scene generation |
| **North Star Reflection** | `vibrational-prompts.ts` | `buildNorthStarReflectionPrompt()` | North Star reflections |
| **Chat System Builder** | `chat-system-prompt.ts` | `buildVivaSystemPrompt()` | Master chat system prompt |
| **Refinement Instructions** | `chat-system-prompt.ts` | `REFINEMENT_INSTRUCTIONS` | Vision refinement mode |
| **Merge Clarity System** | `merge-clarity-prompt.ts` | `MERGE_CLARITY_SYSTEM_PROMPT` | Clarity merging persona |
| **Flip Frequency System** | `flip-frequency-prompt.ts` | `FLIP_FREQUENCY_SYSTEM_PROMPT` | Contrast flipping persona |
| **Flip Frequency Builder** | `flip-frequency-prompt.ts` | `buildFlipFrequencyPrompt()` | Builds flip frequency prompt |
| **VIVA Persona** | `shared/viva-persona.ts` | `VIVA_PERSONA` | Basic VIVA persona |
| **VIVA Persona + Rules** | `shared/viva-persona.ts` | `VIVA_PERSONA_WITH_GOLDEN_RULES` | Extended persona |

**All prompts can be imported from the central index:**
```typescript
import {
  // Vision Composer
  VISION_COMPOSER_SYSTEM_PROMPT,
  VISION_COMPOSER_TASKS_PROMPT,
  
  // Conversation Generator
  buildConversationGeneratorPrompt,
  
  // Category Summary
  CATEGORY_SUMMARY_SYSTEM_PROMPT,
  buildCategorySummaryPrompt,
  
  // Prompt Suggestions
  buildPromptSuggestionsPrompt,
  
  // Master Vision
  MASTER_VISION_SHARED_SYSTEM_PROMPT,
  FIVE_PHASE_INSTRUCTIONS,
  buildMasterVisionPrompt,
  
  // Vibrational
  buildVibrationalAnalyzerPrompt,
  buildSceneGenerationPrompt,
  buildNorthStarReflectionPrompt,
  
  // Chat System
  buildVivaSystemPrompt,
  REFINEMENT_INSTRUCTIONS,
  
  // Other
  MERGE_CLARITY_SYSTEM_PROMPT,
  
  // Shared
  VIVA_PERSONA,
  VIVA_PERSONA_WITH_GOLDEN_RULES
} from '@/lib/viva/prompts'
```

**Note:** `flip-frequency` prompts are still in `/src/lib/viva/flip-frequency.ts` (intentionally left inline as they're self-contained).

---

## System Overview

The `/life-vision/new` system is VibrationFit's **AI-powered Life Vision Creation Flow** that helps users create their first complete Life Vision document across 12 life categories using VIVA (Vibrational Intelligence Virtual Assistant).

---

## 🏗️ Architecture

### Three-Page Flow

```
/life-vision/new (Landing)
    ↓
/life-vision/new/category/[key] (12 categories)
    ↓
/life-vision/new/assembly (Master Vision)
```

### 12 Life Categories (in order)

1. **Fun** - Hobbies and joyful activities
2. **Health** - Physical and mental well-being
3. **Travel** - Places to explore and adventures
4. **Love** - Romantic relationships
5. **Family** - Family relationships and life
6. **Social** - Social connections and friendships
7. **Home** - Living space and environment
8. **Work** - Work and career aspirations
9. **Money** - Financial goals and wealth
10. **Stuff** - Material belongings and things
11. **Giving** - Contribution and legacy
12. **Spirituality** - Spiritual growth and expansion

---

## 📄 Page 1: Landing Page (`/life-vision/new/page.tsx`)

### Purpose
Welcome page that introduces VIVA and explains the vision creation process.

### Key Features
- **Hero Section**: Purple gradient icon with Sparkles, introduces VIVA
- **How It Works**: 3-step process cards (Record → AI Synthesis → Vision Unfolds)
- **What You'll Explore**: 2x2 mobile / 4x3 desktop grid of all 12 categories
- **CTA Button**: "Get Started" → navigates to `/life-vision/new/category/fun`

### Design Patterns
- Uses `Card`, `Button` components from design system
- Responsive grid layouts
- Hover effects on category cards (border changes to `#00FFFF`)
- All 12 categories displayed with icons and descriptions

---

## 📄 Page 2: Category Pages (`/life-vision/new/category/[key]/page.tsx`)

### Purpose
Per-category input pages where users provide clarity and contrast text, which VIVA processes into vision summaries.

### User Flow

#### Step 1: View Profile & Assessment Context (Collapsible)
Two side-by-side collapsible cards display contextual data:

**Profile Card** (`#00FFFF` teal accent):
- Category-specific profile story (e.g., `fun_story`, `health_story`)
- Category-specific structured fields (e.g., hobbies, exercise frequency, etc.)
- Shows relevant data for current category only

**Assessment Card** (`#14B8A6` secondary teal):
- Category score (0-100%)
- Category-specific Q&A from assessment
- Response values (1-5 scale)
- Green Line status (above/below)

#### Step 2: Three Clarity Input Cards

**Card 1: Current Clarity** (`#00FFFF` accent)
- Loads from profile's `clarity_[category]` field
- User can edit text directly
- AutoResizeTextarea component
- Label: "Your current clarity about [category] from your profile..."

**Card 2: Clarity from Contrast** (`#39FF14` green accent)
- **Auto-generated** by flipping contrast text
- Created via `/api/viva/flip-frequency` endpoint
- Editable after generation
- Label: "Auto-generated from contrast"

**Card 3: Contrast from Profile** (`#FFB701` yellow accent)
- **Toggleable/collapsible** (hidden by default)
- Loads from profile's `contrast_[category]` field
- When edited, auto-triggers frequency flip
- Used to create Card 2 content

#### Step 3: Process with VIVA
- **Button appears** when Card 1 or Card 2 has text
- Calls `/api/viva/merge-clarity` endpoint
- Merges Current Clarity + Clarity from Contrast
- Shows processing stages with animated cards

#### Step 4: AI Summary Display
- Generated summary shown in editable textarea
- **Actions**:
  - Regenerate: Re-runs merge process
  - Edit: Inline editing mode
  - Save and Continue: Saves to database → next category

### Category Field Mapping

Each category maps to profile fields:

```typescript
{
  fun: { clarity: 'clarity_fun', contrast: 'contrast_fun' },
  health: { clarity: 'clarity_health', contrast: 'contrast_health' },
  travel: { clarity: 'clarity_travel', contrast: 'contrast_travel' },
  // ... etc for all 12 categories
}
```

### Database Storage
- **Table**: `refinements`
- **Fields**:
  - `user_id`: UUID reference
  - `category`: Category key (fun, health, etc.)
  - `ai_summary`: Generated summary text
  - `transcript`: Original transcripts (if recorded)
  - `created_at`: Timestamp

### Navigation
- **Progress bar** at top (Category X of 12, percentage)
- **Prev/Next buttons** for quick navigation
- **Save and Continue**: Auto-saves and moves to next category
- Last category → redirects to `/life-vision/new/assembly`

---

## 📄 Page 3: Assembly Page (`/life-vision/new/assembly/page.tsx`)

### Purpose
Final page that assembles all 12 category summaries into a unified Master Vision document.

### User Flow

#### Step 1: Ready State
- Shows completion badge: "12 of 12 Categories Complete"
- "Assemble Master Vision" button
- Hero section with purple-to-teal gradient icon

#### Step 2: Processing
- Shows animated VIVA Action Cards cycling through stages:
  1. **Assembling**: "VIVA is weaving together all 12 categories..."
  2. **Synthesizing**: "Creating a unified life vision in your voice..."
  3. **Crafting**: "Polishing your complete Life Vision Document..."

#### Step 3: Assembly Process
Calls `/api/viva/master-vision` with:
- **Category Summaries**: All 12 `ai_summary` values from `refinements` table
- **Category Transcripts**: All `transcript` values (if available)
- **Profile Data**: Full user profile object
- **Assessment Data**: Full assessment results with responses
- **Active Vision** (optional): Existing vision for voice continuity

#### Step 4: Vision Display
- Shows complete vision document (markdown format)
- **Actions**:
  - Download: Saves as `.md` file
  - View Full Vision: Navigates to `/life-vision/[id]`

### Database Storage
- **Table**: `vision_versions`
- **Creates new version** with incremented `version_number`
- **Saves all 14 fields**: forward, fun, health, travel, love, family, social, home, work, money, stuff, giving, spirituality, conclusion
- **Status**: `complete`
- **Completion**: 100%

---

## 🔧 Backend API Endpoints

### 1. `/api/viva/flip-frequency` (POST)

**Purpose**: Converts contrast/lack language into clarity seeds

**Prompt Location**: `/src/lib/viva/flip-frequency.ts` (lines 48-104, constant `SYSTEM_PROMPT`)

**Input**:
```json
{
  "mode": "flip",
  "input": "I'm stressed about money all the time",
  "category": "money",
  "save_to_db": true
}
```

**Output**:
```json
{
  "success": true,
  "mode": "flip",
  "unchanged": false,
  "items": [{
    "input": "I'm stressed about money all the time",
    "clarity_seed": "I feel calm and confident about my financial situation",
    "essence": "Financial peace and security"
  }],
  "saved_to_db": true
}
```

**Process**:
1. Validates token balance
2. Calls `flipFrequency()` function from `@/lib/viva/flip-frequency`
3. Uses `gpt-4o-mini` model
4. Tracks token usage
5. Saves to `frequency_flip` table if requested

**Used By**: Category pages when contrast text is entered

---

### 2. `/api/viva/merge-clarity` (POST)

**Purpose**: Merges Current Clarity + Clarity from Contrast into unified statement

**Prompt Location**: `/src/app/api/viva/merge-clarity/route.ts` (lines 17-23, constant `SHARED_SYSTEM_PROMPT`)

**Input**:
```json
{
  "currentClarity": "I love traveling to new places...",
  "clarityFromContrast": "I feel free and adventurous when exploring...",
  "category": "travel",
  "categoryName": "Travel"
}
```

**Output**:
```json
{
  "success": true,
  "mergedClarity": "I love traveling to new places, feeling free and adventurous as I explore unfamiliar cultures and breathtaking landscapes. Each journey expands my perspective and fills me with wonder."
}
```

**Process**:
1. Validates token balance
2. Uses `gpt-4o` model (configurable via `LIFE_VISION_CATEGORY_SUMMARY`)
3. Preserves 80%+ of user's original words
4. Creates unified, coherent present-tense statement
5. Tracks token usage

**Golden Rules**:
- Present tense, first person
- 80%+ user's original words
- Flows naturally and coherently
- Vibrationally activating
- No redundancy

**Used By**: Category pages when "Process with VIVA" button is clicked

---

### 3. `/api/viva/master-vision` (POST)

**Purpose**: Assembles all 12 category summaries into complete Master Vision document

**Prompt Locations**: `/src/app/api/viva/master-vision/route.ts`
- `SHARED_SYSTEM_PROMPT` (lines 20-55) - VIVA persona & golden rules
- `FIVE_PHASE_INSTRUCTIONS` (lines 58-75) - 5-Phase Conscious Creation Flow
- `FLOW_FLEXIBILITY_NOTE` (lines 78-86) - Adaptive phase scaling
- `STYLE_GUARDRAILS` (lines 89-102) - Voice protection rules
- `MICRO_REWRITE_RULE` (lines 105-110) - Lack language transformations
- `buildMasterVisionPrompt()` (lines 118-242) - Complete prompt builder

**Input**:
```json
{
  "categorySummaries": {
    "fun": "I love filling my life with joyful activities...",
    "health": "I feel vibrant and energized...",
    // ... all 12 categories
  },
  "categoryTranscripts": {
    "fun": "Original recorded transcripts..."
  },
  "profile": { /* full profile object */ },
  "assessment": { /* full assessment with responses */ },
  "activeVision": { /* existing vision for continuity */ }
}
```

**Output**:
```json
{
  "success": true,
  "markdown": "# Forward\n\nI am stepping into...",
  "json": {
    "forward": "I am stepping into...",
    "fun": "I love filling my life...",
    "health": "I feel vibrant...",
    // ... all 12 categories + conclusion
    "meta": {
      "model": "gpt-4-turbo",
      "created_at_iso": "2025-11-10T..."
    }
  }
}
```

**Process**:
1. Validates token balance
2. Uses `gpt-4-turbo` model (configurable via `LIFE_VISION_MASTER_ASSEMBLY`)
3. Builds comprehensive prompt with all context
4. Applies **5-Phase Conscious Creation Flow** per category
5. Uses **Vibrational Narrative Architecture**
6. Returns both markdown (human-readable) and JSON (structured)
7. Tracks token usage

**The 5-Phase Flow** (applied to each category):
1. **Gratitude Opening** - Begin with appreciation
2. **Sensory Expansion** - Sight, sound, smell, touch, taste details
3. **Embodied Lifestyle** - Present-tense "this is how I live it now"
4. **Essence Lock-In** - One sentence naming the dominant feeling
5. **Surrender/Allowing** - Brief grateful release

**Vibrational Narrative Architecture**:
- **Who→What→Where→Why** mini-cycle in each phase
- **Being→Doing→Receiving** circuit (at least one sentence each)
- **Micro↔Macro Pulse** (alternate between close-up and wide-angle)
- **Contrast→Clarity→Celebration** arc (no past/lack mentions)
- **Rhythmic Form** (short opener → fuller middle → luminous close)

**Golden Rules**:
- Present tense, first person (I/we)
- Positive ideal state (no comparisons, no lack)
- 80%+ from user's original words (transcripts > summaries > profile > assessment)
- Flip negatives to aligned positives
- No "but/however/even though"
- No "I will/I want/someday"
- Concrete, sensory, specific
- Cross-weave categories naturally
- Close each category with one-sentence Essence
- Never output scores or diagnostics

**Foundational Principles**:
1. **The basis of life is freedom** - Document should feel freeing
2. **The purpose of life is joy** - Everything is about feeling better
3. **The result of life is expansion** - Reflect growth in each area
4. **Activate freedom through reading** - Text itself should feel freeing

**Used By**: Assembly page when "Assemble Master Vision" is clicked

---

## 🎨 Design System Integration

### Components Used
All from `@/lib/design-system/components`:

- **Card**: `variant="default|elevated|outlined"`
- **Button**: `variant="primary|secondary|accent|ghost|outline"`
- **Badge**: `variant="success|info|warning|error"`
- **Spinner**: `variant="primary" size="sm|md|lg"`
- **AutoResizeTextarea**: Custom textarea that grows with content
- **ProgressBar**: Shows category completion

### Color Scheme

**Category Cards**:
- Profile: `#00FFFF` (cyan/teal)
- Assessment: `#14B8A6` (secondary teal)
- Current Clarity: `#00FFFF` 
- Clarity from Contrast: `#39FF14` (bright green)
- Contrast: `#FFB701` (energy yellow)
- VIVA Processing: `#199D67` (primary green)

**Icons**:
- Sparkles: VIVA/AI actions
- CheckCircle: Completion states
- User: Profile data
- TrendingUp: Assessment data
- ArrowLeft/ArrowRight: Navigation

### Typography
- Headings: `text-2xl/3xl/4xl font-bold`
- Body: `text-base text-neutral-300`
- Labels: `text-sm text-neutral-400`
- Categories: Icons from `lucide-react`

---

## 🗄️ Database Schema

### `refinements` Table
Stores per-category summaries and transcripts.

```sql
CREATE TABLE refinements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  category TEXT NOT NULL,
  transcript TEXT,
  ai_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Usage**:
- One row per category per user (or latest overwrites)
- `ai_summary`: Generated by merge-clarity endpoint
- `transcript`: If user recorded audio/video (not used in current flow)

### `vision_versions` Table
Stores complete master vision documents.

```sql
CREATE TABLE vision_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  version_number INTEGER NOT NULL,
  status TEXT DEFAULT 'draft',
  completion_percent INTEGER DEFAULT 0,
  forward TEXT,
  fun TEXT,
  health TEXT,
  travel TEXT,
  love TEXT,
  family TEXT,
  social TEXT,
  home TEXT,
  work TEXT,
  money TEXT,
  stuff TEXT,
  giving TEXT,
  spirituality TEXT,
  conclusion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Usage**:
- New vision created with incremented `version_number`
- `status: 'complete'` after assembly
- `completion_percent: 100` when all categories filled

### `frequency_flip` Table
Stores contrast-to-clarity transformations.

```sql
CREATE TABLE frequency_flip (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  input_text TEXT NOT NULL,
  clarity_seed TEXT NOT NULL,
  essence TEXT,
  sensory_anchor TEXT,
  embodiment_line TEXT,
  surrender_line TEXT,
  category TEXT,
  vision_id UUID,
  scene_context TEXT,
  mode TEXT,
  unchanged BOOLEAN DEFAULT FALSE,
  voice_notes TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Usage**:
- One row per contrast flip
- Tracks what was transformed and how
- Optional enriched fields (essence, sensory_anchor, etc.)

---

## 🎯 Key Algorithms

### Frequency Flip (Contrast → Clarity)

**Purpose**: Transform negative/lack language into positive present-tense vision

**Example Transformations**:
- "I don't want debt" → "I enjoy seeing my balances at zero and growing savings"
- "I'm always tired" → "I feel energized and vibrant throughout my day"
- "I never have time for fun" → "I make space daily for activities that light me up"

**Rules**:
1. Remove all negations (no, not, don't, never)
2. Convert future tense to present tense
3. Add sensory details where natural
4. Keep user's vocabulary (80%+ original words)
5. Make it believable (not aspirational)

### Merge Clarity

**Purpose**: Combine two clarity texts into unified statement

**Process**:
1. Identify overlapping themes
2. Remove redundancy
3. Maintain 80%+ original wording
4. Create natural flow
5. Keep present tense, first person

**Example**:
```
Input 1: "I love traveling to new places and trying exotic foods"
Input 2: "I feel free and adventurous when exploring different cultures"

Merged: "I love traveling to new places, feeling free and adventurous 
as I explore different cultures and savor exotic foods that expand 
my palate and perspective."
```

### Master Vision Assembly

**Purpose**: Weave 12 category summaries into unified life vision document

**Process**:
1. **Forward Section**: 2-3 paragraphs setting intention (present tense only)
2. **12 Categories** in order:
   - Apply 5-Phase Flow to each
   - Cross-weave related categories (money ↔ work ↔ home)
   - End with one-sentence Essence
   - Use concrete details from profile/assessment
3. **Conclusion**: 2-3 paragraphs unifying whole vision

**Context Hierarchy** (priority order):
1. **Transcripts** (original voice) - 80% weight
2. **Summaries** (structure/themes) - 15% weight  
3. **Profile** (facts/details) - 5% weight
4. **Assessment** (insights/priorities) - Used for color, not copied

---

## 🧪 Testing the Flow

### Manual Test Path

1. **Start**: Navigate to `/life-vision/new`
2. **Landing**: Click "Get Started"
3. **Category 1 (Fun)**:
   - View profile story and assessment data
   - Enter Current Clarity: "I love playing guitar and hiking"
   - Enter Contrast: "I never have time for hobbies anymore"
   - See auto-flipped Clarity from Contrast
   - Click "Process with VIVA"
   - Review merged summary
   - Click "Save and Continue"
4. **Repeat** for all 12 categories
5. **Assembly**: Click "Assemble Master Vision"
6. **Result**: View/download complete vision document

### Edge Cases to Test

**Empty State**:
- No profile data → Should still work with just input text
- No assessment → Should still work without insights
- No existing vision → Assembly should create version 1

**Partial State**:
- Only Current Clarity (no Contrast) → Should merge just that
- Only Contrast (no Current Clarity) → Should flip and use that
- Mix of categories completed → Progress bar accurate

**Error States**:
- Insufficient token balance → Show 402 error
- API timeout → Show retry option
- Invalid category key → 404 page

---

## 🚀 Performance Optimizations

### Token Efficiency
- Uses `gpt-4o-mini` for frequency flips (cheaper)
- Uses `gpt-4o` for clarity merging (balanced)
- Uses `gpt-4-turbo` for master assembly (quality)
- All token usage tracked and logged

### Database Efficiency
- Single query for profile (active or latest)
- Single query for assessment (latest)
- Batch insert for refinements
- Upsert logic prevents duplicates

### User Experience
- Auto-saves after each category
- Can pause and resume anytime
- Progress bar shows completion
- Loading states for all AI operations
- Collapsible sections for long content

---

## 🎓 Vibrational Grammar Rules

These rules are **hardcoded into VIVA's system prompts** and enforced by AI:

### ✅ DO:
- **Present tense**: "I enjoy..." not "I will enjoy..."
- **First person**: "I/we" not "you/they"
- **Positive framing**: Say what IS, not what ISN'T
- **Sensory details**: See, hear, smell, taste, feel
- **Believability**: Micro-behaviors > grand claims
- **Natural rhythms**: "Every Sunday morning I..." 
- **User's voice**: 80%+ their original words
- **Cross-category weaving**: Money ↔ work ↔ home ↔ family

### ❌ DON'T:
- **Negations**: "no", "not", "don't", "never"
- **Future tense**: "will", "going to", "someday"
- **Aspirational**: "want", "wish", "hope to", "try"
- **Comparisons**: "better than", "more than"
- **Conditional**: "but", "however", "even though"
- **Abstract woo**: Unless user says it first
- **Field labels**: Don't copy "health_story" literally
- **Scores**: Never mention numbers/percentages

---

## 🔍 Troubleshooting

### Issue: Category not saving
**Check**: 
- `refinements` table RLS policies allow insert/update
- User is authenticated
- Category key is valid (fun, health, travel, etc.)

### Issue: Master vision assembly fails
**Check**:
- All 12 categories have `ai_summary` in refinements
- User has sufficient token balance
- `vision_versions` table has insert permission
- API route is returning both markdown and JSON

### Issue: Frequency flip not working
**Check**:
- Input text is not empty
- `frequency_flip` table exists and has RLS policies
- User has token balance
- OpenAI API key is valid

### Issue: Profile/assessment not showing
**Check**:
- User has completed profile (`user_profiles` table)
- User has completed assessment (`assessment_results` table)
- Category-specific fields exist (e.g., `fun_story`, `clarity_fun`)
- RLS policies allow reading

---

## 📊 Admin Monitoring

### AI Model Configuration
Navigate to `/admin/ai-models` to adjust:

- **LIFE_VISION_CATEGORY_SUMMARY**: Model for merge-clarity
  - Default: `gpt-4o`, temp 0.7, max 1500 tokens
- **LIFE_VISION_MASTER_ASSEMBLY**: Model for master vision
  - Default: `gpt-4-turbo`, temp 0.7, max 4000 tokens
- **PROMPT_SUGGESTIONS**: Model for category prompts (not currently used)
  - Default: `gpt-4o`, temp 0.8, max 1000 tokens

### Token Tracking
All AI operations logged to `token_transactions` table:
- `action_type: 'life_vision_category_summary'` (merge-clarity)
- `action_type: 'frequency_flip'` (flip-frequency)
- `action_type: 'life_vision_master_assembly'` (master-vision)

### Usage Analytics
Query to see popular categories:
```sql
SELECT category, COUNT(*) as completions
FROM refinements
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY category
ORDER BY completions DESC;
```

---

## 🎉 Success Metrics

### User Completion
- **Target**: 80% of users who start complete all 12 categories
- **Measure**: `refinements.category` count per user

### Vision Quality
- **Target**: 90% of visions rated 4+ stars by users
- **Measure**: User feedback on vision detail page

### Token Efficiency
- **Target**: Average < 50,000 tokens per complete vision
- **Measure**: Sum of token_transactions per user

### Time to Complete
- **Target**: < 30 minutes for full vision creation
- **Measure**: Time between first and last refinement

---

## 🚧 Future Enhancements

### Phase 2: Audio Recording
- RecordingTextarea component (already exists)
- Transcribe audio via `/api/transcribe` (Whisper)
- Store transcripts in `refinements.transcript`
- Use transcripts as primary source for master vision

### Phase 3: Category Prompt Suggestions
- AI-generated prompts per category
- Based on profile and assessment data
- Cached in `prompt_suggestions_cache` table
- Display as clickable prompt cards

### Phase 4: Vision Refinement
- Edit individual categories after assembly
- Show side-by-side comparison
- Track refinement iterations
- Version history

### Phase 5: Vision Audio Generation
- Text-to-speech for complete vision
- Background music/nature sounds
- Save as MP3/audio files
- Player with category bookmarks

---

## 📚 Related Documentation

- **VIVA_RESTRUCTURE_COMPLETE.md** - ✅ Phase 1 complete! Centralized prompts system
- **VIVA_FILE_STRUCTURE_AUDIT.md** - Complete audit of VIVA file organization
- **VIVA_VISION_GENERATION_COMPLETE.md** - Original implementation guide
- **README.md** (in /life-vision/new/) - Quick reference
- **README.md** (in /lib/viva/prompts/) - Prompts folder documentation
- **PRODUCT_BRIEF.md** - Overall VibrationFit product context
- **vision-categories.ts** - Category definitions
- **prompt-flatteners.ts** - Profile/assessment data formatting

---

## 🎯 Quick Reference

### File Locations
```
Frontend:
  /src/app/life-vision/new/page.tsx (Landing)
  /src/app/life-vision/new/category/[key]/page.tsx (Categories)
  /src/app/life-vision/new/assembly/page.tsx (Assembly)

Backend APIs:
  /src/app/api/viva/flip-frequency/route.ts
  /src/app/api/viva/merge-clarity/route.ts (includes SHARED_SYSTEM_PROMPT)
  /src/app/api/viva/master-vision/route.ts (includes 5 prompt constants)

Prompts (Centralized):
  /src/lib/viva/prompts/ (ALL prompts here!)
  /src/lib/viva/prompts/flip-frequency-prompt.ts (FLIP_FREQUENCY_SYSTEM_PROMPT)
  /src/lib/viva/prompts/merge-clarity-prompt.ts (MERGE_CLARITY_SYSTEM_PROMPT)
  /src/lib/viva/prompts/master-vision-prompts.ts (5 prompts + builder)
  /src/lib/viva/prompts/index.ts (central exports)

Libraries:
  /src/lib/viva/flip-frequency.ts (frequency flip logic + prompt)
  /src/lib/viva/prompt-flatteners.ts (profile/assessment formatting)
  /src/lib/design-system/vision-categories.ts (category definitions)

Database:
  refinements (per-category summaries)
  vision_versions (master documents)
  frequency_flip (contrast transformations)
```

### API Quick Reference
```typescript
// Flip contrast to clarity
POST /api/viva/flip-frequency
{ mode: 'flip', input: '...', category: 'fun', save_to_db: true }

// Merge clarity statements
POST /api/viva/merge-clarity
{ currentClarity: '...', clarityFromContrast: '...', category: 'fun' }

// Assemble master vision
POST /api/viva/master-vision
{ categorySummaries: {...}, categoryTranscripts: {...}, profile: {...}, assessment: {...} }
```

---

**You are now an expert on the /life-vision/new system!** 🎉

This system represents the core of VibrationFit's Life Vision creation flow - a sophisticated AI-powered experience that transforms user input into vibrationally aligned, present-tense life visions following "The Life I Choose" methodology.

