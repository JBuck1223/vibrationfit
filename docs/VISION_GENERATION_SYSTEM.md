# VIVA Vision Generation System

## Overview

The Vision Generation Tool is the first step in building a comprehensive life vision. This tool creates a foundational vision across 14 life categories through conversational AI that leverages your profile and assessment data. The result is a well-composed vision written in vibrational vocabulary (present tense, first person) that feeds the `vision_versions` table.

## Key Principles

### 1. **Vision Categories Structure**
- **Forward**: Opening statement and intention setting
- **12 Life Categories**: Fun, Health, Travel, Romance, Family, Social, Home, Business, Money, Possessions (Stuff), Giving, Spirituality
- **Conclusion**: Closing affirmation and commitment

### 2. **Data-Driven Personalization**
VIVA leverages three primary data sources:
- **Profile Data**: Personal stories, strengths, values, lifestyle, demographics
- **Assessment Data**: Category scores, green line status, emotional patterns
- **Conversation History**: Previous turns to maintain context

### 3. **Conversational Flow**
Each category follows a 3-cycle conversational pattern:

#### Cycle 1: Profile-Based Warm Start
- VIVA references specific profile data
- Personal observation about their current life
- Question that invites reflection or sharing

#### Cycle 2: Assessment-Informed Follow-Up
- Acknowledges their assessment scores/status
- Draws connection between profile and assessment data
- Deeper exploration of wants, contrast, or feelings

#### Cycle 3: Vision Synthesis
- Transitions from exploration to creation
- Guides them to articulate their ideal state
- Sets up for vision generation

### Special Cases

**Forward Category** (3 cycles):
1. What's calling them forward based on profile strengths
2. Intention setting informed by assessment
3. Crafting the opening statement

**Conclusion Category** (2 cycles):
1. Reflecting on the essence of their vision
2. Creating a powerful closing affirmation

## Technical Implementation

### Database Tables

#### `vision_versions`
Stores the generated vision content:
```sql
- forward: TEXT
- fun: TEXT
- health: TEXT
- travel: TEXT
- romance: TEXT
- family: TEXT
- social: TEXT
- home: TEXT
- business: TEXT
- money: TEXT
- stuff: TEXT  (formerly possessions)
- giving: TEXT
- spirituality: TEXT
- conclusion: TEXT
- title: TEXT (required)
- is_active: BOOLEAN
```

#### `viva_conversations`
Stores the conversational history:
```sql
- user_id: UUID
- category: TEXT
- session_id: TEXT
- cycle_number: INTEGER
- viva_prompt: TEXT
- user_response: TEXT
```

### API Flow

1. **Start Conversation** (`/api/viva/vision-generate`)
   - Action: `start_conversation`
   - Analyzes profile and assessment
   - Generates first cycle prompt
   - Returns `sessionId` and initial prompt

2. **Continue Conversation** 
   - Action: `continue_conversation`
   - User responds
   - VIVA generates next cycle prompt
   - Stores conversation history

3. **Generate Vision**
   - Action: `generate_vision_from_conversation`
   - Converts conversation into vision content
   - Saves to `vision_versions` table
   - Logs to `refinements` table

### Vision Content Characteristics

- **Present Tense**: Written as if the vision is already happening
- **First Person**: Uses "I" statements
- **Vibrational Vocabulary**: Emphasizes feeling, energy, vibration
- **Specific Yet Broad**: Enough detail to be compelling, enough flexibility to evolve
- **Well-Composed**: Organized into reasonable paragraphs
- **Category-Specific**: Tailored to each life area's unique context

## Example Flow

### Category: Money

**Cycle 1** (Profile-based):
> "I can see from your profile that financial security is really important to you - you mentioned valuing stability in your values. Your assessment shows you're building momentum in this area. What does financial freedom actually look like to you? What would it feel like to not worry about money?"

**User Response**: "I want to be able to travel without thinking about costs, support my family without stress, and invest in experiences that matter to me."

**Cycle 2** (Assessment-informed):
> "That makes so much sense - especially given your high scores in travel and family. I'm curious, is there anything about your relationship with money right now that feels like it's holding you back? Any patterns or beliefs that you notice?"

**User Response**: "I think I still operate from a scarcity mindset even though I'm doing well. I save everything and don't enjoy what I have."

**Cycle 3** (Vision synthesis):
> "Perfect awareness. Now let's craft your vision for money. How do you want to feel about money in your ideal life? What relationship do you want to have with abundance? Paint the picture of your ideal financial reality."

**User Response**: "I want to feel completely free and abundant. Money flows naturally and easily to me because I'm aligned with my purpose. I enjoy it, share it generously, and it grows effortlessly."

**Vision Generated**:
> "I am living in complete financial freedom and abundance. Money flows to me effortlessly because I am aligned with my highest purpose and offering value that transforms lives. I enjoy my financial abundance fully—taking the trips I desire, creating experiences with those I love, and investing in what truly matters to me. My relationship with money is one of ease, trust, and celebration. I share my abundance generously, knowing that there is always more where that came from. Financial stress is foreign to me, and I move through the world with the energy of a person who knows abundance as my natural state."

## Next Tool: Vision Refinement

This generation tool creates the initial vision. The next tool in the flow is a **Refinement Tool** that helps users refine, expand, and polish their vision even further. The refinement process allows for:
- Deepening specific sections
- Adjusting tone or focus
- Adding more detail
- Expanding on key themes
- Ensuring congruence across categories

## Key Insights for Implementation

1. **Profile Analysis is Critical**: The quality of the profile analysis directly impacts the personalization of prompts
2. **Assessment Context Matters**: Use green line status and scores to inform the tone and approach
3. **Conversation Storage Enables Context**: Building on previous responses creates more natural flow
4. **Vision vs. Goal Language**: Always use vibrational vocabulary - "I am" not "I will"
5. **Contrast is Valid Data**: Users often know what they don't want more clearly than what they do want
6. **Well-Composed Output**: The final vision should read as professional, inspiring, and authentic
