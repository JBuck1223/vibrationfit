# VIVA Chat System 🤖✨

## Overview

The VIVA (Vibrational AI) chat system provides a streaming, conversational interface for building personalized life visions. It integrates user profile data, assessment results, and a 3-phase vision building methodology.

## Architecture

### Frontend Components

#### `VivaChat.tsx` (`/src/components/viva/VivaChat.tsx`)
**Purpose:** Core chat interface with streaming support

**Features:**
- Real-time token-by-token streaming
- Optimistic UI updates
- Auto-scroll to latest message
- Typing indicators
- Inline action buttons (Save, Refine)
- Error handling with toast notifications

**Props:**
```typescript
{
  visionBuildPhase: 'contrast' | 'peak' | 'specific'
  currentCategory?: string
  onSaveVision?: (content: string) => Promise<void>
}
```

#### Vision Build Page (`/src/app/vision/build/page.tsx`)
**Purpose:** Orchestrates the vision building experience

**Features:**
- 3-phase progression (Contrast → Peak → Specific)
- 12 category navigation
- Progress tracking
- Auto-save to database
- Session continuity

### Backend API

#### `/api/viva/chat` (`/src/app/api/viva/chat/route.ts`)
**Purpose:** Streaming AI endpoint with full context

**Functionality:**
- Authenticates user via Supabase
- Fetches assessment data and vision context
- Builds rich system prompt
- Streams GPT-4 responses
- Stores conversation history

**Request:**
```json
{
  "messages": [{"role": "user", "content": "..."}],
  "visionBuildPhase": "contrast",
  "context": {"category": "health"}
}
```

**Response:** Text stream (Server-Sent Events compatible)

## The 3-Phase Vision Building Process

### Phase 1: Contrast Clarity 🔄
**Goal:** Identify what's NOT wanted

**VIVA's Approach:**
- "What specifically feels misaligned in your [category]?"
- Mine the contrast without judgment
- Help articulate what they're moving beyond

**Example Questions:**
- "When you think about your health, what makes you cringe?"
- "What would you love to STOP experiencing in your career?"

### Phase 2: Peak Experience Activation ✨
**Goal:** Remember who they are at their best

**VIVA's Approach:**
- "Tell me about a time you felt absolutely amazing about [category]"
- Anchor to positive emotional states
- Extract the essence of the experience

**Example Questions:**
- "When did you last feel ALIVE in your body?"
- "Describe a moment when money felt easy and flowing"

### Phase 3: Specific Desire Articulation 🎯
**Goal:** Get crystal clear on the desired state

**VIVA's Approach:**
- "Make it so specific you can taste it"
- Push for sensory details
- Check believability (1-10 scale)

**Example Questions:**
- "What does your ideal morning look like, minute by minute?"
- "How much money do you see in your bank account? What date is it?"

## VIVA System Prompt Structure

The system prompt includes:
1. **User Context**
   - Name and basic info
   - Assessment scores (all 12 categories)
   - Categories below/above Green Line
   - Existing vision sections

2. **Phase-Specific Guidance**
   - Current phase objectives
   - Appropriate question types
   - Transition criteria

3. **Communication Rules**
   - Warm, encouraging tone
   - Max 150 words per response
   - One powerful question at a time
   - Present tense language ("I am..." not "I will...")

4. **Techniques**
   - Contrast mining
   - Preference flipping
   - Specificity pushing
   - Believability checking

## Streaming Implementation

### Flow
```
User types message
    ↓
Optimistic UI: Add message instantly
    ↓
POST /api/viva/chat
    ↓
OpenAI GPT-4 stream starts
    ↓
Tokens arrive → Update UI in real-time
    ↓
Complete → Store in database
```

### Performance Targets
- **First token:** < 500ms
- **Typing indicator:** 0ms (instant)
- **Token update rate:** 30-60 FPS
- **Scroll smoothness:** 60 FPS

## UX Patterns (Snappy Guide Implementation)

### 1. Instant Feedback ✅
```typescript
// User sees typing indicator immediately
setIsTyping(true) // 0ms
await handleSubmit(e)
```

### 2. Progressive Streaming ✅
```typescript
// Render tokens as they arrive
while (reader) {
  const chunk = decoder.decode(value)
  assistantMessage += chunk
  setMessages(prev => prev.map(...)) // Update in real-time
}
```

### 3. Optimistic UI ✅
```typescript
// Add user message before API call
setMessages(prev => [...prev, userMessage])
setInput('') // Clear immediately
```

### 4. Background Actions ✅
```typescript
// Save vision without blocking
toast.success('Saving...')
await onSaveVision(content)
toast.success('Saved! ✨')
```

### 5. Persistent Context ✅
```typescript
// Maintain full conversation history
messages: [...messages, userMessage]
```

### 6. Micro Motion ✅
```typescript
// Smooth animations
className="animate-in fade-in slide-in-from-bottom-2 duration-300"
```

## Integration with Assessment

VIVA uses assessment data to personalize the conversation:

```typescript
// Categories below Green Line get extra attention
const belowGreenLine = Object.entries(greenLineStatus)
  .filter(([_, status]) => status === 'below')
  .map(([category]) => category)

// Example: User scored low in "Money"
// VIVA: "I notice money might feel challenging right now. 
//        Let's start by exploring what's NOT working..."
```

## Database Schema (Coming)

Conversations will be stored in:
```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  message TEXT,
  role TEXT, -- 'user' or 'assistant'
  context JSONB, -- {phase, category, etc.}
  created_at TIMESTAMPTZ
);
```

## Testing the Chat

1. Navigate to `/vision/build`
2. Start with Phase 1 (Contrast) in Fun / Recreation
3. Type a message and watch the streaming response
4. Click "Save This" to store vision content
5. Progress through phases and categories

## Key Files

- **API Route:** `src/app/api/viva/chat/route.ts`
- **Chat Component:** `src/components/viva/VivaChat.tsx`
- **Build Page:** `src/app/vision/build/page.tsx`
- **Categories:** `src/lib/design-system/vision-categories.ts`

## Environment Variables Required

```bash
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Dependencies

```json
{
  "ai": "^5.0.68",
  "@ai-sdk/openai": "^2.0.48",
  "sonner": "^1.x", 
  "@supabase/auth-helpers-nextjs": "^0.10.0"
}
```

## Future Enhancements

- [ ] Voice input/output
- [ ] Multi-modal (image understanding)
- [ ] Session persistence (resume conversations)
- [ ] Export conversation as PDF
- [ ] VIVA personality tuning
- [ ] Advanced context injection (journal entries, etc.)

---

**VIVA is ready to help users create their Life Vision through natural, flowing, and deeply personalized conversation.** ✨

