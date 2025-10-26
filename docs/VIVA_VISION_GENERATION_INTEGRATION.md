# VIVA Vision Generation Integration

## Overview

This document describes the integration of "The Life I Choose Program" methodology with VIVA's conversational vision generation system. This creates a powerful, emotionally intelligent tool that helps users build their first life vision across 12 major life categories.

## Core Philosophy

Based on "The Life I Choose Program" framework:

1. **Contrast-Driven Clarity**: People often know what they DON'T want before they know what they DO want
2. **Present Tense Creation**: Vision is written as if it's happening NOW (vibrational alignment)
3. **Feeling Place**: Rich sensory details make the vision feel real
4. **Believability Over Bravado**: Micro-behaviors and rhythms over grand claims
5. **Iterative Process**: First iteration gets you started; refinement happens later

## Architecture

### Components

1. **Vision Composer** (`src/lib/viva/vision-composer.ts`)
   - Transforms conversational input into polished vision paragraphs
   - Follows "The Life I Choose" vibrational grammar
   - Uses OpenAI GPT-4o-mini for generation

2. **Conversation Manager** (`src/lib/viva/conversation-manager.ts`)
   - Manages conversation history per category
   - Stores turns in `viva_conversations` table
   - Builds context for vision generation

3. **Profile Analyzer** (`src/lib/viva/profile-analyzer.ts`)
   - Extracts insights from user profile
   - Analyzes assessment results
   - Generates personalized prompts

4. **API Route** (`src/app/api/viva/vision-generate/route.ts`)
   - Orchestrates the vision generation flow
   - Handles database operations
   - Manages conversation lifecycle

## Data Flow

```
User → Conversational Interface
  ↓
VIVA asks warm, profile-based questions (3 cycles)
  ↓
User provides: wants, not_wants, vent/contrast
  ↓
Vision Composer processes:
  - Conversation context
  - Profile insights
  - Assessment insights
  - User input (wants/contrasts)
  ↓
GPT-4o-mini generates polished paragraph:
  - Reflection (one sentence mirror)
  - Paragraph (120-150 words, present tense)
  - Clarifier (follow-up question)
  ↓
Saved to vision_versions table
Logged to refinements table for AI analytics
```

## Vision Composition Rules

### Vibrational Grammar

```
✅ PRESENT TENSE, FIRST PERSON
"I enjoy..." "I feel..." "I notice..." "I experience..."

✅ POSITIVE FRAMING
Say what IS, not what isn't
"I feel vibrant" not "I don't feel tired"

✅ BELIEVABILITY OVER BRAVADO
"Every Sunday I review my goals" not "I am a perfect human"

✅ MICRO-BEHAVIORS & RHYTHMS
"Sunday check-in" "Morning meditation" "Weekly ritual"

✅ SENSORY DETAILS
What you see, hear, smell, taste, feel

✅ AVOID NEGATIONS
No "not / don't / won't" constructions
```

### Paragraph Structure

1. **Reflection** (20 words max)
   - Mirror one specific feeling or theme
   - "I totally hear that stress..."

2. **Vision Paragraph** (120-150 words)
   - Present tense, first person
   - Sensory details
   - Simple ritual/rhythm
   - Positive framing
   - References wants and flips contrasts

3. **Clarifier** (1 line)
   - Follow-up question to expand vision

## Example Output

### Input: Money Category
- **Wants**: "Financial freedom, travel whenever"
- **Not Wants**: "Stress about bills, paycheck-to-paycheck"
- **Vent**: "I'm so tired of worrying about money every day!"

### Output:

**Reflection:**
"I totally hear that money stress—it's exhausting to worry every single day."

**Paragraph:**
"I love how money flows effortlessly into my life through work I'm passionate about. Every Friday morning, I sit with my coffee and review my accounts, feeling a deep sense of security and gratitude. I notice the numbers growing, not with anxiety, but with excitement about the freedom this creates. Money feels easy—bills pay themselves, investments grow steadily, and I have complete peace of mind about my financial future. I enjoy the freedom to travel whenever inspiration strikes, knowing my abundance supports experiences that light me up. Financial freedom isn't a distant dream—it's my present reality, and it feels incredibly liberating."

**Clarifier:**
"What specific financial milestone would feel like a huge win right now?"

## Category Structure

14 Total Categories:
1. **Forward** - Opening statement
2. **Fun** - Recreation & hobbies
3. **Health** - Physical & mental wellness
4. **Travel** - Adventures & exploration
5. **Romance** - Love & partnership
6. **Family** - Family relationships
7. **Social** - Friendships & connections
8. **Home** - Living environment
9. **Business** - Career & work
10. **Money** - Financial abundance
11. **Possessions** - Material things
12. **Giving** - Contribution & legacy
13. **Spirituality** - Growth & connection
14. **Conclusion** - Closing statement

## Conversational Flow

### 3-Cycle Pattern

**Cycle 1**: Warm, profile-based question
```
"I can see from your profile that you value freedom and adventure. 
What activities or experiences make you feel most alive?"
```

**Cycle 2**: Assessment-informed follow-up
```
"That's beautiful! I also notice from your assessment that 
you're really thriving in your social connections. How do you 
want your friendships to support your bigger vision?"
```

**Cycle 3**: Vision synthesis
```
"Perfect! Now let's put this together into your vision for 
[category]. What does your ideal [category] look like? 
How do you want to feel in this area?"
```

### Collecting Input

After 3 cycles, VIVA collects:
- **Wants**: Comma-separated list
- **Not Wants**: Comma-separated list  
- **Vent/Contrast**: Free text venting

Then generates the polished vision paragraph.

## Database Tables

### `vision_versions`
Stores the generated vision paragraphs across all categories.

```sql
{
  user_id: UUID
  title: "My Life Vision"
  version_number: 1
  is_active: true
  forward: "I am stepping into..."
  fun: "I love filling my life..."
  health: "I feel vibrant and..."
  ... (12 more categories)
  conclusion: "This is the life I choose..."
}
```

### `viva_conversations`
Stores conversation history for context.

```sql
{
  user_id: UUID
  category: "money"
  session_id: "viva_money_1234567890_abc123"
  cycle_number: 1
  viva_prompt: "How do you want..."
  user_response: "I want financial freedom..."
}
```

### `refinements`
Logs AI interactions for analytics.

```sql
{
  user_id: UUID
  category: "money"
  operation_type: "vision_generation"
  input_text: "conversation context"
  output_text: "polished vision paragraph"
  total_tokens: 1500
  cost_usd: 0.045
}
```

## API Endpoints

### POST `/api/viva/vision-generate`

**Actions:**

1. **`start_conversation`**
   - Starts a new conversation for a category
   - Returns sessionId and first prompt

2. **`continue_conversation`**
   - Continues conversation after user response
   - Returns next prompt or completion flag

3. **`generate_vision_from_conversation`**
   - Generates polished vision paragraph
   - Accepts wants, not_wants, vent
   - Saves to vision_versions
   - Logs to refinements

## Next Steps: Refinement Tool

After vision generation is complete, users can access the refinement tool to:
- Edit specific sections
- Expand or clarify areas
- Adjust tone or detail level
- Ensure congruence across categories

The refinement tool will use the same Vision Composer with slightly different prompts focused on enhancement rather than initial creation.

## Success Metrics

- **Completion Rate**: % of users who complete all 14 categories
- **Quality Score**: User ratings on vision paragraphs (1-5 stars)
- **Refinement Rate**: % who use refinement tool
- **Activation Rate**: % who record audio/listen to vision
- **Satisfaction**: NPS score for VIVA vision experience

## Technical Notes

- Uses `gpt-4o-mini` for cost efficiency
- Temperature 0.7 for balanced creativity/consistency
- JSON response format for structured output
- Streaming support planned for future
- Redis caching planned for profile/assessment insights

## Integration Checklist

- [x] Vision Composer module created
- [x] Conversational flow integrated
- [x] Profile/assessment insights integrated
- [x] API route updated
- [ ] Frontend component updated
- [ ] Database migrations applied
- [ ] Testing & QA
- [ ] User documentation
- [ ] Admin dashboard for analytics

## Files Modified

1. `src/lib/viva/vision-composer.ts` (NEW)
2. `src/app/api/viva/vision-generate/route.ts` (UPDATED)
3. `docs/VIVA_VISION_GENERATION_INTEGRATION.md` (NEW)

## References

- "The Life I Choose Program" - Core methodology
- `docs/viva example/` - Reference implementation
- `docs/VISION_GENERATION_SYSTEM.md` - Original system doc
- `src/lib/design-system/vision-categories.ts` - Category definitions
