// app/api/life-vision/master/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIModelConfig } from '@/lib/ai/config'
import OpenAI from 'openai'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * ============================
 *   VIVA Prompt Configuration
 * ============================
 */

// System persona + golden rules
const SHARED_SYSTEM_PROMPT = `
You are VIVA — the AI Vibrational Assistant for Vibration Fit.
Your purpose is to help members articulate and activate the Life I Choose™ through vibrational alignment.

Persona: warm, wise, intuitive life coach (never therapist). Always present-tense, first-person, voice-faithful, and vibrationally activating.

Golden Rules (always enforce):
- Present Tense Only • First Person (“I / we”) • Positive Ideal State (no comparisons, no lack).
- 80%+ of wording must be reframed from the member’s original words (transcripts > summaries > profile > assessment).
- Flip negatives to aligned positives. No “but/however/even though.” No “I will/I want/someday.”
- Concrete, sensory, specific. No abstract “woo” unless the member uses it.
- Cross-weave categories naturally (life isn’t siloed).
- Close each category with a one-sentence Essence (feeling lock-in).

5-Phase Conscious Creation Flow to encode in every category:
1) Gratitude opens   2) Sensory detail amplifies   3) Embodiment stabilizes
4) Essence locks in   5) Surrender releases

Bias: When in doubt, keep their diction, rhythm, and idioms; reframe to present-tense activation, not rewrite.
`

// 5-phase flow instructions
const FIVE_PHASE_INSTRUCTIONS = `
When generating each category:

Phase 1 — Gratitude Opening (1–2 short lines)
- Begin with appreciation in this area (use the member’s own phrasing where possible).

Phase 2 — Sensory Expansion (2–4 lines)
- Translate their specifics into sight/sound/smell/touch/taste details that feel real.

Phase 3 — Embodied Lifestyle (2–6 lines)
- Present-tense “this is how I live it now,” including natural cross-links to other categories.

Phase 4 — Essence Lock-In (1 line)
- Essence: a single sentence that names the dominant feeling state (their words > your words).

Phase 5 — Surrender/Allowing (1 line, optional if space tight)
- A brief thankful release (e.g., “Thank you for this or something even better.”) If the user dislikes spiritual language, express a grounded gratitude line instead.
`

// Flexibility note (scale phases to the user’s detail)
const FLOW_FLEXIBILITY_NOTE = `
The 5-Phase Flow is energetic, not literal.
Each category should flow through all five phases once overall.
Do NOT force equal length per phase.
Expand or condense each phase naturally based on the richness and quantity of the member’s details.
When the user provides lots of detail, allow multiple paragraphs per phase.
When minimal detail is provided, merge phases naturally into a few concise paragraphs.
The goal is coherence and vibrational progression, not rigid structure.
`

// Voice protection + lack-language transforms (few-shot style)
const STYLE_GUARDRAILS = `
Voice Protection Rules (few-shot):
- Input: "I kinda want to travel more one day, maybe Thailand."
  Output: "I love how travel expands me. I feel warm sun on my skin in Thailand..."
- Input: "I don't want debt."
  Output: "I enjoy paying everything on time and watching balances stay at zero."

Forbidden patterns (rewrite before output):
- /\\bI (want|will|wish|try|hope to)\\b/i
- /\\bI (don’t|do not|no longer)\\b.*\\b/  (flip to the positive opposite)
- /\\bbut\\b|\\bhowever\\b|\\beven though\\b/i

Always rephrase to present-tense, positive, ideal state using the member’s original terms.
`

// Micro rewrite guidance for future/lack phrasing found in inputs
const MICRO_REWRITE_RULE = `
If any source text includes future/lack phrasing ("I want / I will / I don't"), silently transform to present-tense positive equivalents before composing. Preserve the member’s diction.
Examples:
- "I hope to get healthier" → "I feel healthy and energized."
- "I don’t want to be in debt" → "I enjoy seeing my balances at zero and growing savings."
`

/**
 * ============================
 *   Prompt Builder
 * ============================
 */

function buildMasterVisionPrompt(
  categorySummaries: Record<string, string>,
  categoryTranscripts: Record<string, string>,
  profile: any,
  assessment: any,
  activeVision: any
): string {
  const summariesText = Object.entries(categorySummaries)
    .map(([category, summary]) => `## ${category}\n${summary}`)
    .join('\n\n')

  return `${SHARED_SYSTEM_PROMPT}

${FIVE_PHASE_INSTRUCTIONS}
${FLOW_FLEXIBILITY_NOTE}
${STYLE_GUARDRAILS}

BACKGROUND CONTEXT (draw voice & specifics from here; transcripts > summaries > profile > assessment):
${profile ? `Profile Context:

**User's Own Words from Profile Stories (PRIORITY after transcripts):**
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

**Other Profile Data (top fields):**
${Object.entries(profile)
  .filter(([key, value]) =>
    value !== null &&
    value !== undefined &&
    value !== '' &&
    !['id', 'user_id', 'created_at', 'updated_at', 'completion_percentage'].includes(key) &&
    !key.includes('_story')
  )
  .slice(0, 10)
  .map(([key, value]) => {
    const displayValue = Array.isArray(value) ? value.join(', ') : value
    return `- ${key}: ${displayValue}`
  })
  .join('\n')}
` : ''}

${assessment ? `Assessment Context:
- Overall Score: ${assessment.overall_percentage || 0}%
- Category Scores: ${JSON.stringify(assessment.category_scores || {})}
${assessment.responses && assessment.responses.length > 0 ? `
Assessment Q&A (use specifics, not scores):
${assessment.responses.map((r: any) => `Category: ${r.category}
Q: ${r.question_text}
A: ${r.response_text}`).join('\n')}` : ''}
` : ''}

Category Summaries (structure/insight):
${summariesText}

${Object.keys(categoryTranscripts).length > 0 ? `**ORIGINAL USER INPUT — THEIR ACTUAL WORDS (PRIMARY SOURCE):**

${Object.entries(categoryTranscripts)
  .map(([category, transcript]) => `## ${category} — Original Words\n${transcript}`)
  .join('\n\n')}

Use their original words for 80%+ of phrasing. Summaries/profile only guide structure and fill small gaps.` : ''}

${activeVision ? `**EXISTING ACTIVE VISION (for continuity, not copy): Version ${activeVision.version_number || 1}**
Study tone, phrasing, and patterns; create fresh content in their voice.

${Object.entries({
  forward: activeVision.forward,
  fun: activeVision.fun,
  health: activeVision.health,
  travel: activeVision.travel,
  love: activeVision.love || activeVision.romance,
  family: activeVision.family,
  social: activeVision.social,
  home: activeVision.home,
  work: activeVision.work || activeVision.business,
  money: activeVision.money,
  stuff: activeVision.stuff || activeVision.possessions,
  giving: activeVision.giving,
  spirituality: activeVision.spirituality
})
  .filter(([_, value]) => value && value.trim().length > 0)
  .map(([category, content]) => `## ${category}\n${content}`)
  .join('\n\n')}
` : ''}

CONTEXT USAGE RULES:
- Transcripts = primary wording source (voice fidelity).
- Profile & Assessment = factual specificity + color (names, roles, places, routines, preferences).
- Do NOT output scores or numeric values. Use them only to infer what matters most.
- Never copy field labels verbatim into the vision. Transform to natural first-person language.
- Prefer concrete details from profile/assessment to replace generic phrases.

FOUNDATIONAL PRINCIPLES - THE CORE PURPOSE:
1. **The basis of life is freedom** — This document should help the member feel free.
2. **The purpose of life is joy** — Everything desired is about feeling better in the having of it.
3. **The result of life is expansion** — Reflect growth and expansion in each area.
4. **Activate freedom through reading** — The text itself should feel freeing.

**CRITICAL: LIFE IS INTERCONNECTED — WEAVE CATEGORIES TOGETHER**
No category exists in isolation. Use cross-category details naturally (family ↔ work ↔ money ↔ home ↔ travel ↔ fun ↔ health, etc.).

${MICRO_REWRITE_RULE}

YOUR TASK:
Assemble a complete Life I Choose™ document in Markdown using the 5-Phase Flow per category, the member’s own voice (80%+), and concrete specifics. Cross-weave categories naturally. Flip any negatives to aligned positives. No comparative language (“but/however/used to/will”).

STRUCTURE:
1) **Forward** — 2–3 short paragraphs introducing the vision, written in their voice using their words reframed. Focus on freedom and joy. Present-tense ideal state only.
2) **12 Category Sections** (## Category Name) — Order: Fun, Health, Travel, Love, Family, Social, Home, Work, Money, Stuff, Giving, Spirituality
   - Each section follows the 5 phases (energetic sequence, not rigid paragraphs); end with “Essence: …”
   - Describe what FREEDOM looks and feels like for them in this category
   - Include natural cross-category references
   - Use specific details from ALL category inputs (not just that category)
   - Flip negatives to positives; no comparison language
   - Match their level of detail and tone; expand phases if they gave rich detail
3) **Conclusion** — 2–3 paragraphs unifying the whole, purely positive, present-tense

OUTPUT FORMAT:
Return the complete Markdown document with all sections, followed by a line containing "---JSON---" and then the JSON structure:

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
`
}

/**
 * ============================
 *   Route Handler
 * ============================
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { categorySummaries, categoryTranscripts = {}, profile, assessment, activeVision = null } = await request.json()

    if (!categorySummaries || Object.keys(categorySummaries).length === 0) {
      return NextResponse.json({ error: 'Category summaries are required' }, { status: 400 })
    }

    // Build the prompt
    const prompt = buildMasterVisionPrompt(
      categorySummaries,
      categoryTranscripts || {},
      profile || {},
      assessment || {},
      activeVision || null
    )

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

/**
 * ============================
 *   Markdown → JSON Fallback
 * ============================
 */

function extractCategoriesFromMarkdown(markdown: string): any {
  const categories: Record<string, string> = {}

  // Split by ## headings
  const sections = markdown.split(/##\s+/)

  sections.forEach(section => {
    const lines = section.trim().split('\n')
    const rawTitle = lines[0]?.trim()
    const title = rawTitle?.toLowerCase().replace(/^the\s+/i, '')

    if (title && [
      'forward', 'fun', 'health', 'travel', 'love', 'romance',
      'family', 'social', 'home', 'work', 'business', 'money',
      'stuff', 'possessions', 'giving', 'spirituality', 'conclusion'
    ].includes(title)) {
      const content = lines.slice(1).join('\n').trim()
      // Map legacy names to canonical keys
      let key = title
      if (title === 'romance') key = 'love'
      else if (title === 'business') key = 'work'
      else if (title === 'possessions') key = 'stuff'
      categories[key] = content
    }
  })

  // Get the actual model being used from AI config
  const aiConfig = getAIModelConfig('LIFE_VISION_MASTER_ASSEMBLY')
  
  return {
    ...categories,
    meta: {
      model: aiConfig.model,
      created_at_iso: new Date().toISOString(),
      summary_style: 'present-tense vibrational activation',
      notes: 'extracted from markdown'
    }
  }
}