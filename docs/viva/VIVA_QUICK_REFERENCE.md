# VIVA Quick Reference Guide

**Purpose:** Fast lookup for common VIVA tasks and information  
**For:** Developers, Designers, Product Managers  
**Last Updated:** November 16, 2025

---

## 🎯 What is VIVA?

**VIVA** = Vibrational Intelligence Virtual Assistant  
**Role:** AI life coach that helps users create and activate their life vision  
**Voice:** Warm, wise, intuitive (80%+ user's own words)

---

## 🏗️ Quick Architecture

```
Frontend (VivaChat.tsx) 
    ↓ 
API (/api/viva/chat)
    ↓
Prompts (/src/lib/viva/prompts/)
    ↓
Knowledge Base (/src/lib/viva/knowledge/)
    ↓
Database (vision_versions, viva_conversations, etc.)
```

---

## 📂 File Locations

### Prompts (All in One Place)
`/src/lib/viva/prompts/`
- `index.ts` - Central exports
- `master-vision-prompts.ts` - Vision assembly
- `chat-system-prompt.ts` - Chat system
- `category-summary-prompt.ts` - Category summaries
- `vision-composer-prompt.ts` - Paragraph generation
- `flip-frequency-prompt.ts` - Contrast transformation
- `vibrational-prompts.ts` - Vibrational analysis
- `shared/viva-persona.ts` - VIVA personality

### Core Logic
`/src/lib/viva/`
- `profile-analyzer.ts` - Profile insights
- `conversation-manager.ts` - Conversation storage
- `vision-composer.ts` - Vision paragraph creation
- `flip-frequency.ts` - Contrast → Clarity
- `knowledge/index.ts` - Knowledge base

### API Routes
`/src/app/api/viva/`
- `chat/route.ts` - Main chat (streaming)
- `master-vision/route.ts` - Vision assembly
- `category-summary/route.ts` - Category summaries
- `flip-frequency/route.ts` - Contrast transformation
- `refine-category/route.ts` - Category refinement

---

## 🎭 Two Modes

### 1. Master Assistant
- **Purpose:** Platform guide
- **Context:** `{ mode: 'master' }` or `{ masterAssistant: true }`
- **Knows:** All tools, paths, workflows
- **Usage:** General help, navigation, guidance

### 2. Vision Building/Refinement
- **Purpose:** Create/refine vision content
- **Context:** `{ refinement: true }` or vision building phase
- **Focuses:** 12 categories, vibrational grammar
- **Usage:** Vision creation, refinement flows

---

## 🎨 Vibrational Grammar (Quick Rules)

### ✅ DO:
- Present tense ("I am", "I enjoy")
- First person ("I/we")
- Positive framing
- 80%+ user's words
- Concrete & sensory
- Cross-weave categories

### ❌ DON'T:
- "I want", "I will", "I hope"
- "I don't", "I can't", "no longer"
- "but", "however", "even though"
- Comparative language
- Abstract "woo"
- Siloed categories

---

## 📊 The 12 Categories

1. Fun
2. Health
3. Travel
4. Love
5. Family
6. Social
7. Home
8. Work
9. Money
10. Stuff
11. Giving
12. Spirituality

**Plus:** Forward (intro) + Conclusion (outro)

---

## 🟢 Green Line Thresholds

| Status | Score | Percentage | Meaning |
|--------|-------|------------|---------|
| Above | 28-35 | 80-100% | Thriving, aligned |
| Transitioning | 21-27 | 60-79% | Moving toward alignment |
| Below | <21 | <60% | Growth opportunity (NOT failure) |

**Max per category:** 35 points (7 questions × 5 points)

---

## 🔄 The 5-Phase Flow

Every category follows this sequence:

1. **Gratitude Opens** - Begin with appreciation
2. **Sensory Expansion** - Sight, sound, smell, touch, taste
3. **Embodied Lifestyle** - "This is how I live it now"
4. **Essence Lock-In** - One-sentence feeling
5. **Surrender/Allowing** - Grounded gratitude

---

## 💾 Database Tables (Quick Reference)

### `vision_versions`
Complete vision documents (14 sections)

### `viva_conversations`
Conversation history per category/session

### `conversation_sessions`
Chat session management

### `refinements`
AI interaction logs (tokens, cost, quality)

### `user_profiles`
Demographics + 12 category stories

### `assessment_results`
Green Line status + category scores

---

## 🔌 API Quick Reference

### Chat Endpoint
```typescript
POST /api/viva/chat
{
  messages: Message[],
  context: { mode, category, masterAssistant },
  conversationId?: string
}
// Response: Text stream
```

### Master Vision
```typescript
POST /api/viva/master-vision
{
  categorySummaries: Record<string, string>,
  categoryTranscripts: Record<string, string>
}
// Response: Complete vision JSON + Markdown
```

### Flip Frequency
```typescript
POST /api/viva/flip-frequency
{
  mode: 'flip' | 'flip+enrich' | 'batch' | 'text',
  input?: string,
  lines?: string[]
}
// Response: Clarity seeds
```

---

## 📦 Common Imports

```typescript
// Prompts
import { 
  buildMasterVisionPrompt,
  buildVivaSystemPrompt,
  VIVA_PERSONA 
} from '@/lib/viva/prompts'

// Knowledge
import { loadKnowledgeBase } from '@/lib/viva/knowledge'

// Utilities
import { flipFrequency } from '@/lib/viva/flip-frequency'
import { analyzeProfile } from '@/lib/viva/profile-analyzer'
```

---

## 🎯 Common Tasks

### Create New Prompt
1. Add file to `/src/lib/viva/prompts/[name]-prompt.ts`
2. Export from `/src/lib/viva/prompts/index.ts`
3. Import in API route or library function
4. Update `prompts/README.md`

### Update Knowledge Base
1. Edit embedded strings in `/src/lib/viva/knowledge/index.ts`
2. Update corresponding markdown file in `knowledge/[category]/`
3. Update version/date
4. Test VIVA responses

### Add New API Route
1. Create in `/src/app/api/viva/[name]/route.ts`
2. Import prompts from centralized location
3. Add error handling
4. Log to refinements table
5. Test with Postman/curl

---

## 🔥 Key Principles

1. **Voice Preservation:** 80%+ user's words
2. **Present Tense:** Always "I am", never "I will"
3. **Cross-Weaving:** Categories are interconnected
4. **Contrast = Clarity:** Below Green Line is valuable data
5. **Edge Compatible:** Embed knowledge as strings
6. **Centralized Prompts:** Single source of truth
7. **No Lack Language:** Flip to positive always

---

## ⚡ Performance Tips

- Use `gpt-4o-mini` for simple tasks (flip frequency)
- Use `gpt-4o` for chat (streaming)
- Use `gpt-4-turbo` for complex assembly (master vision)
- Load context in parallel (Promise.all)
- Stream responses for better UX
- Cache prompt suggestions

---

## 🚨 Common Gotchas

1. **Edge Runtime:** Can't read files - embed as strings
2. **Backward Compatibility:** Use re-exports when moving files
3. **Voice Preservation:** Don't rewrite - reframe
4. **Category Names:** Map old names (romance→love, business→work, possessions→stuff)
5. **Vision Detection:** Check multiple criteria (status, completion %, content)
6. **Session Management:** Always pass conversationId after first message

---

## 📞 Need Help?

**Documentation:**
- Expert Summary: `docs/viva/VIVA_EXPERT_SUMMARY.md`
- System Docs: `docs/viva/VIVA_SYSTEM_DOCUMENTATION.md`
- Restructure: `docs/viva/VIVA_RESTRUCTURE_COMPLETE_ALL_PHASES.md`

**Code:**
- Prompts: `/src/lib/viva/prompts/`
- Knowledge: `/src/lib/viva/knowledge/`
- API Routes: `/src/app/api/viva/`

---

**Quick Start:** Read this → Expert Summary → Dive into code

**You're ready to work with VIVA! ⚡**




