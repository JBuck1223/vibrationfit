import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIModelConfig } from '@/lib/ai/config'
import OpenAI from 'openai'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SHARED_SYSTEM_PROMPT = `You are VIVA — the AI Vibrational Assistant for Vibration Fit.
Your purpose is to help members articulate and activate the life they choose through vibrational alignment.
You are a warm, wise, intuitive life coach — never a therapist or problem-solver.
All responses must be in present tense, first person, and vibrationally activating.`

function buildMasterVisionPrompt(categorySummaries: Record<string, string>, categoryTranscripts: Record<string, string>, profile: any, assessment: any): string {
  const summariesText = Object.entries(categorySummaries)
    .map(([category, summary]) => `## ${category}\n${summary}`)
    .join('\n\n')

  return `${SHARED_SYSTEM_PROMPT}

BACKGROUND CONTEXT (use this rich context to create a deeper, more personalized vision):
${profile ? `Profile Context:

**User's Own Words from Profile Stories (KEY CONTEXT - synthesize this into the vision):**
${[
  { key: 'fun', story: profile.fun_story },
  { key: 'health', story: profile.health_story },
  { key: 'travel', story: profile.travel_story },
  { key: 'love', story: profile.love_story },
  { key: 'family', story: profile.family_story },
  { key: 'social', story: profile.social_story },
  { key: 'home', story: profile.home_story },
  { key: 'work', story: profile.work_story },
  { key: 'money', story: profile.money_story },
  { key: 'stuff', story: profile.stuff_story },
  { key: 'giving', story: profile.giving_story },
  { key: 'spirituality', story: profile.spirituality_story }
]
  .filter(item => item.story && item.story.trim().length > 0)
  .map(item => `- ${item.key}: "${item.story}"`)
  .join('\n')}

**Other Profile Data:**
${Object.entries(profile)
  .filter(([key, value]) => 
    value !== null && 
    value !== undefined && 
    value !== '' &&
    !['id', 'user_id', 'created_at', 'updated_at', 'completion_percentage'].includes(key) &&
    !key.includes('_story')
  )
  .slice(0, 10) // Limit to most relevant fields
  .map(([key, value]) => {
    const displayValue = Array.isArray(value) ? value.join(', ') : value
    return `- ${key}: ${displayValue}`
  })
  .join('\n')}
` : ''}

${assessment ? `Assessment Context:
- Overall Score: ${assessment.overall_percentage || 0}%
- Green Line Status: ${assessment.green_line_status || 'not assessed'}
- Category Scores: ${JSON.stringify(assessment.category_scores || {})}
${assessment.responses && assessment.responses.length > 0 ? `
Assessment Questions & Answers:
${assessment.responses.map((r: any) => `Category: ${r.category}
Q: ${r.question_text}
A: ${r.response_text} (${r.green_line || 'not assessed'}) (Value: ${r.response_value})
`).join('\n')}` : ''}
` : ''}

YOUR TASK:
Create a unified Life Vision Document from these category summaries and original user input. Match the LENGTH and DEPTH of each section to how much detail the user provided about that topic.

**CRITICAL: PRIORITIZE ORIGINAL USER WORDS**
The original transcripts below contain the user's EXACT words, voice, and speech patterns. These are more valuable than the summaries for capturing their authentic voice. Use the summaries for structure and insights, but draw 80%+ of your wording from the original transcripts to ensure the vision sounds like THEM.

Category Summaries (AI-generated summaries of user input, profile data, and assessment responses):
${summariesText}

${Object.keys(categoryTranscripts).length > 0 ? `**ORIGINAL USER INPUT - THEIR ACTUAL WORDS (PRIORITY SOURCE FOR VOICE CAPTURE):**

${Object.entries(categoryTranscripts)
  .map(([category, transcript]) => `## ${category} - User's Original Words\n${transcript}`)
  .join('\n\n')}

IMPORTANT: These are the user's exact words from their recordings or text input. Use these original transcripts as the PRIMARY source for capturing their voice, speech patterns, and authentic language. The summaries above provide structure and insights, but the original words should form the foundation of your output.` : ''}

FOUNDATIONAL PRINCIPLES - THE CORE PURPOSE:
1. **The basis of life is freedom** - The entire purpose of this life vision document is to help people feel more free
2. **The purpose of life is joy** - Everything someone thinks they want is at some level tied to the idea that they will feel better in the having of it
3. **The result of life is expansion** - The vision should reflect growth and expansion in each area
4. **Activate freedom through reading** - Just by reading this vision, they should feel more free

Therefore, every section of this vision must be written toward helping the person feel FREE in each specific life category. Use their words to describe what freedom looks and feels like for them in each area.

CRITICAL INSTRUCTIONS - READ CAREFULLY:

1. **CAPTURE THEIR VOICE - 80%+ MUST BE REFRAMED FROM THEIR WORDS:**
   - 80%+ of the output MUST be reframed context from the person themselves
   - **PRIORITIZE THE ORIGINAL TRANSCRIPTS** - These contain their EXACT words, phrases, and speech patterns. Use the summaries for structure and insights, but draw most of your wording from the original transcripts
   - Use their actual phrases, word choices, and speech patterns from the ORIGINAL TRANSCRIPTS first, then category summaries and profile stories
   - Match their existing speech patterns - if they use casual language, use casual language. If they're formal, be formal.
   - If the output is not similar to their existing speech patterns, none of this will stick
   - This is NOT about creating "airy-fairy woo paragraphs" - this is about capturing their voice using their words

2. **REAL DATA-BASED VISION - NO VIBRATIONAL SUMMARIES:**
   - This is intended as an actual real-life vision based on real data from their inputs
   - Do NOT create generic "vibrational summary" paragraphs or abstract language
   - Base everything on the actual content from their category summaries, profile stories, and assessment responses
   - Use specific details they provided - reference their actual hobbies, relationships, situations, challenges, and desires
   - If they described their partner as "funny and supportive", incorporate that. If they mentioned "hiking on weekends", use that specific detail.

3. **SPEECH PATTERN MATCHING:**
   - Study their word choices, sentence structures, and phrasing in the **ORIGINAL TRANSCRIPTS** first (primary source), then category summaries and profile stories
   - Mirror their speaking style from the transcripts - if they say "kinda" use "kinda", if they say "particularly" use "particularly"
   - Match their level of detail - if they're specific and detailed, be specific and detailed. If they're brief, be brief.
   - Match their emotional tone - if they're matter-of-fact, be matter-of-fact. If they're enthusiastic, be enthusiastic.

4. **REFRAMING NOT REWRITING:**
   - Your job is to REFRAME their words into present-tense activation language, NOT to rewrite them
   - Take their actual phrases from the **ORIGINAL TRANSCRIPTS** and restructure them in present tense ("I was feeling..." becomes "I feel...")
   - Keep their unique expressions and terminology from the transcripts - don't replace "awesome" with "wonderful" unless that's how they speak
   - When original transcripts are available, use them as the foundation. Summaries are supplementary for context and structure.

5. **DATA SOURCES TO USE (in priority order):**
   1. **ORIGINAL TRANSCRIPTS** (PRIMARY - their exact words from recordings/text input)
   2. Category summaries (AI-generated summaries that provide structure and insights)
   3. Profile stories (their own words about each category)
   4. Assessment responses (their answers to specific questions)
   - Extract specific details from the original transcripts first: names, places, activities, feelings they described

6. **FLIP NEGATIVES TO POSITIVES - CRITICAL RULE:**
   - If they share negative experiences, challenges, or "don't wants", you MUST flip these into positive equivalents
   - Example: "I don't have enough money, struggling to pay bills, hate looking at bank account" 
     → "It feels amazing to have more than enough. I consistently meet my needs and have abundance left over to do fun things. I love looking at my bank account and enjoy tracking my abundance."
   - Example: "I don't have a partner right now, dating is frustrating"
     → "I'm in a beautiful relationship that feels natural and fulfilling. Dating feels effortless and fun."
   - Take their negative and flip it to the positive opposite while using THEIR language and style

7. **NO COMPARATIVE LANGUAGE - ABSOLUTELY FORBIDDEN:**
   - NEVER use phrases like "I don't have X right now, but it's going to feel great when I do"
   - NEVER use "I used to struggle with X, but now I..."
   - NEVER contrast past/present or current/desired states
   - Write ONLY as if the ideal state already exists NOW
   - No "but", "however", "even though", "despite", or any comparative language
   - Write entirely in the positive as an ideal state of being - activating only what we want in entirety

8. **WHAT TO AVOID:**
   - NO generic spiritual/metaphysical language unless they used it themselves
   - NO abstract "vibrational" summaries - only concrete, specific descriptions
   - NO made-up details that aren't in their data
   - NO assessment scores or percentages mentioned
   - NO "airy-fairy woo" language - keep it grounded in their real experiences and desires
   - NO comparative language (past vs present, current vs desired, don't have vs will have)

STRUCTURE:
1) **Forward** — 2-3 short paragraphs introducing the vision, written in their voice using their words reframed. Focus on freedom and joy. Write entirely in positive, present-tense ideal state.
2) **12 Category Sections** (## Category Name) — In order: Fun, Health, Travel, Love, Family, Social, Home, Work, Money, Stuff, Giving, Spirituality
   - Write entirely in present-tense positive activation - as if the ideal state already exists NOW
   - Each section MUST describe what FREEDOM looks and feels like for them in this category
   - FLIP any negatives from their category summaries into positive equivalents
   - Use specific details they provided (activities, relationships, situations, feelings)
   - Focus on how this area of their life represents freedom and joy for them
   - Match the length they provided - if they gave 2 sentences about a category, don't write a novel
   - Draw wording directly from their category summaries - but FLIP negatives to positives
   - NO comparative language - don't mention what they don't have, only what they have
   - Write as ideal state: "I have...", "I feel...", "It feels amazing to...", "I love..."
   - If they mentioned challenges, flip them: "struggling to pay bills" → "I consistently meet my needs and have abundance left over"
3) **Conclusion** — 2-3 paragraphs that unify the document, using their words and patterns. Emphasize the freedom, joy, and expansion they experience across all areas. All positive, no comparisons.

STYLE + TONE:
- Present tense POSITIVE IDEAL STATE (write as if the ideal exists now: "I have...", "It feels amazing to...", "I love...")
- Match THEIR speech patterns, vocabulary, and style exactly
- Use THEIR phrases and word choices - 80%+ should feel like they wrote it themselves
- Grounded in real details from their actual input, not abstract concepts
- Only describe what they actually expressed wanting - but flip negatives to positives
- The tone should sound like THEM, just reframed in present-tense positive ideal state
- Each section should help them FEEL FREE just by reading it
- Focus on freedom and joy - tie everything back to these core purposes
- NO comparative language whatsoever - no "I don't have X but will have Y", only "I have Y" or "It feels amazing to have Y"
- If they shared negatives, flip them completely to positives using their language style

OUTPUT FORMAT:
Return the complete Markdown document with all sections, followed by a line containing "---JSON---" followed by the JSON structure.

JSON structure:
{
  "forward": "...",
  "fun": "...",
  "health": "...",
  "travel": "...",
  "love": "...",
  "family": "...",
  "social": "...",
  "home": "...",
  "work": "...",
  "money": "...",
  "stuff": "...",
  "giving": "...",
  "spirituality": "...",
  "conclusion": "...",
  "meta": {
    "model": "gpt-4-turbo",
    "created_at_iso": "${new Date().toISOString()}",
    "summary_style": "present-tense vibrational activation",
    "notes": "contrast omitted; pure alignment language"
  }
}

Generate the complete vision now.`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { categorySummaries, categoryTranscripts = {}, profile, assessment } = await request.json()

    if (!categorySummaries || Object.keys(categorySummaries).length === 0) {
      return NextResponse.json({ error: 'Category summaries are required' }, { status: 400 })
    }

    // Build the prompt
    const prompt = buildMasterVisionPrompt(categorySummaries, categoryTranscripts || {}, profile || {}, assessment || {})

    // Get admin-approved AI model config
    const aiConfig = getAIModelConfig('LIFE_VISION_MASTER_ASSEMBLY')

    // Estimate tokens and validate balance
    const estimatedTokens = estimateTokensForText(prompt, aiConfig.model)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)
    
    if (tokenValidation) {
      return NextResponse.json(
        { 
          error: tokenValidation.error,
          tokensRemaining: tokenValidation.tokensRemaining
        },
        { status: tokenValidation.status }
      )
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: aiConfig.model,
      messages: [
        { role: 'system', content: aiConfig.systemPrompt || SHARED_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: aiConfig.temperature,
      max_tokens: aiConfig.maxTokens,
    })

    const fullOutput = completion.choices[0]?.message?.content

    if (!fullOutput) {
      throw new Error('No output generated')
    }

    // Parse the output - split markdown and JSON
    const jsonMarker = '---JSON---'
    const jsonIndex = fullOutput.indexOf(jsonMarker)

    let markdown = ''
    let json: any = {}

    if (jsonIndex !== -1) {
      markdown = fullOutput.substring(0, jsonIndex).trim()
      const jsonString = fullOutput.substring(jsonIndex + jsonMarker.length).trim()
      
      try {
        json = JSON.parse(jsonString)
      } catch (e) {
        console.error('Failed to parse JSON, extracting categories from markdown:', e)
        // Fallback: extract categories from markdown
        json = extractCategoriesFromMarkdown(markdown)
      }
    } else {
      // No JSON marker, treat entire output as markdown
      markdown = fullOutput
      json = extractCategoriesFromMarkdown(markdown)
    }

    // Track token usage
    if (completion.usage) {
      try {
        await trackTokenUsage({
          user_id: user.id,
          action_type: 'life_vision_master_assembly',
          model_used: aiConfig.model,
          tokens_used: completion.usage.total_tokens || 0,
          input_tokens: completion.usage.prompt_tokens || 0,
          output_tokens: completion.usage.completion_tokens || 0,
          cost_estimate: 0, // Will be calculated by trackTokenUsage
          success: true,
          metadata: {
            categories_count: Object.keys(categorySummaries).length,
            markdown_length: markdown.length,
            has_profile: !!profile,
            has_assessment: !!assessment,
          },
        })
      } catch (trackingError) {
        console.error('Failed to track token usage:', trackingError)
        // Don't fail the request if tracking fails
      }
    }

    return NextResponse.json({ 
      markdown,
      json,
      model: aiConfig.model
    })

  } catch (err) {
    console.error('Master vision error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate master vision' },
      { status: 500 }
    )
  }
}

// Helper function to extract categories from markdown if JSON parsing fails
function extractCategoriesFromMarkdown(markdown: string): any {
  const categories: Record<string, string> = {}
  
  // Split by ## headings
  const sections = markdown.split(/##\s+/)
  
  sections.forEach(section => {
    const lines = section.trim().split('\n')
    const title = lines[0]?.trim().toLowerCase().replace(/^the\s+/i, '')
    
    if (title && ['forward', 'fun', 'health', 'travel', 'love', 'romance', 'family', 'social', 'home', 'work', 'business', 'money', 'stuff', 'possessions', 'giving', 'spirituality', 'conclusion'].includes(title)) {
      const content = lines.slice(1).join('\n').trim()
      // Map old names to new names for database compatibility
      let key = title
      if (title === 'romance') key = 'love'
      else if (title === 'business') key = 'work'
      else if (title === 'possessions') key = 'stuff'
      categories[key] = content
    }
  })
  
  return {
    ...categories,
    meta: {
      model: 'gpt-4-turbo',
      created_at_iso: new Date().toISOString(),
      summary_style: 'present-tense vibrational activation',
      notes: 'extracted from markdown'
    }
  }
}