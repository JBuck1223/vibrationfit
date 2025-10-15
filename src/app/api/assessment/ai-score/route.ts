import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  try {
    const { questionText, userResponse } = await request.json()

    if (!questionText || !userResponse) {
      return NextResponse.json({ error: 'Question text and user response are required' }, { status: 400 })
    }

    // AI scoring prompt
    const prompt = `Analyze this assessment response for vibrational alignment and score it.

QUESTION: "${questionText}"
USER RESPONSE: "${userResponse}"

Score the response on a scale of 2, 4, 6, 8, or 10 based on vibrational alignment:

SCORING CRITERIA:
- 10: Above Green Line - Empowered, confident, abundance mindset, takes ownership
- 8: Above Green Line - Positive, optimistic, growth-oriented, self-aware
- 6: Neutral/Transition - Balanced, realistic, working on growth, aware but not fully aligned
- 4: Below Green Line - Victim mindset, scarcity thinking, disempowered, blaming others
- 2: Below Green Line - Hopeless, defeated, negative, self-sabotaging thoughts

GREEN LINE STATUS:
- "above": Score 8-10 (empowered, aligned mindset)
- "neutral": Score 6 (transitional, aware but working on it)
- "below": Score 2-4 (disempowered, victim mindset)

Respond with ONLY a JSON object in this exact format:
{
  "score": [2, 4, 6, 8, or 10],
  "greenLine": "above" | "neutral" | "below"
}

Be decisive and consistent with scoring. Focus on the vibrational energy and mindset, not the content.`

    // Use centralized AI client
    const result = await generateJSON<{
      score: 2 | 4 | 6 | 8 | 10
      greenLine: 'above' | 'neutral' | 'below'
    }>(prompt, 'ASSESSMENT_SCORING', (data): data is { score: 2 | 4 | 6 | 8 | 10; greenLine: 'above' | 'neutral' | 'below' } => {
      return (
        typeof data === 'object' &&
        data !== null &&
        [2, 4, 6, 8, 10].includes(data.score) &&
        ['above', 'neutral', 'below'].includes(data.greenLine)
      )
    })

    if (!result) {
      throw new Error('Failed to generate valid AI response')
    }

    return NextResponse.json({
      score: result.score,
      greenLine: result.greenLine,
      success: true
    })

  } catch (error) {
    console.error('AI scoring error:', error)
    return NextResponse.json({ 
      error: 'Failed to score response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
