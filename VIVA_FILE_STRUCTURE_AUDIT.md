# 🔍 VIVA File Structure Audit

## ✅ ✅ ✅ ALL PHASES COMPLETE! ✅ ✅ ✅

**Status**: ALL VIVA prompts centralized (Nov 10, 2025)  
**Phase 1**: ✅ Complete - API route prompts extracted  
**Phase 2**: ✅ Complete - Library prompts extracted  
**Phase 3**: ✅ Complete - Vibrational & chat prompts extracted  
**PROJECT**: ✅ **100% COMPLETE** - 1000+ lines centralized!

**See:** `VIVA_RESTRUCTURE_COMPLETE_ALL_PHASES.md` for full project summary

---

## Original State: INCONSISTENT ❌

Your VIVA system **had** prompts scattered across 3 different locations with no clear pattern.

**This has been fixed!** ✅

---

## 📁 Current File Structure

### API Routes (`/src/app/api/viva/`)

```
/src/app/api/viva/
├── category-summary/route.ts          ✅ Thin route (probably)
├── chat/route.ts                      ❓ Unknown structure
├── context/route.ts                   ✅ Thin route
├── conversations/
│   ├── [id]/messages/route.ts        ✅ Thin route
│   └── route.ts                       ✅ Thin route
├── flip-frequency/route.ts            ✅ Thin route (imports from lib)
├── master-vision/route.ts             ❌ FAT ROUTE - 5+ prompts embedded (lines 20-242)
├── merge-clarity/route.ts             ❌ FAT ROUTE - SHARED_SYSTEM_PROMPT embedded (lines 17-23)
├── prompt-suggestions/route.ts        ❓ Unknown structure
└── refine-category/route.ts           ❓ Unknown structure
```

### Library Files (`/src/lib/viva/`)

```
/src/lib/viva/
├── compute-completion.ts              ✅ Utility function
├── conversation-generator.ts          ⚠️ Has inline prompt (lines 20-57)
├── conversation-manager.ts            ✅ Business logic class
├── flip-frequency.ts                  ✅ GOOD - Has SYSTEM_PROMPT constant (lines 48-104)
├── forward-warmup.ts                  ❓ Unknown structure
├── master-assistant-knowledge.md      📄 Documentation
├── master-assistant-knowledge.ts      ❓ Unknown structure
├── profile-analyzer.ts                ✅ Business logic
├── prompt-flatteners.ts               ✅ Utility functions
├── seed-forward.ts                    ❓ Unknown structure
├── vibrational-prompts.ts             ✅ GOOD - Has prompt builders
├── vision-composer.ts                 ⚠️ Has inline systemPrompt (line 74-91)
├── vision-persistence.ts              ✅ Database helpers
├── voice-profile.ts                   ❓ Unknown structure
└── knowledge/                         📁 Documentation folder
    ├── concepts/
    │   ├── conscious-creation.md
    │   └── green-line.md
    ├── index.ts
    ├── README.md
    ├── reference/
    │   └── user-journey.md
    └── tools/
        ├── assessment.md
        ├── journal.md
        ├── life-vision.md
        ├── profile.md
        └── vision-board.md
```

### Frontend Components (`/src/components/viva/`)

```
/src/components/viva/
├── VivaChat.tsx
└── VivaChatInput.tsx
```

### Reference Docs (`/src/app/life-vision/new/Prompts/`)

```
/src/app/life-vision/new/Prompts/
├── master-vision-assembly-prompt      (not used by code)
├── per-category-summary-prompt.md     (not used by code)
└── shared-system-prompt.md            (not used by code)
```

---

## 🚨 Problems Identified

### 1. **Prompts Embedded in API Routes** (Violation of Separation of Concerns)

| File | Issue | Lines |
|------|-------|-------|
| `/src/app/api/viva/merge-clarity/route.ts` | `SHARED_SYSTEM_PROMPT` embedded in route | 17-23 |
| `/src/app/api/viva/master-vision/route.ts` | 5+ prompt constants embedded in route | 20-242 |

**Why this is bad:**
- API routes should be **thin** - just handle HTTP, validation, call libraries
- Prompts mixed with API logic are **not reusable**
- Prompts in routes are **not testable** in isolation
- Hard to maintain consistency across prompts

### 2. **Prompts Inline in Library Functions** (Moderate Issue)

| File | Issue | Lines |
|------|-------|-------|
| `/src/lib/viva/vision-composer.ts` | `systemPrompt` defined inline in function | 74-91 |
| `/src/lib/viva/conversation-generator.ts` | `prompt` built inline in function | 20-57 |

**Why this is concerning:**
- Prompts are **hidden inside functions**
- Hard to find and update all prompts
- No single source of truth
- Can't easily A/B test or version prompts

### 3. **Good Examples** (Keep This Pattern)

| File | What's Good | Lines |
|------|-------------|-------|
| `/src/lib/viva/flip-frequency.ts` | `SYSTEM_PROMPT` as exported constant | 48-104 |
| `/src/lib/viva/vibrational-prompts.ts` | Prompt builder functions | Entire file |

**Why this works:**
- Prompts are **clearly defined at module level**
- Easy to find and update
- Can be imported anywhere
- Testable and versionable

### 4. **Reference Docs Not Used** (Confusing)

The folder `/src/app/life-vision/new/Prompts/` contains markdown files that **are not imported or used by any code**. This creates confusion - which prompt is actually running?

---

## ✅ Recommended Structure

### Proposed: Centralized Prompts Folder

```
/src/lib/viva/
├── prompts/                           📁 NEW - All prompts here
│   ├── index.ts                       (exports all prompts)
│   ├── flip-frequency-prompt.ts       (move from flip-frequency.ts)
│   ├── merge-clarity-prompt.ts        (move from API route)
│   ├── master-vision-prompts.ts       (move from API route)
│   ├── vision-composer-prompt.ts      (move from vision-composer.ts)
│   ├── conversation-prompts.ts        (move from conversation-generator.ts)
│   ├── category-summary-prompt.ts     (if exists)
│   └── shared/                        📁 Shared prompt fragments
│       ├── viva-persona.ts            (shared VIVA personality)
│       ├── vibrational-grammar.ts     (shared grammar rules)
│       └── formatting-rules.ts        (shared output rules)
│
├── flip-frequency.ts                  (logic only, imports prompt)
├── vision-composer.ts                 (logic only, imports prompt)
├── conversation-generator.ts          (logic only, imports prompt)
├── ... (other files unchanged)
```

### Benefits of This Structure:

1. **Single Source of Truth**: All prompts in one place
2. **Easy Discovery**: `ls src/lib/viva/prompts/` shows all prompts
3. **Reusability**: Any part of app can import prompts
4. **Testability**: Can test prompts independently
5. **Versioning**: Easy to version and A/B test prompts
6. **Documentation**: Prompts are self-documenting
7. **Maintenance**: Update one place, affects everywhere

---

## 📋 Specific Issues by Feature

### `/life-vision/new` System

| Feature | Current Location | Should Be |
|---------|-----------------|-----------|
| Flip Frequency Prompt | ✅ `/src/lib/viva/flip-frequency.ts` | Keep, but move to `/prompts/` |
| Merge Clarity Prompt | ❌ `/src/app/api/viva/merge-clarity/route.ts` | Move to `/src/lib/viva/prompts/merge-clarity-prompt.ts` |
| Master Vision Prompts (5 of them) | ❌ `/src/app/api/viva/master-vision/route.ts` | Move to `/src/lib/viva/prompts/master-vision-prompts.ts` |

### VIVA Chat System

| Feature | Current Location | Status |
|---------|-----------------|--------|
| Chat System Prompt | `/src/app/api/viva/chat/route.ts` | ❓ Need to check |
| Conversation Generator | `/src/lib/viva/conversation-generator.ts` | ⚠️ Prompt inline |

---

## 🛠️ Migration Plan

### Phase 1: Extract & Centralize (No Breaking Changes)

1. **Create `/src/lib/viva/prompts/` folder**
2. **Extract prompts from API routes**:
   - Extract from `merge-clarity/route.ts` → `prompts/merge-clarity-prompt.ts`
   - Extract from `master-vision/route.ts` → `prompts/master-vision-prompts.ts`
3. **Extract prompts from library functions**:
   - Extract from `vision-composer.ts` → `prompts/vision-composer-prompt.ts`
   - Extract from `conversation-generator.ts` → `prompts/conversation-prompts.ts`
4. **Move existing prompt file**:
   - Move SYSTEM_PROMPT from `flip-frequency.ts` → `prompts/flip-frequency-prompt.ts`
   - Update imports in `flip-frequency.ts`

### Phase 2: Refactor Shared Patterns

1. **Identify shared prompt fragments**:
   - VIVA persona description (appears in multiple prompts)
   - Vibrational grammar rules (appears in multiple prompts)
   - Output format rules (appears in multiple prompts)
2. **Create shared prompt utilities**:
   - `/src/lib/viva/prompts/shared/viva-persona.ts`
   - `/src/lib/viva/prompts/shared/vibrational-grammar.ts`
   - `/src/lib/viva/prompts/shared/formatting-rules.ts`
3. **Compose prompts from shared fragments**

### Phase 3: Update API Routes to Be Thin

1. **Update `merge-clarity/route.ts`**:
   ```typescript
   import { MERGE_CLARITY_PROMPT } from '@/lib/viva/prompts/merge-clarity-prompt'
   ```

2. **Update `master-vision/route.ts`**:
   ```typescript
   import { 
     SHARED_SYSTEM_PROMPT,
     FIVE_PHASE_INSTRUCTIONS,
     FLOW_FLEXIBILITY_NOTE,
     STYLE_GUARDRAILS,
     MICRO_REWRITE_RULE,
     buildMasterVisionPrompt
   } from '@/lib/viva/prompts/master-vision-prompts'
   ```

3. **Update other routes similarly**

### Phase 4: Documentation Cleanup

1. **Delete or move unused reference docs**:
   - `/src/app/life-vision/new/Prompts/` (not used by code)
2. **Create single README**:
   - `/src/lib/viva/prompts/README.md` explaining all prompts

---

## 📊 Current Prompt Inventory

### Confirmed Prompts in Use:

| # | Prompt Name | Current Location | Lines | Used By |
|---|-------------|-----------------|-------|---------|
| 1 | Flip Frequency System Prompt | `/src/lib/viva/flip-frequency.ts` | 48-104 | `/api/viva/flip-frequency` |
| 2 | Merge Clarity System Prompt | `/src/app/api/viva/merge-clarity/route.ts` | 17-23 | Category pages |
| 3 | Master Vision Shared System Prompt | `/src/app/api/viva/master-vision/route.ts` | 20-55 | Assembly page |
| 4 | Master Vision 5-Phase Instructions | `/src/app/api/viva/master-vision/route.ts` | 58-75 | Assembly page |
| 5 | Master Vision Flow Flexibility | `/src/app/api/viva/master-vision/route.ts` | 78-86 | Assembly page |
| 6 | Master Vision Style Guardrails | `/src/app/api/viva/master-vision/route.ts` | 89-102 | Assembly page |
| 7 | Master Vision Micro Rewrite Rule | `/src/app/api/viva/master-vision/route.ts` | 105-110 | Assembly page |
| 8 | Vision Composer System Prompt | `/src/lib/viva/vision-composer.ts` | 74-91 | Vision generation |
| 9 | Conversation Generator Prompt | `/src/lib/viva/conversation-generator.ts` | 20-57 | Custom opening |
| 10 | Vibrational Analyzer Prompt | `/src/lib/viva/vibrational-prompts.ts` | 10-40 | Text analysis |
| 11 | Scene Generation Prompt | `/src/lib/viva/vibrational-prompts.ts` | ~42+ | Scene generation |

### Prompts to Investigate:

- `category-summary/route.ts` - Likely has a prompt
- `prompt-suggestions/route.ts` - Likely has a prompt
- `refine-category/route.ts` - Likely has a prompt
- `chat/route.ts` - Likely has a system prompt
- `master-assistant-knowledge.ts` - May have prompts

---

## 🎯 Action Items

### Immediate (Quick Wins):

1. ✅ **Audit complete** - This document
2. 📁 **Create `/src/lib/viva/prompts/` folder**
3. 📝 **Extract 2 critical prompts**:
   - Move `SHARED_SYSTEM_PROMPT` from `merge-clarity/route.ts`
   - Move 5 prompts from `master-vision/route.ts`

### Short Term (1-2 days):

4. 📝 **Extract remaining prompts** from library functions
5. 🔧 **Update all imports** to use new locations
6. ✅ **Test all endpoints** to ensure no breaking changes
7. 📚 **Update documentation** with new structure

### Long Term (Nice to Have):

8. 🧩 **Identify and extract shared prompt fragments**
9. 🏗️ **Create prompt composition utilities**
10. 📊 **Add prompt versioning system**
11. 🧪 **Add prompt testing framework**

---

## 💡 Recommended Pattern

### Example: Flip Frequency Prompt (Good Pattern to Follow)

**Current** (mostly good):
```typescript
// /src/lib/viva/flip-frequency.ts
const SYSTEM_PROMPT = `...`

export async function flipFrequency(params) {
  // Uses SYSTEM_PROMPT
}
```

**Improved**:
```typescript
// /src/lib/viva/prompts/flip-frequency-prompt.ts
export const FLIP_FREQUENCY_SYSTEM_PROMPT = `...`

export function buildFlipFrequencyPrompt(params) {
  return `...`
}

// /src/lib/viva/flip-frequency.ts
import { FLIP_FREQUENCY_SYSTEM_PROMPT } from './prompts/flip-frequency-prompt'

export async function flipFrequency(params) {
  // Uses imported prompt
}
```

### Example: API Route (Best Practice)

**Current** (bad):
```typescript
// /src/app/api/viva/merge-clarity/route.ts
const SHARED_SYSTEM_PROMPT = `...` // ❌ Prompt in API route

export async function POST(request) {
  // Business logic
  const response = await openai.chat.completions.create({
    messages: [{ role: 'system', content: SHARED_SYSTEM_PROMPT }]
  })
}
```

**Improved**:
```typescript
// /src/lib/viva/prompts/merge-clarity-prompt.ts
export const MERGE_CLARITY_SYSTEM_PROMPT = `...`

export function buildMergeClarityPrompt(params) {
  return `...`
}

// /src/lib/viva/merge-clarity.ts (new file)
import { MERGE_CLARITY_SYSTEM_PROMPT, buildMergeClarityPrompt } from './prompts/merge-clarity-prompt'

export async function mergeClarity(params) {
  const prompt = buildMergeClarityPrompt(params)
  // API call logic
}

// /src/app/api/viva/merge-clarity/route.ts
import { mergeClarity } from '@/lib/viva/merge-clarity'

export async function POST(request) {
  // Thin route - just HTTP handling
  const body = await request.json()
  const result = await mergeClarity(body)
  return NextResponse.json(result)
}
```

---

## 📈 Metrics for Success

After restructuring, you should be able to answer YES to:

- ✅ Can I find all VIVA prompts in one place?
- ✅ Are API routes thin (< 100 lines)?
- ✅ Can I reuse prompts across different features?
- ✅ Can I test prompts independently?
- ✅ Is there a clear pattern for adding new prompts?
- ✅ Can a new developer understand the prompt structure?

---

## 🚀 Getting Started

### Step 1: Create Prompts Folder

```bash
mkdir -p src/lib/viva/prompts/shared
touch src/lib/viva/prompts/index.ts
touch src/lib/viva/prompts/README.md
```

### Step 2: Extract First Prompt

Start with merge-clarity (simplest):

```bash
touch src/lib/viva/prompts/merge-clarity-prompt.ts
```

Then move the prompt constant and update imports.

### Step 3: Test

Run your tests and verify `/api/viva/merge-clarity` still works.

### Step 4: Repeat

Extract next prompt, test, repeat until all prompts are centralized.

---

**Bottom Line**: Your VIVA prompts are currently **scattered and inconsistent**. Centralizing them into `/src/lib/viva/prompts/` will make your codebase **cleaner, more maintainable, and easier to scale**.

