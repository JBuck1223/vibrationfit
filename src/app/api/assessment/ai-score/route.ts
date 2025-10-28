import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/ai/client'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { questionText, userResponse } = await request.json()

    if (!questionText || !userResponse) {
      return NextResponse.json({ error: 'Question text and user response are required' }, { status: 400 })
    }

    // Get the current user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // AI scoring prompt
    const prompt = `You are a vibrational alignment expert. Analyze this assessment response and score it based on the person's vibrational energy and mindset.

QUESTION: "${questionText}"
USER RESPONSE: "${userResponse}"

SCORING SCALE (2-10):
- 10: EXCEPTIONAL alignment - Pure joy, excitement, confidence, "I can do anything" energy
- 8: STRONG alignment - Positive, optimistic, empowered, taking action
- 6: NEUTRAL/TRANSITION - Mixed feelings, aware but not fully aligned, working on it
- 4: WEAK alignment - Some negativity, victim mindset, scarcity thinking
- 2: POOR alignment - Hopeless, defeated, negative, self-sabotaging

EXAMPLES:
- "My wife is the best thing ever!!! We are super romantic all the time" → 10 (pure joy, excitement)
- "I feel anxious walking into our home sometimes" → 4 (anxiety, negative energy)
- "I just want my wife! She's the best" → 8 (positive, loving energy)
- "We're working on our relationship" → 6 (neutral, transitional)

GREEN LINE STATUS:
- "above": Score 8-10 (empowered, aligned mindset)
- "neutral": Score 6 (transitional, aware but working on it)  
- "below": Score 2-4 (disempowered, victim mindset)

Respond with ONLY a JSON object:
{
  "score": [2, 4, 6, 8, or 10],
  "greenLine": "above" | "neutral" | "below"
}

Be decisive! Look for emotional energy, confidence, and empowerment vs. anxiety, negativity, and victimhood.`

    // Estimate tokens and validate balance
    const tokenEstimate = estimateTokensForText(prompt + userResponse, 'gpt-5')
    const tokenValidation = await validateTokenBalance(user.id, tokenEstimate, supabase)
    
    if (tokenValidation) {
      return NextResponse.json(
        { 
          error: tokenValidation.error,
          tokensRemaining: tokenValidation.tokensRemaining
        },
        { status: tokenValidation.status }
      )
    }

    // Use centralized AI client with safe fallback
    let result: { score: 2 | 4 | 6 | 8 | 10; greenLine: 'above' | 'neutral' | 'below' } | null = null
    try {
      result = await generateJSON<{
        score: 2 | 4 | 6 | 8 | 10
        greenLine: 'above' | 'neutral' | 'below'
      }>(prompt, 'ASSESSMENT_SCORING', (data): data is { score: 2 | 4 | 6 | 8 | 10; greenLine: 'above' | 'neutral' | 'below' } => {
        return (
          typeof data === 'object' &&
          data !== null &&
          [2, 4, 6, 8, 10].includes((data as any).score) &&
          ['above', 'neutral', 'below'].includes((data as any).greenLine)
        )
      })
    } catch (e) {
      // fall through to heuristic fallback
    }

    if (!result) {
      // Improved heuristic fallback scoring
      const text = `${questionText} ${userResponse}`.toLowerCase()
      
      // Strong positive indicators
      const strongPositive = ['best thing ever', 'amazing', 'incredible', 'love', 'excited', 'confident', 'can do anything', 'super', 'perfect', 'fantastic', 'wonderful']
      // Moderate positive indicators  
      const moderatePositive = ['good', 'great', 'happy', 'positive', 'optimistic', 'grateful', 'blessed', 'lucky', 'proud']
      // Negative indicators
      const negative = ['anxious', 'worried', 'stressed', 'overwhelmed', 'difficult', 'hard', 'struggle', 'problem', 'issue', 'concern', 'fear', 'afraid']
      // Strong negative indicators
      const strongNegative = ['hopeless', 'defeated', 'can\'t', 'won\'t', 'impossible', 'terrible', 'awful', 'hate', 'desperate']
      
      let scoreValue = 6 // Default neutral
      
      const strongPosHits = strongPositive.reduce((c, k) => c + (text.includes(k) ? 1 : 0), 0)
      const moderatePosHits = moderatePositive.reduce((c, k) => c + (text.includes(k) ? 1 : 0), 0)
      const negHits = negative.reduce((c, k) => c + (text.includes(k) ? 1 : 0), 0)
      const strongNegHits = strongNegative.reduce((c, k) => c + (text.includes(k) ? 1 : 0), 0)
      
      // Scoring logic
      if (strongPosHits >= 2 || (strongPosHits >= 1 && moderatePosHits >= 2)) {
        scoreValue = 10
      } else if (strongPosHits >= 1 || moderatePosHits >= 3) {
        scoreValue = 8
      } else if (strongNegHits >= 2 || (strongNegHits >= 1 && negHits >= 2)) {
        scoreValue = 2
      } else if (strongNegHits >= 1 || negHits >= 3) {
        scoreValue = 4
      } else if (moderatePosHits >= 1 && negHits <= 1) {
        scoreValue = 8
      } else if (negHits >= 2 && moderatePosHits === 0) {
        scoreValue = 4
      }
      
      const gl: 'above' | 'neutral' | 'below' = scoreValue >= 8 ? 'above' : scoreValue === 6 ? 'neutral' : 'below'
      result = { score: scoreValue as 2 | 4 | 6 | 8 | 10, greenLine: gl }
    }

    // Track token usage (estimate since generateJSON doesn't return usage data)
    const modelUsed = 'gpt-5' // Default model for assessment scoring
    const actualTokensUsed = Math.ceil((prompt.length + userResponse.length) / 4) // Rough estimate
    
    await trackTokenUsage({
      user_id: user.id,
      action_type: 'assessment_scoring',
      model_used: modelUsed,
      tokens_used: actualTokensUsed,
      input_tokens: Math.ceil(prompt.length / 4),
      output_tokens: 50, // Estimated output tokens for JSON response
      cost_estimate: 0, // Will be calculated by trackTokenUsage function
      success: true,
      metadata: {
        question_text: questionText.substring(0, 100), // First 100 chars for context
        user_response_length: userResponse.length,
        estimated_tokens: true
      }
    })

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
