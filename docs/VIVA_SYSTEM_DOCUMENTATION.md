# VIVA Conversational Vision Generation System
## Complete Technical Documentation

**Version:** 1.0  
**Last Updated:** January 28, 2025

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [Conversation Storage](#conversation-storage)
5. [Implementation Details](#implementation-details)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

---

## System Overview

VIVA is a conversational AI system that helps users build their life vision through natural, warm conversations that leverage their profile and assessment data. Instead of asking generic questions, VIVA uses personal data to craft customized conversation flows.

### Key Features

- **Profile-Aware**: Uses 70+ fields from user profiles
- **Assessment-Informed**: Incorporates assessment scores and green line status
- **Conversational**: 2-3 cycles of warm questions before generating vision
- **Context-Rich**: Stores full conversation history for vision generation
- **Personalized**: Each question is tailored to the user's specific data

---

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    VIVA System Architecture                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Profile     │────▶│  Assessment  │────▶│ Conversation │
│  Analyzer    │     │  Interpreter │     │  Manager     │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       └────────────────────┴─────────────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ Vision Generator │
                   └──────────────────┘
```

### 1. Profile Analyzer (`src/lib/viva/profile-analyzer.ts`)

**Purpose**: Extracts insights from user profiles and assessments

**Key Functions**:
- `analyzeProfile(userId, supabase)`: Analyzes user profile data
- `analyzeAssessment(userId, supabase)`: Interprets assessment results
- `analyzeCategory(category, userId, supabase)`: Category-specific analysis
- `generateConversationalPrompt()`: Creates conversational questions

**Output**:
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

### 2. Conversation Manager (`src/lib/viva/conversation-manager.ts`)

**Purpose**: Manages conversation storage and retrieval

**Key Functions**:
- `createSession(category)`: Creates new conversation session
- `addTurn(sessionId, category, cycle, prompt, response)`: Saves conversation turn
- `getSessionHistory(sessionId)`: Retrieves full conversation
- `getConversationContext(category)`: Gets context for vision generation

**Database Schema** (`viva_conversations`):
```sql
CREATE TABLE viva_conversations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    category TEXT NOT NULL,
    session_id TEXT NOT NULL,
    cycle_number INTEGER NOT NULL,
    viva_prompt TEXT NOT NULL,
    user_response TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 3. Vision Builder Component (`src/components/VisionBuilder.tsx`)

**Purpose**: Manages the UI flow and user interaction

**Flow**:
1. User enters category
2. Starts conversation with VIVA
3. 2-3 cycles of questions/answers
4. Conversation completes
5. Vision generated from context
6. Moves to next category

---

## Data Flow

### Complete Conversation Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Conversation Lifecycle                     │
└──────────────────────────────────────────────────────────────┘

1. USER ARRIVES AT CATEGORY
   │
   ▼
2. START CONVERSATION API CALL
   │
   ├─ Create session ID
   ├─ Load profile + assessment data
   ├─ Generate Cycle 1 prompt (profile-based)
   └─ Store first turn
   │
   ▼
3. USER SEES WARM QUESTION
   "I can see you're a successful entrepreneur..."
   │
   ▼
4. USER RESPONDS
   │
   ▼
5. CONTINUE CONVERSATION API CALL
   │
   ├─ Store user response
   ├─ Generate Cycle 2 prompt (assessment-based)
   └─ Store second turn
   │
   ▼
6. USER SEES FOLLOW-UP QUESTION
   "I can see from your assessment that..."
   │
   ▼
7. USER RESPONDS AGAIN
   │
   ▼
8. CONTINUE CONVERSATION API CALL
   │
   ├─ Store user response
   ├─ Generate Cycle 3 prompt (vision synthesis)
   └─ Store third turn
   │
   ▼
9. CONVERSATION COMPLETE
   │
   ▼
10. GENERATE VISION API CALL
    │
    ├─ Retrieve full conversation context
    ├─ Generate vision from conversation
    ├─ Update vision_versions table
    └─ Log to refinements table
    │
    ▼
11. MOVE TO NEXT CATEGORY
```

---

## Conversation Storage

### How Context Is Stored

Each conversation turn is stored in the `viva_conversations` table:

```sql
INSERT INTO viva_conversations (
    user_id,
    category,
    session_id,
    cycle_number,
    viva_prompt,
    user_response
) VALUES (
    'user-123',
    'money',
    'viva_money_1234567890_abc123',
    1,
    'I can see you''re a successful entrepreneur...',
    'I feel confident about my income...'
);
```

### Retrieving Context

For vision generation, the full conversation is retrieved:

```typescript
const context = await conversationManager.getConversationContext('money')
// Returns:
// "VIVA: I can see you're a successful entrepreneur...
// User: I feel confident about my income...
// VIVA: I can see from your assessment that...
// User: I love the freedom..."
```

---

## Implementation Details

### Profile-Based Questions (Cycle 1)

For **Money** category:
```typescript
if (profileInsights.lifestyle === 'successful entrepreneur') {
  return `I can see you're a successful entrepreneur - that's amazing! 
  Tell me, what's your relationship with money like these days? 
  How does it feel when you think about your financial life?`
}
```

For **Health** category:
```typescript
if (profileInsights.strengths.includes('health-conscious lifestyle')) {
  return `I can see you're already health-conscious - that's wonderful! 
  What's your relationship with your body and wellness like right now?`
}
```

### Assessment-Based Follow-ups (Cycle 2)

For **Money** category (score: 85%):
```typescript
if (categoryScore >= 80) {
  return `I can see from your assessment that you're really thriving 
  in money - that's wonderful! What aspects of this area bring you 
  the most joy? What's working really well?`
}
```

For **Health** category (score: 45%):
```typescript
if (categoryScore < 60) {
  return `I can see from your assessment that health is an area where 
  you'd like to create more alignment. What would you like to shift 
  or improve here?`
}
```

### Vision Synthesis (Cycle 3)

After gathering data:
```typescript
return `That's really helpful. Now let's put this together into your 
vision for ${category}. What does your ideal ${category} look like? 
How do you want to feel in this area?`
```

---

## API Reference

### POST `/api/viva/vision-generate`

**Actions**:

#### 1. `start_conversation`

**Request**:
```json
{
  "action": "start_conversation",
  "category": "money"
}
```

**Response**:
```json
{
  "sessionId": "viva_money_1234567890_abc123",
  "prompt": "I can see you're a successful entrepreneur...",
  "isComplete": false,
  "nextCycle": 2
}
```

#### 2. `continue_conversation`

**Request**:
```json
{
  "action": "continue_conversation",
  "sessionId": "viva_money_1234567890_abc123",
  "category": "money",
  "userResponse": "I feel confident about my income..."
}
```

**Response**:
```json
{
  "prompt": "I can see from your assessment that...",
  "isComplete": false,
  "nextCycle": 3
}
```

#### 3. `generate_vision_from_conversation`

**Request**:
```json
{
  "action": "generate_vision_from_conversation",
  "sessionId": "viva_money_1234567890_abc123",
  "category": "money"
}
```

**Response**:
```json
{
  "visionContent": "I am financially free and abundant..."
}
```

---

## Troubleshooting

### Issue: "Nothing is happening but the intro"

**Possible Causes**:
1. Database table not created
2. API routes not responding
3. Conversation cycle logic not working
4. User responses not being saved

**Solutions**:

1. **Check if table exists**:
```sql
SELECT * FROM viva_conversations LIMIT 1;
```

2. **Check API response**:
```bash
curl -X POST http://localhost:3000/api/viva/vision-generate \
  -H "Content-Type: application/json" \
  -d '{"action":"start_conversation","category":"money"}'
```

3. **Check browser console** for errors

4. **Verify conversation flow**:
   - Is `sessionId` being created?
   - Are user responses being saved?
   - Is the next cycle being triggered?

### Issue: "Intro feels canned"

**Possible Causes**:
1. Prompt generation not using profile data
2. Generic questions being shown
3. Profile analysis returning empty insights

**Solutions**:

1. **Verify profile data**:
```typescript
const profileInsights = await analyzeProfile(userId, supabase)
console.log('Profile insights:', profileInsights)
```

2. **Check prompt generation**:
```typescript
const prompt = generateConversationalPrompt(category, profileInsights, assessmentInsights, [])
console.log('Generated prompt:', prompt)
```

3. **Ensure data is being loaded**:
   - User has completed profile?
   - Assessment results exist?
   - Profile stories filled out?

---

## Current Status

✅ **Working**:
- Profile analyzer
- Assessment interpreter
- Conversation manager
- Database table
- API routes

⚠️ **Issues to Fix**:
1. Intro cycling through processing steps too quickly
2. Conversation not continuing past first prompt
3. No response handling for user input
4. Vision generation not being triggered

---

## Next Steps

1. **Fix conversation continuation logic**
2. **Add error handling for missing data**
3. **Implement proper loading states**
4. **Add conversation history display**
5. **Test full flow end-to-end**

---

## Files Reference

- **Profile Analysis**: `src/lib/viva/profile-analyzer.ts`
- **Conversation Manager**: `src/lib/viva/conversation-manager.ts`
- **API Routes**: `src/app/api/viva/vision-generate/route.ts`
- **UI Component**: `src/components/VisionBuilder.tsx`
- **Database Migration**: `supabase/migrations/20250128000002_viva_conversations.sql`

---

*This document will be updated as the system evolves.*
