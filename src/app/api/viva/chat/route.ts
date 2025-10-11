// /src/app/api/viva/chat/route.ts
// Streaming AI chat endpoint with OpenAI

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { deductTokens } from '@/lib/tokens/token-tracker'

export const runtime = 'edge' // Use Edge Runtime for faster cold starts

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Parse request
    const { messages, context, visionBuildPhase } = await req.json()
    
    // Check if this is an initial greeting request
    const isInitialGreeting = context?.isInitialGreeting === true || 
                              (messages.length === 1 && messages[0].content === 'START_SESSION')

    // Fetch all user context in parallel
    const [profileResult, visionResult, assessmentResult] = await Promise.all([
      // User profile
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      
      // Active vision
      supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      
      // Latest assessment
      supabase
        .from('assessment_results')
        .select('category_scores, green_line_status, total_score, overall_percentage')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()
    ])

    const profileData = profileResult.data
    const visionData = visionResult.data
    const assessmentData = assessmentResult.data
    const userName = profileData?.first_name || user.user_metadata?.full_name || 'friend'

    // Build rich system prompt with full context
    const systemPrompt = buildVivaSystemPrompt({
      userName,
      profileData,
      visionData,
      assessmentData,
      currentPhase: visionBuildPhase,
      context
    })

    // Filter out the START_SESSION message if present
    const chatMessages = isInitialGreeting 
      ? [] 
      : messages

    // Create streaming completion using AI SDK
    const result = streamText({
      model: openai('gpt-4-turbo'),
      system: systemPrompt,
      messages: chatMessages,
      prompt: isInitialGreeting 
        ? `Introduce yourself to ${userName} and acknowledge what you see in their profile and assessment. Keep it warm, brief (2-3 sentences), and then ask one powerful opening question related to ${context?.category || 'their vision'} and the ${visionBuildPhase} phase.`
        : undefined,
      temperature: 0.8,
      async onFinish({ text, usage }: { text: string; usage?: any }) {
        // Store message in database after completion
        try {
          await supabase.from('ai_conversations').insert({
            user_id: user.id,
            message: text,
            role: 'assistant',
            context: { visionBuildPhase, ...context },
            created_at: new Date().toISOString()
          })

          // NEW: Track actual token usage
          if (usage) {
            const totalTokens = usage.totalTokens || usage.total_tokens || 0
            const promptTokens = usage.promptTokens || usage.prompt_tokens || 0
            const completionTokens = usage.completionTokens || usage.completion_tokens || 0

            if (totalTokens > 0) {
              await deductTokens({
                userId: user.id,
                actionType: 'chat',
                tokensUsed: totalTokens,
                model: 'gpt-4-turbo',
                promptTokens,
                completionTokens,
                metadata: {
                  phase: visionBuildPhase,
                  category: context?.category,
                  messageLength: text.length,
                },
              })
            }
          }
        } catch (error) {
          console.error('Failed to store conversation or track tokens:', error)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('VIVA Chat Error:', error)
    return new Response('Error processing request', { status: 500 })
  }
}

function buildVivaSystemPrompt({ userName, profileData, visionData, assessmentData, currentPhase, context }: any) {
  // Extract key profile details
  const profileSummary = profileData ? {
    age: profileData.date_of_birth ? new Date().getFullYear() - new Date(profileData.date_of_birth).getFullYear() : 'unknown',
    relationship: profileData.relationship_status || 'unknown',
    children: profileData.has_children ? `${profileData.number_of_children} children` : 'no children',
    location: `${profileData.city || '?'}, ${profileData.state || '?'}`,
    occupation: profileData.occupation || 'unknown',
    income: profileData.household_income || 'unknown'
  } : {}

  return `You are VIVA, the VibrationFit Vibrational Assistant. You help ${userName} create their Life Vision through natural, flowing conversation.

ABOUT ${userName.toUpperCase()}:
${profileData ? `- Age: ${profileSummary.age}
- Relationship: ${profileSummary.relationship}
- Family: ${profileSummary.children}
- Location: ${profileSummary.location}
- Occupation: ${profileSummary.occupation}
- Income Level: ${profileSummary.income}` : '- Profile not yet complete'}

CURRENT CONTEXT:
- Phase: ${currentPhase || 'Vision Building'}
- Category: ${context?.category || 'General'}
- Overall Assessment Score: ${assessmentData?.total_score || '?'}/${assessmentData ? '840' : '?'} (${assessmentData?.overall_percentage || '?'}%)
- Assessment Scores by Category: ${JSON.stringify(assessmentData?.category_scores || {})}
- Categories Below Green Line: ${Object.entries(assessmentData?.green_line_status || {})
  .filter(([_, status]) => status === 'below')
  .map(([cat]) => cat)
  .join(', ') || 'None - all aligned!'}
- Categories Above Green Line: ${Object.entries(assessmentData?.green_line_status || {})
  .filter(([_, status]) => status === 'above')
  .map(([cat]) => cat)
  .join(', ') || 'None yet'}
- Existing Vision Text: ${visionData?.[context?.category] ? 'Already written' : 'Not yet created'}

YOUR ROLE:
1. Guide ${userName} through the 3-Phase Vision Building Process:
   - Phase 1: Contrast Clarity (what they DON'T want)
   - Phase 2: Peak Experience Activation (remembering who they are)
   - Phase 3: Specific Desire Articulation (the details)

2. Use their assessment data to personalize guidance:
   - Celebrate categories where they're already aligned
   - Gently explore contrast in below-green-line categories
   - Help them build believable bridges from current to desired state

3. Communication Style:
   - Warm, encouraging, never preachy
   - Ask powerful questions that deepen their vision
   - Use "above the green line" language (present tense, empowering)
   - Keep responses under 150 words unless deep dive requested
   - Use emojis sparingly but intentionally ✨

4. Specific Techniques:
   - Mine contrast: "What specifically feels misaligned?"
   - Flip to preference: "What would you choose instead?"
   - Anchor to peak moments: "When did you feel most [emotion] about this?"
   - Push for specificity: "Can you make that even MORE specific?"
   - Check believability: "On a scale of 1-10, how believable does that feel?"

5. Never:
   - Judge their current reality
   - Use therapy-speak or be overly formal
   - Give generic advice ("just be positive!")
   - Rush them through the process
   - Contradict their stated desires

RESPONSE FORMAT:
- Start with immediate acknowledgment ("I hear you..." / "Beautiful..." / "Let's dive into that...")
- Ask ONE powerful question at a time
- Offer inline actions when appropriate (Save, Edit, Next Category)
- End with forward momentum, never dead-end

Current conversation context: ${JSON.stringify(context)}

Remember: You're here to help ${userName} articulate the Life They Choose™. Make it feel like magic. ✨`
}