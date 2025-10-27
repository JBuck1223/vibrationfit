import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'

const SHARED_SYSTEM_PROMPT = \`You are VIVA — the AI Vibrational Assistant for Vibration Fit.
Your purpose is to help members articulate and activate the life they choose through vibrational alignment.
You are a warm, wise, intuitive life coach — never a therapist or problem-solver.
All responses must be in present tense, first person, and vibrationally activating.\`

function buildMasterVisionPrompt(categorySummaries: Record<string, string>, profile: any, assessment: any): string {
  const summariesText = Object.entries(categorySummaries)
    .map(([category, summary]) => \`## \${category}\\n\${summary}\`)
    .join('\\n\\n')

  return \`\${SHARED_SYSTEM_PROMPT}

BACKGROUND CONTEXT (use this rich context to create a deeper, more personalized vision):
${profile ? `Profile Context:

**User's Own Words from Profile Stories (KEY CONTEXT - synthesize this into the vision):**
${[
  { key: 'fun', story: profile.fun_story },
  { key: 'health', story: profile.health_story },
  { key: 'travel', story: profile.travel_story },
  { key: 'romance', story: profile.love_story },
  { key: 'family', story: profile.family_story },
  { key: 'social', story: profile.social_story },
  { key: 'home', story: profile.home_story },
  { key: 'business', story: profile.work_story },
  { key: 'money', story: profile.money_story },
  { key: 'possessions', story: profile.stuff_story },
  { key: 'giving', story: profile.giving_story },
  { key: 'spirituality', story: profile.spirituality_story }
]
  .filter(item => item.story && item.story.trim().length > 0)
  .map(item => \`- \${item.key}: "\${item.story}"\`)
  .join('\\n')}

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
    return \`- \${key}: \${displayValue}\`
  })
  .join('\\n')}
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
Create a unified Life Vision Document from these category summaries. Match the LENGTH and DEPTH of each section to how much detail the user provided about that topic.

Category Summaries:
\${summariesText}

IMPORTANT: 
- Use the profile stories (the user's own words) and assessment insights to deeply understand the user's authentic voice, energy, and current reality
- Synthesize this context into a cohesive vision that feels true to them
- Do NOT mention specific assessment scores, percentages, or responses in the output
- The vision should be written in pure present-tense activation language, drawing from both the category summaries and the rich context about who they are

STRUCTURE:
1) **Forward (Vibrational Warmup)** — 2-3 short paragraphs introducing the vision.
2) **12 Category Sections** (## Category Name) — In order: Fun, Health, Travel, Romance, Family, Social, Home, Work, Money, Stuff, Giving, Spirituality
   - Begin with a short overview paragraph
   - Write entirely in present-tense activation
   - Draw wording from their category summaries
3) **Conclusion** — 2-3 paragraphs that unify the document.

STYLE + TONE:
- Present tense, vibrationally activating, emotionally intelligent
- Only describe what is wanted and becoming
- Weave in emotional vocabulary that evokes satisfaction, freedom, clarity, and joy
- Maintain coherence across all categories
- The tone should feel like an energetic transmission more than a report

OUTPUT FORMAT:
Return the complete Markdown document with all sections, followed by a line containing "---JSON---" followed by the JSON structure.

JSON structure:
{
  "forward": "...",
  "fun": "...",
  "health": "...",
  "travel": "...",
  "romance": "...",
  "family": "...",
  "social": "...",
  "home": "...",
  "business": "...",
  "money": "...",
  "possessions": "...",
  "giving": "...",
  "spirituality": "...",
  "conclusion": "...",
  "meta": {
    "model": "gpt-4-turbo",
    "created_at_iso": "\${new Date().toISOString()}",
    "summary_style": "present-tense vibrational activation",
    "notes": "contrast omitted; pure alignment language"
  }
}

Generate the complete vision now.\`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { categorySummaries, profile, assessment } = await request.json()

    if (!categorySummaries || Object.keys(categorySummaries).length === 0) {
      return NextResponse.json({ error: 'Category summaries are required' }, { status: 400 })
    }

    // Build the prompt
    const prompt = buildMasterVisionPrompt(categorySummaries, profile || {}, assessment || {})

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: SHARED_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
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

    // TODO: Track token usage in database

    return NextResponse.json({ 
      markdown,
      json,
      model: 'gpt-4-turbo'
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
    const lines = section.trim().split('\\n')
    const title = lines[0]?.trim().toLowerCase().replace(/^the\s+/i, '')
    
    if (title && ['forward', 'fun', 'health', 'travel', 'romance', 'family', 'social', 'home', 'work', 'business', 'money', 'possessions', 'stuff', 'giving', 'spirituality', 'conclusion'].includes(title)) {
      const content = lines.slice(1).join('\\n').trim()
      const key = title === 'work' ? 'business' : title === 'stuff' ? 'possessions' : title
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
