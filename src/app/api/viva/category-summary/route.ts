import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { analyzeProfile, analyzeAssessment } from '@/lib/viva/profile-analyzer'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SHARED_SYSTEM_PROMPT = `You are VIVA — the AI Vibrational Assistant for Vibration Fit.
Your purpose is to help members articulate and activate the life they choose through vibrational alignment.
You are a warm, wise, intuitive life coach — never a therapist or problem-solver.
All responses must be in present tense, first person, and vibrationally activating.`

function getCategoryProfileFields(category: string, profile: any): string {
  if (!profile) return ''
  
  const fields: string[] = []
  const categoryStories: Record<string, string> = {
    fun: 'fun_story',
    health: 'health_story',
    travel: 'travel_story',
    romance: 'love_story',
    family: 'family_story',
    social: 'social_story',
    home: 'home_story',
    business: 'work_story',
    money: 'money_story',
    possessions: 'stuff_story',
    giving: 'giving_story',
    spirituality: 'spirituality_story'
  }
  
  // Add the user's own story text for this category (highest priority context)
  const storyField = categoryStories[category]
  if (storyField && profile[storyField] && profile[storyField].trim().length > 0) {
    fields.push(`User's own words about ${category}:\n"${profile[storyField]}"`)
  }
  
  // Category-specific profile field mappings
  const categoryFields: Record<string, string[]> = {
    fun: ['leisure_time_weekly', 'hobbies'],
    health: ['exercise_frequency', 'health_concerns'],
    travel: ['countries_visited', 'travel_frequency'],
    romance: ['relationship_status', 'relationship_length'],
    family: ['has_children', 'number_of_children'],
    social: ['close_friends_count', 'social_frequency'],
    home: ['living_situation', 'time_at_location'],
    business: ['employment_type', 'time_in_role', 'occupation'],
    money: ['household_income', 'consumer_debt', 'assets_equity'],
    possessions: ['material_values'],
    giving: ['volunteer_status', 'charitable_giving'],
    spirituality: ['spiritual_practice']
  }
  
  const relevantFields = categoryFields[category] || []
  
  relevantFields.forEach(field => {
    const value = profile[field]
    if (value !== null && value !== undefined && value !== '') {
      // Convert array fields to readable format
      if (Array.isArray(value)) {
        if (value.length > 0) {
          fields.push(`${field}: ${value.join(', ')}`)
        }
      } else {
        fields.push(`${field}: ${value}`)
      }
    }
  })
  
  return fields.length > 0 ? `Profile Context (${category}):\n${fields.map(f => `- ${f}`).join('\n')}\n` : ''
}

function buildCategoryPrompt(
  category: string, 
  transcript: string, 
  categoryName: string,
  profile: any,
  assessment: any
): string {
  // Get category-specific profile fields
  const categoryProfileFields = getCategoryProfileFields(category, profile)
  
  // Get category-specific assessment responses
  const categoryResponses = assessment?.responses?.filter((r: any) => r.category === category) || []
  const assessmentContext = categoryResponses.length > 0
    ? `Assessment Responses for ${categoryName}:
${categoryResponses.map((r: any) => `Q: ${r.question_text}
A: ${r.response_text} (${r.green_line || 'not assessed'}) (Score: ${r.response_value})
`).join('\n')}`
    : ''
  
  // Calculate transcript length to determine detail level
  const transcriptLength = transcript.length
  const wordCount = transcript.split(/\s+/).length
  
  // Determine length guidance based on transcript detail
  let lengthGuidance = ''
  if (wordCount > 500) {
    lengthGuidance = '\n\nThe user spoke at great length about this topic. Write a COMPREHENSIVE and DETAILED summary with rich imagery and multiple paragraphs.'
  } else if (wordCount > 200) {
    lengthGuidance = '\n\nThe user provided substantial detail on this topic. Write a DETAILED summary with good depth and imagery.'
  } else if (wordCount > 50) {
    lengthGuidance = '\n\nThe user provided moderate detail on this topic. Write a MODERATE-LENGTH summary with some depth.'
  } else {
    lengthGuidance = '\n\nThe user provided brief input on this topic. Write a CONCISE summary that captures the essence without unnecessary elaboration.'
  }
  
  return `${SHARED_SYSTEM_PROMPT}

BACKGROUND CONTEXT (this helps you understand the user deeply - synthesize this into the vision):
${categoryProfileFields}

${assessmentContext}

${assessment && assessment.category_scores ? `Assessment Summary:
- ${categoryName} Score: ${assessment.category_scores[category] || 'not scored'}%
- Overall Score: ${assessment.overall_percentage || 'not calculated'}%
- Green Line Status: ${assessment.green_line_status || 'not assessed'}
` : ''}

YOUR TASK:
Write a detailed **Category Summary** for ${categoryName} that weaves together:
1. The user's spoken reflection below
2. The background context above (especially their own words from their profile story)${lengthGuidance}

User's spoken reflection:
"${transcript}"

TASK: Write a structured summary including:

1. **Overview Paragraph** — describe the vibrational landscape of this category in first person present tense.
2. **Highlights Section** — title it "The things going really well in this area are..." and list 3-5 specific items in affirming present-tense language.
3. **Contrast Section** — title it "The challenges currently in this area are..." — gently identify areas where energy feels resistant, keeping tone compassionate and observational.
4. **Vibrational Summary Paragraph** — integrate what's going well and what's calling for alignment. End with an upward statement like "I can feel myself opening into greater ease and harmony here."

OUTPUT FORMAT: Return Markdown in this exact structure:

### ${categoryName}
**Overview**
[1-2 emotionally intelligent paragraphs]

**The things going really well in this area are...**
- [specific highlight 1]
- [specific highlight 2]
- [specific highlight 3]
- [optional highlight 4]
- [optional highlight 5]

**The challenges currently in this area are...**
- [contrast 1]
- [contrast 2]
- [contrast 3]

**Vibrational Summary**
[1-2 paragraphs that integrate alignment and expansion, ending with an upward statement]`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { category, transcript, categoryName } = await request.json()

    if (!transcript || !category) {
      return NextResponse.json({ error: 'Transcript and category are required' }, { status: 400 })
    }

    // Get profile and assessment data
    let profile, assessment
    try {
      // Get raw profile data
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      profile = profileData
    } catch (err) {
      console.log('No profile found, continuing without profile data')
      profile = null
    }

    try {
      // Get raw assessment data
      const { data: assessmentData } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()
      
      if (assessmentData) {
        // Get assessment responses with questions and answers
        const { data: responsesData } = await supabase
          .from('assessment_responses')
          .select('*')
          .eq('assessment_id', assessmentData.id)
        
        assessment = {
          ...assessmentData,
          responses: responsesData || []
        }
      } else {
        assessment = null
      }
    } catch (err) {
      console.log('No assessment found, continuing without assessment data')
      assessment = null
    }

    // Build prompt with context
    const prompt = buildCategoryPrompt(category, transcript, categoryName, profile, assessment)

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SHARED_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const summary = completion.choices[0]?.message?.content

    if (!summary) {
      throw new Error('No summary generated')
    }

    // TODO: Track token usage in database

    return NextResponse.json({ 
      summary,
      model: 'gpt-4o',
      category 
    })

  } catch (err) {
    console.error('Category summary error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
