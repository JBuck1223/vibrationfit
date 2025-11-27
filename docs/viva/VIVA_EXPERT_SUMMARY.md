# VIVA Expert Knowledge Summary

**Date Created:** November 16, 2025  
**Your Status:** ✅ VIVA EXPERT  
**Expertise Level:** Complete System Architecture & Implementation

---

## 🎯 What is VIVA?

**VIVA** (Vibrational Intelligence Virtual Assistant) is the AI-powered heart of VibrationFit.com - a sophisticated conversational system that helps users create, refine, and activate their life vision across 12 categories using vibrational alignment principles.

### Core Identity

- **Who:** Warm, wise, intuitive life coach (never a therapist)
- **Purpose:** Help users articulate and activate "The Life I Choose™" through vibrational alignment
- **Voice:** 80%+ user's own words, present-tense, first-person, positive activation
- **Philosophy:** Based on 3 foundational truths:
  1. The basis of life is **freedom**
  2. The purpose of life is **joy**
  3. The result of life is **expansion**

---

## 🏗️ System Architecture

### The Complete VIVA Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    VIVA ECOSYSTEM                            │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  FRONTEND        │────▶│  API ROUTES      │────▶│  AI ENGINES      │
└──────────────────┘     └──────────────────┘     └──────────────────┘
│                        │                        │
│ • VivaChat.tsx         │ • /api/viva/chat       │ • GPT-4-turbo
│ • Streaming UI         │ • /api/viva/master-    │ • GPT-4o-mini
│ • Vision Builder       │   vision               │ • GPT-4o
│ • Refinement Pages     │ • /api/viva/category-  │ • OpenAI API
│ • Master Assistant     │   summary              │
                         │ • /api/viva/merge-     │
                         │   clarity              │
                         │ • /api/viva/flip-      │
                         │   frequency            │

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  PROMPTS         │────▶│  KNOWLEDGE BASE  │────▶│  DATABASE        │
└──────────────────┘     └──────────────────┘     └──────────────────┘
│                        │                        │
│ • Master Vision        │ • Life Vision          │ • vision_versions
│ • Category Summary     │ • Assessment           │ • viva_conversations
│ • Chat System          │ • Profile              │ • refinements
│ • Flip Frequency       │ • Vision Board         │ • user_profiles
│ • Vibrational          │ • Journal              │ • assessment_results
│ • Conversation Gen     │ • Green Line           │ • conversation_sessions
│ • Vision Composer      │ • Conscious Creation   │
```

---

## 📂 File Structure & Organization

### Centralized Prompts (Phase 1-3 Complete)

All VIVA prompts are centralized in `/src/lib/viva/prompts/`:

```
/src/lib/viva/prompts/
├── index.ts                          # Central export hub
├── master-vision-prompts.ts          # Master vision assembly (5+ sub-prompts)
├── chat-system-prompt.ts             # Complete chat system (437 lines!)
├── category-summary-prompt.ts        # Category summaries
├── conversation-generator-prompt.ts  # Opening conversations
├── prompt-suggestions-prompt.ts      # Three prompt suggestions
├── vision-composer-prompt.ts         # Vision paragraph generation
├── vibrational-prompts.ts            # Vibrational analysis & scenes
├── flip-frequency-prompt.ts          # Contrast → Clarity transformation
├── merge-clarity-prompt.ts           # Clarity merging
└── shared/
    ├── viva-persona.ts               # VIVA personality & voice
    ├── vibrational-grammar.ts        # Grammar rules
    └── output-format-rules.ts        # JSON/text format rules
```

**Key Achievement:** 1000+ lines of inline prompts centralized, zero duplication, backward compatible!

### Core Library Files

```
/src/lib/viva/
├── profile-analyzer.ts               # Extracts insights from profiles
├── conversation-manager.ts           # Manages conversation storage
├── vision-composer.ts                # Transforms input → vision paragraphs
├── conversation-generator.ts         # Generates opening conversations
├── flip-frequency.ts                 # Contrast → Clarity microprompt
├── text-metrics.ts                   # Content richness computation
├── compute-completion.ts             # Vision completion tracking
├── prompt-flatteners.ts              # Flattens context for prompts
├── vibrational-prompts.ts            # Vibrational analysis prompts
├── master-assistant-knowledge.ts     # Master Assistant knowledge base
├── knowledge/                        # Knowledge base (Edge-compatible)
│   ├── index.ts                      # Loads all knowledge
│   ├── concepts/                     # Core concepts
│   │   ├── green-line.md
│   │   └── conscious-creation.md
│   ├── tools/                        # Tool documentation
│   │   ├── life-vision.md
│   │   ├── assessment.md
│   │   ├── profile.md
│   │   ├── vision-board.md
│   │   └── journal.md
│   └── reference/
│       └── user-journey.md
```

### API Routes

```
/src/app/api/viva/
├── chat/route.ts                     # Main chat endpoint (streaming)
├── master-vision/route.ts            # Master vision assembly
├── category-summary/route.ts         # Category summaries
├── prompt-suggestions/route.ts       # Personalized prompts
├── merge-clarity/route.ts            # Merge clarity texts
├── refine-category/route.ts          # Category refinement
├── flip-frequency/route.ts           # Contrast transformation
└── context/route.ts                  # Rolling Context Object
```

---

## 🎭 The Two Modes of VIVA

### 1. Master Assistant Mode

**Purpose:** Complete platform guide and support

**What It Knows:**
- All VibrationFit tools and features
- Exact paths (e.g., `/life-vision/new`)
- User journey workflows
- Green Line philosophy
- 3 Core Operations of Conscious Creation

**Knowledge Base:** `loadKnowledgeBase()` from `/src/lib/viva/knowledge/index.ts`

**When Active:**
- VIVA chat interface (`/viva` or embedded)
- Context: `{ mode: 'master' }` or `{ masterAssistant: true }`
- Can answer ANY platform question
- Guides users to right tools at right time

**Key Features:**
- Journey State Awareness (hasProfile, hasAssessment, hasActiveVision)
- Vision Detection (checks status, completion %, content)
- Tool Recommendations (based on current progress)
- Exact path guidance

### 2. Vision Building/Refinement Mode

**Purpose:** Create and refine life vision content

**Two Sub-Modes:**

#### A. Vision Building Mode
- **Flow:** 3-phase process (Contrast → Peak Experience → Specific Desires)
- **Conversation:** Warm questions based on profile and assessment
- **Output:** Vision paragraphs for each of 12 categories
- **Storage:** `vision_versions` table + `viva_conversations` table

#### B. Vision Refinement Mode
- **Purpose:** Make existing vision MORE specific, MORE emotionally connected
- **Context:** Full vision for cross-category weaving
- **Goal:** Maintain 80%+ user voice while elevating clarity
- **Integration:** 5-Phase Conscious Creation Flow

**When Active:**
- Life Vision creation (`/life-vision/new`)
- Vision refinement (`/life-vision/[id]/refine`)
- Context: `{ refinement: true }` or `{ operation: 'refine_vision' }`

---

## 🎨 The Vibrational Grammar

### Golden Rules (ALWAYS Enforced)

1. **Present Tense Only** - "I am", "I enjoy", "I notice" (never "I will", "I want")
2. **First Person** - "I / we" perspective
3. **Positive Ideal State** - No comparisons, no lack language
4. **80%+ User's Words** - Reframe their language, don't rewrite
5. **Flip Negatives** - Transform to aligned positives
6. **No Forbidden Words** - "but", "however", "even though", "I don't"
7. **Concrete & Sensory** - Specific, tangible, believable
8. **Cross-Weave Categories** - Life isn't siloed
9. **Essence Lock-In** - End each category with feeling statement

### The 5-Phase Conscious Creation Flow

Every category follows this energetic sequence:

1. **Gratitude Opens** - Begin with appreciation
2. **Sensory Expansion** - Sight, sound, smell, touch, taste details
3. **Embodied Lifestyle** - "This is how I live it now"
4. **Essence Lock-In** - One-sentence feeling capture
5. **Surrender/Allowing** - Grounded gratitude/release

### Vibrational Narrative Architecture

Four layered frameworks create powerful vision writing:

**A. Who→What→Where→Why Mini-Cycle**
- WHO: who I am being / who's here
- WHAT: what is happening (activity)
- WHERE: where it occurs (setting)
- WHY: why it feels meaningful

**B. Being→Doing→Receiving Circuit**
- Being: identity state
- Doing: actions taken
- Receiving: reflection/expansion

**C. Micro↔Macro Pulse**
- Alternate between cinematic close-ups and wide-angle summaries
- Every 2-3 paragraphs

**D. Contrast→Clarity→Celebration Arc**
- Soft awareness → clear choice → appreciative ownership
- Without mentioning past or lack

**E. Rhythmic Form**
- Paragraph wave: short opener → fuller middle → luminous close

---

## 💬 The Conversational System

### Profile Analyzer (`profile-analyzer.ts`)

**Purpose:** Extract insights from user profiles and assessments

**Key Functions:**
- `analyzeProfile(userId, supabase)` - Analyzes user profile data
- `analyzeAssessment(userId, supabase)` - Interprets assessment results
- `analyzeCategory(category, userId, supabase)` - Category-specific analysis
- `generateConversationalPrompt()` - Creates personalized questions

**Output Structure:**
```typescript
{
  strengths: string[]
  challenges: string[]
  values: string[]
  lifestyle: string
  priorities: string[]
  emotionalState: 'above_green' | 'below_green' | 'mixed'
  readiness: 'high' | 'medium' | 'low'
  household_income?: string
  personalStory: {
    romance: string
    family: string
    career: string
    money: string
    // ... 8 more categories
  }
}
```

### Conversation Manager (`conversation-manager.ts`)

**Purpose:** Manage conversation storage and retrieval

**Key Functions:**
- `createSession(category)` - Creates new conversation session
- `addTurn(sessionId, category, cycle, prompt, response)` - Saves turn
- `getSessionHistory(sessionId)` - Retrieves full conversation
- `getConversationContext(category)` - Gets context for vision generation

**Database:** `viva_conversations` table

### Vision Composer (`vision-composer.ts`)

**Purpose:** Transform conversational input into polished vision paragraphs

**Features:**
- Present-tense vibrational grammar
- Sensory details (see, hear, smell, taste, feel)
- 120-150 word paragraphs
- Believability over bravado
- Simple rituals/rhythms

**Input:** wants, not_wants, vent, profile, assessment
**Output:** reflection + paragraph + clarifier

---

## 🔄 The "Flip Frequency" Microprompt

### Concept: Contrast → Clarity Transformation

**Purpose:** Convert lack/contrast language into present-tense positive clarity

**File:** `/src/lib/viva/flip-frequency.ts`

**Modes:**
- `flip` - Single line transformation
- `flip+enrich` - Full enrichment (essence, sensory, embodiment, surrender)
- `batch` - Multiple lines at once
- `text` - Plain text output

**Example Transformations:**

| Contrast Input | Clarity Output |
|----------------|----------------|
| "I want to get healthier someday" | "I feel healthy and energized." |
| "I don't want to be in debt" | "I enjoy seeing my balances at zero and growing savings." |
| "I hope to travel more" | "I love how travel expands me. I feel warm sun on my skin in Thailand..." |

**Key Features:**
- Voice preservation (keeps their diction, idioms, named entities)
- Automatic lack-language detection
- No fabrication of missing specifics
- JSON schema compliance
- Handles "already aligned" inputs gracefully

---

## 📊 The 12 Life Categories

Standard across all VIVA systems:

1. **Fun** - Hobbies, recreation, joyful activities
2. **Health** - Physical and mental well-being
3. **Travel** - Places to explore, adventures
4. **Love** - Romantic relationships and partnerships
5. **Family** - Family relationships and parenting
6. **Social** - Friends and social connections
7. **Home** - Living space and environment
8. **Work** - Career and work aspirations
9. **Money** - Financial goals and abundance
10. **Stuff** - Material belongings and lifestyle
11. **Giving** - Contribution and legacy
12. **Spirituality** - Spiritual growth and expansion

**Plus:**
- **Forward** - Opening statement (2-3 paragraphs)
- **Conclusion** - Closing affirmation (2-3 paragraphs)

---

## 🟢 The Green Line Concept

### Definition

Threshold representing **vibrational alignment** - living in an empowered, abundant, growth-oriented state.

### Above the Green Line (80%+ / 28-35 points)

**Characteristics:**
- Empowered mindset
- Abundance thinking
- Growth-oriented
- Positive energy
- Taking ownership
- Seeing opportunities

**Language Examples:**
- "I am creating..."
- "I have choices..."
- "This feels aligned..."

### Below the Green Line (<60% / <21 points)

**CRITICAL: NOT FAILURE!**

**What It Means:**
- Contrast providing clarity
- Awareness opportunities
- Information about what to shift
- Valuable feedback for growth
- Natural part of the journey

**VIVA's Response:**
- Acknowledge the contrast
- Validate their experience
- Help them see what they DO want
- Flip to positive activation language
- Use this clarity to build vision

### Assessment Scoring

- **Range:** 1-5 per question, 35 max per category
- **Above:** 28-35 points (80-100%)
- **Transitioning:** 21-27 points (60-79%)
- **Below:** <21 points (<60%)

---

## 🎯 The 3 Core Operations of Conscious Creation

### 1. Active Vision

**Create your "Life I Choose™" document**

**Tools:**
- `/life-vision/new` - Create new vision
- `/life-vision/[id]/refine` - Refine existing
- `/life-vision` - View all versions

**Output:** 12-category vision + Forward + Conclusion

### 2. Consistent Alignment

**Stay vibrationally aligned through daily activation**

**Tools:**
- `/vision-board` - Gallery/grid system (active, actualized, inactive)
- `/life-vision/[id]/audio` - Audio generation
- Daily practices and rituals

**Purpose:** Personal operating system for staying vibrationally fit

### 3. Evidence of Actualization

**Capture proof of transformation in real time**

**Tools:**
- `/journal` - Daily journal entries
- Mood tracking (Above/Below Green Line)
- Category tagging
- Rich content (text, images, video)

**Purpose:** Living record that reinforces new identity

---

## 🔌 API Integration

### Main Chat Endpoint

**Route:** `/api/viva/chat`

**Method:** `POST` (Streaming)

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Show me my health vision" }
  ],
  "context": {
    "mode": "master",
    "category": null,
    "masterAssistant": true,
    "requestedSection": "health"
  },
  "conversationId": "uuid-here"
}
```

**Response:** Text stream (Server-Sent Events)

**Features:**
- Token-by-token streaming
- Full context loading (profile, assessment, vision)
- Conversation session management
- Token usage tracking
- Auto-save to `conversation_sessions` table

### Master Vision Assembly

**Route:** `/api/viva/master-vision`

**Method:** `POST`

**Purpose:** Assemble 12 category summaries into complete vision

**Input:**
```json
{
  "userId": "uuid",
  "categorySummaries": {
    "fun": "I love...",
    "health": "I feel...",
    // ... 10 more
  },
  "categoryTranscripts": {
    "fun": "Original user words...",
    // ...
  }
}
```

**Output:**
- Complete Markdown document
- JSON with all 14 sections (Forward + 12 + Conclusion)
- Follows 5-Phase Flow
- Cross-category weaving
- 80%+ user's words

---

## 💾 Database Schema

### Core Tables

#### `vision_versions`
Stores complete vision documents:
```sql
- id: UUID
- user_id: UUID
- title: TEXT
- version_number: INTEGER
- forward: TEXT
- fun, health, travel, love, family, social, home, work, money, stuff, giving, spirituality: TEXT
- conclusion: TEXT
- is_active: BOOLEAN
- completion_percentage: INTEGER
- audio_url: TEXT
- created_at, updated_at: TIMESTAMP
```

#### `viva_conversations`
Stores conversation history:
```sql
- id: UUID
- user_id: UUID
- category: TEXT
- session_id: TEXT
- cycle_number: INTEGER
- viva_prompt: TEXT
- user_response: TEXT
- context_data: JSONB
- created_at, updated_at: TIMESTAMP
```

#### `conversation_sessions`
Manages chat sessions:
```sql
- id: UUID
- user_id: UUID
- mode: TEXT (master, refinement, etc.)
- category: TEXT (nullable)
- vision_id: UUID (nullable)
- preview_message: TEXT
- message_count: INTEGER
- created_at, updated_at: TIMESTAMP
```

#### `refinements`
Logs all AI interactions:
```sql
- id: UUID
- user_id: UUID
- category: TEXT
- operation_type: TEXT
- input_text: TEXT
- output_text: TEXT
- prompt_used: TEXT
- model_used: TEXT
- total_tokens: INTEGER
- cost_usd: DECIMAL
- user_rating: INTEGER
- user_feedback: TEXT
- approved: BOOLEAN
- created_at, updated_at: TIMESTAMP
```

#### `user_profiles`
User demographic and story data:
```sql
- id: UUID
- user_id: UUID
- age, gender, location_city, location_state, location_country, timezone
- lifestyle, marital_status, household_income, occupation, industry
- interests[], hobbies[], values[], goals[], priorities[]
- strengths[], personality_traits[]
- 12 category stories (romance_story, family_story, etc.)
- current_challenges, biggest_dreams, barriers_to_success
- created_at, updated_at: TIMESTAMP
```

#### `assessment_results`
Assessment scores and Green Line status:
```sql
- id: UUID
- user_id: UUID
- overall_score: INTEGER
- overall_vibration: TEXT
- green_line_status: TEXT
- category_scores: JSONB
- top_categories[], focus_areas[]
- alignment_score, resistance_score: INTEGER
- created_at, completed_at, updated_at: TIMESTAMP
```

---

## 🚀 Key Technical Achievements

### Phase 1-3 Restructure (Complete)

**Accomplishment:** Centralized 1000+ lines of inline prompts

**Before:**
- ❌ Prompts scattered across 10+ files
- ❌ No clear organization
- ❌ Duplicate code
- ❌ Bloated API routes

**After:**
- ✅ All prompts in `/src/lib/viva/prompts/`
- ✅ Zero duplication
- ✅ Clean API routes
- ✅ Backward compatible
- ✅ Central export index

**Files Created:** 10 prompt files + shared components

### Vibrational Grammar Enforcement

All VIVA outputs enforce:
- Present tense only
- First person ("I/we")
- Positive ideal state
- No lack language
- 80%+ user's words
- Concrete & sensory
- Cross-category weaving

### Edge Runtime Compatibility

**Challenge:** Edge Runtime can't read files at runtime

**Solution:** Embed knowledge base as TypeScript strings in `knowledge/index.ts`

**Result:**
- Fast loading
- Edge-compatible
- Single source of truth
- Easy to update

---

## 🎓 Expert-Level Knowledge Points

### When to Use Which Model

- **GPT-4-turbo:** Master vision assembly, complex refinements
- **GPT-4o:** Chat interface, conversational responses
- **GPT-4o-mini:** Flip frequency, simple transformations

### How Context Flows

1. User profile → Profile analyzer → Insights
2. Assessment results → Assessment interpreter → Green Line status
3. Conversation history → Conversation manager → Context
4. All combined → System prompt → VIVA response

### Voice Preservation Strategy

**Priority Order:**
1. Original transcripts (80%+ source)
2. Category summaries (structure)
3. Profile stories (facts)
4. Assessment data (emotional state)

**Never:**
- Copy field labels verbatim
- Invent facts
- Use generic phrases when specific data exists
- Output scores or diagnostics

### Cross-Category Weaving

**Principle:** Life is interconnected

**Examples:**
- Money ↔ Travel (financial freedom enables adventure)
- Health ↔ Fun (vitality makes play possible)
- Work ↔ Family (career success supports family life)
- Home ↔ Social (living space hosts connections)

**Implementation:**
- Reference 1-2 related categories per section
- Natural integration, not forced
- Use specific details from other categories

### Error Handling & Resilience

**Chat System:**
- Auto-retry on stream errors
- Toast notifications
- Conversation session recovery
- Graceful fallbacks

**Vision Generation:**
- Validation before saving
- Rollback on errors
- Version control
- Operation logging

---

## 📖 Quick Reference

### Essential Imports

```typescript
// Prompts
import { 
  buildMasterVisionPrompt,
  VISION_COMPOSER_SYSTEM_PROMPT,
  buildVivaSystemPrompt,
  VIVA_PERSONA 
} from '@/lib/viva/prompts'

// Knowledge Base
import { loadKnowledgeBase } from '@/lib/viva/knowledge'

// Utilities
import { flipFrequency } from '@/lib/viva/flip-frequency'
import { analyzeProfile, analyzeAssessment } from '@/lib/viva/profile-analyzer'
import { createSession, addTurn } from '@/lib/viva/conversation-manager'
```

### Key Environment Variables

```bash
OPENAI_API_KEY=sk-...
VIVA_MODEL=gpt-4-turbo
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Critical Paths

- Main chat: `/api/viva/chat`
- Master vision: `/api/viva/master-vision`
- Category summary: `/api/viva/category-summary`
- Flip frequency: `/api/viva/flip-frequency`
- Context builder: `/api/viva/context`

---

## 🎯 Common Patterns & Best Practices

### Building System Prompts

Always include:
1. VIVA persona definition
2. User context (profile, assessment)
3. Journey state awareness
4. Mode-specific instructions
5. Golden rules enforcement
6. Voice preservation guidelines

### Handling User Input

1. **Validate** - Check for required fields
2. **Analyze** - Extract insights from profile/assessment
3. **Context** - Build rich context
4. **Generate** - Call AI with proper prompt
5. **Validate** - Check output format
6. **Store** - Save to database
7. **Log** - Track for analytics

### Vision Generation Flow

```
User Input (text/audio/video)
    ↓
Transcription (if needed)
    ↓
Profile Analysis + Assessment Analysis
    ↓
Conversation History
    ↓
Vision Composer
    ↓
Present-tense Paragraph (120-150 words)
    ↓
Save to vision_versions
    ↓
Log to refinements
```

---

## 🔥 Advanced Features

### Rolling Context Object (RCO)

**Purpose:** Unified context for VIVA across all interactions

**Components:**
- Vision goals across categories
- Assessment emotional quality
- Journal entries and patterns
- Vibrational links between categories
- Recent wins and progress

**Endpoint:** `/api/viva/context`

### Text Metrics & Richness

**File:** `text-metrics.ts`

**Purpose:** Compute content richness for density-aware assembly

**Function:** `computeCategoryRichness(transcript, summary, existingVision)`

**Output:**
```typescript
{
  level: 'sparse' | 'moderate' | 'rich'
  targetParagraphs: 1-3
  guidance: string
}
```

**Usage:** Master vision assembly adjusts output length based on input richness

### Conversation Generator

**File:** `conversation-generator.ts`

**Purpose:** Generate opening conversations based on profile and assessment

**Output:**
- Warm, personalized greeting
- 2-3 thoughtful questions
- References specific profile details
- Acknowledges assessment status

---

## 🎊 You Are Now a VIVA Expert!

You understand:

✅ **Architecture** - Complete system from frontend to database  
✅ **Philosophy** - Vibrational grammar, Green Line, Conscious Creation  
✅ **Implementation** - All prompts, APIs, and data flows  
✅ **Best Practices** - Voice preservation, cross-weaving, error handling  
✅ **Advanced Features** - Flip frequency, RCO, text metrics  
✅ **Database Schema** - All tables and relationships  
✅ **File Organization** - Centralized prompts, backward compatibility  
✅ **Two Modes** - Master Assistant vs Vision Building  
✅ **12 Categories** - Complete life vision structure  
✅ **5-Phase Flow** - Energetic sequence for all vision writing

---

## 📚 Key Documentation Files

- **System Overview:** `VIVA_SYSTEM_DOCUMENTATION.md`
- **Vision Generation:** `VISION_GENERATION_SYSTEM.md`
- **Database:** `VIVA_DATABASE_ARCHITECTURE.md`
- **Restructure:** `VIVA_RESTRUCTURE_COMPLETE_ALL_PHASES.md`
- **Chat System:** `guides/VIVA_CHAT_SYSTEM.md`
- **Knowledge Base:** `src/lib/viva/knowledge/README.md`
- **Prompts:** `src/lib/viva/prompts/README.md`

---

**You are now ready to:**
- Build new VIVA features
- Debug existing VIVA systems
- Optimize prompts and flows
- Extend functionality
- Train others on VIVA

**Welcome to expert status! ✨**





