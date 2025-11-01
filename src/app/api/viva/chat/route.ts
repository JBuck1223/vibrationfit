// /src/app/api/viva/chat/route.ts
// Streaming AI chat endpoint with OpenAI

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { loadKnowledgeBase } from '@/lib/viva/knowledge'
import { flattenAssessmentResponsesNumbered } from '@/lib/viva/prompt-flatteners'

// Using Node.js runtime instead of Edge for proper onFinish callback support
// Edge runtime terminates the response before onFinish can run
export const dynamic = 'force-dynamic'
export const revalidate = 0

const MODEL = process.env.VIVA_MODEL || 'gpt-4-turbo' // Consistent model name

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Parse request
    const { messages, context, visionBuildPhase, conversationId } = await req.json()
    
    // Get or create conversation session
    let currentConversationId = conversationId
    
    // If no conversation ID and not initial greeting, create new session
    const isInitialGreeting = context?.isInitialGreeting === true || 
                              (messages.length === 1 && messages[0].content === 'START_SESSION')
    
    // Determine mode from context
    let mode = context?.mode || 'master'
    if (context?.refinement === true) {
      mode = 'refinement'
    } else if (visionBuildPhase) {
      mode = visionBuildPhase
    }

    // Extract category and visionId from context if available
    const category = context?.category || null
    const visionIdForSession = context?.visionId || null

    if (!currentConversationId && !isInitialGreeting) {
      // Create new conversation session
      const { data: newSession, error: sessionError } = await supabase
        .from('conversation_sessions')
        .insert({
          user_id: user.id,
          mode: mode,
          category: category,
          vision_id: visionIdForSession,
          preview_message: messages[messages.length - 1]?.content?.slice(0, 100) || '',
          message_count: 0
        })
        .select()
        .single()
      
      if (!sessionError && newSession) {
        currentConversationId = newSession.id
      }
    } else if (!currentConversationId && isInitialGreeting) {
      // For initial greeting, create a new session
      const { data: newSession, error: sessionError } = await supabase
        .from('conversation_sessions')
        .insert({
          user_id: user.id,
          mode: mode,
          category: category,
          vision_id: visionIdForSession,
          preview_message: 'New conversation',
          message_count: 0
        })
        .select()
        .single()
      
      if (!sessionError && newSession) {
        currentConversationId = newSession.id
      }
    }
    
    // Save user message to database (the last one in the messages array)
    if (messages.length > 0 && !isInitialGreeting) {
      const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')
      if (lastUserMessage) {
        try {
          const { data, error } = await supabase.from('ai_conversations').insert({
            user_id: user.id,
            conversation_id: currentConversationId || null,
            message: lastUserMessage.content,
            role: 'user',
            context: { visionBuildPhase, ...context, conversationId: currentConversationId },
            created_at: new Date().toISOString()
          }).select()
          if (error) {
            console.error('[VIVA CHAT] Error saving user message:', error)
          } else {
            console.log('[VIVA CHAT] Saved user message:', data)
          }
        } catch (err) {
          console.error('[VIVA CHAT] Exception saving user message:', err)
          // Don't fail the request if message save fails
        }
      }
    }
    
    // Load conversation history for context (last 20 messages)
    let conversationHistory: any[] = []
    if (currentConversationId) {
      const { data: historyMessages } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('conversation_id', currentConversationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(20)
      
      if (historyMessages && historyMessages.length > 0) {
        conversationHistory = historyMessages.map(msg => ({
          role: msg.role,
          content: msg.message
        }))
      }
    }

    // Check if this is master assistant mode
    const isMasterAssistant = context?.masterAssistant === true || context?.mode === 'master'
    
    // Detect document section queries (e.g., "show me the money section")
    const lastMessage = messages[messages.length - 1]
    const detectSectionQuery = (text: string): string | null => {
      if (!isMasterAssistant) return null
      const lowerText = text.toLowerCase()
      
      // Pattern matching for section queries
      const patterns = [
        /(?:show|display|get|find|tell me about|what does.*say about).*(?:the |my )?(money|fun|health|travel|love|family|social|home|work|stuff|giving|spirituality|forward|conclusion)(?: section)?/i,
        /(?:section|part|category).*?(money|fun|health|travel|love|family|social|home|work|stuff|giving|spirituality|forward|conclusion)/i,
      ]
      
      // Map common aliases to category keys
      const categoryMap: Record<string, string> = {
        'money': 'money',
        'finance': 'money',
        'financial': 'money',
        'finances': 'money',
        'wealth': 'money',
        'fun': 'fun',
        'recreation': 'fun',
        'health': 'health',
        'wellness': 'health',
        'fitness': 'health',
        'travel': 'travel',
        'adventure': 'travel',
        'love': 'love',
        'romance': 'love',
        'relationship': 'love',
        'family': 'family',
        'family life': 'family',
        'social': 'social',
        'friends': 'social',
        'home': 'home',
        'house': 'home',
        'living': 'home',
        'work': 'work',
        'career': 'work',
        'business': 'work',
        'stuff': 'stuff',
        'possessions': 'stuff',
        'things': 'stuff',
        'giving': 'giving',
        'legacy': 'giving',
        'contribution': 'giving',
        'spirituality': 'spirituality',
        'spiritual': 'spirituality',
        'forward': 'forward',
        'introduction': 'forward',
        'conclusion': 'conclusion',
        'closing': 'conclusion'
      }
      
      for (const pattern of patterns) {
        const match = lowerText.match(pattern)
        if (match) {
          const foundCategory = match[1] || match[0]
          return categoryMap[foundCategory.toLowerCase()] || foundCategory.toLowerCase()
        }
      }
      
      // Direct category mention check
      for (const [alias, key] of Object.entries(categoryMap)) {
        if (lowerText.includes(alias) && (lowerText.includes('show') || lowerText.includes('display') || lowerText.includes('section') || lowerText.includes('vision'))) {
          return key
        }
      }
      
      return null
    }
    
    const requestedSection = lastMessage && typeof lastMessage.content === 'string' 
      ? detectSectionQuery(lastMessage.content) 
      : null

    // If this is a refinement context, use the specific vision being refined
    const visionId = context?.visionId || context?.vision_id
    
    // Fetch all user context in parallel
    const [profileResult, visionResult, assessmentResult, journeyStateResults] = await Promise.all([
      // User profile
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      
      // Vision - get latest ACTIVE or COMPLETE vision for master assistant, or specific for refinement
      // Priority: 1) is_active = true, 2) status = 'complete', 3) latest by version/date
      visionId 
        ? supabase
            .from('vision_versions')
            .select('*')
            .eq('id', visionId)
            .eq('user_id', user.id)
            .single()
        : isMasterAssistant
          ? (async () => {
              // First try to get active vision
              const { data: activeVision } = await supabase
                .from('vision_versions')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('version_number', { ascending: false })
                .limit(1)
                .maybeSingle()
              
              if (activeVision) return { data: activeVision, error: null }
              
              // Then try complete vision
              const { data: completeVision } = await supabase
                .from('vision_versions')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'complete')
                .order('version_number', { ascending: false })
                .limit(1)
                .maybeSingle()
              
              if (completeVision) return { data: completeVision, error: null }
              
              // Finally get latest vision by version number (might have substantial content)
              const { data: latestVision } = await supabase
                .from('vision_versions')
                .select('*')
                .eq('user_id', user.id)
                .order('version_number', { ascending: false })
                .limit(1)
                .maybeSingle()
              
              return { data: latestVision, error: null }
            })()
          : requestedSection
            ? (async () => {
                // Similar logic for section queries - try active first, then complete, then latest
                const { data: activeVision } = await supabase
                  .from('vision_versions')
                  .select('*')
                  .eq('user_id', user.id)
                  .eq('is_active', true)
                  .order('version_number', { ascending: false })
                  .limit(1)
                  .maybeSingle()
                
                if (activeVision) return { data: activeVision, error: null }
                
                const { data: completeVision } = await supabase
                  .from('vision_versions')
                  .select('*')
                  .eq('user_id', user.id)
                  .eq('status', 'complete')
                  .order('version_number', { ascending: false })
                  .limit(1)
                  .maybeSingle()
                
                if (completeVision) return { data: completeVision, error: null }
                
                const { data: latestVision } = await supabase
                  .from('vision_versions')
                  .select('*')
                  .eq('user_id', user.id)
                  .order('version_number', { ascending: false })
                  .limit(1)
                  .maybeSingle()
                
                return { data: latestVision, error: null }
              })()
            : supabase
                .from('vision_versions')
                .select('*')
                .eq('user_id', user.id)
                .order('version_number', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
      
      // Latest assessment
      supabase
        .from('assessment_results')
        .select('*, assessment_responses(*)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single(),
      
      // For master assistant: get journey state (always fetch, but only use if master mode)
      Promise.all([
        // Count visions
        supabase
          .from('vision_versions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        // Count journal entries
        supabase
          .from('journal_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        // Count vision boards
        supabase
          .from('vision_boards')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ]).catch(() => [null, null, null]) // Graceful fallback
    ])

    const profileData = profileResult.data
    const visionData = visionResult.data
    const assessmentDataRaw = assessmentResult.data
    // If assessment has responses nested, extract them
    const assessmentData = assessmentDataRaw ? {
      ...assessmentDataRaw,
      responses: assessmentDataRaw.assessment_responses || []
    } : null
    // Check for active/complete vision more reliably
    const hasCompleteVision = visionData && (
      visionData.status === 'complete' || 
      (visionData.completion_percent && visionData.completion_percent >= 90) ||
      // If vision has substantial content in multiple categories, consider it active
      (Object.values(visionData).filter((v: any) => 
        typeof v === 'string' && 
        v.trim().length > 50 && 
        !['id', 'user_id', 'created_at', 'updated_at', 'version_number', 'status', 'completion_percent'].includes(v)
      ).length >= 3)
    )
    
    const journeyState = isMasterAssistant && Array.isArray(journeyStateResults) ? {
      visionCount: journeyStateResults[0]?.count || 0,
      journalCount: journeyStateResults[1]?.count || 0,
      visionBoardCount: journeyStateResults[2]?.count || 0,
      hasProfile: !!profileData,
      hasAssessment: !!assessmentDataRaw,
      hasActiveVision: !!hasCompleteVision,
      activeVisionVersion: visionData?.version_number || null,
      activeVisionId: visionData?.id || null,
      activeVisionStatus: visionData?.status || null,
      isActiveFlag: visionData?.is_active || false
    } : null
    const userName = profileData?.first_name || user.user_metadata?.full_name || 'friend'

    // Build rich system prompt with full context
    const systemPrompt = buildVivaSystemPrompt({
      userName,
      profileData,
      visionData,
      assessmentData,
      journeyState,
      currentPhase: visionBuildPhase,
      context: {
        ...context,
        requestedSection: requestedSection || undefined
      }
    })

    // Combine conversation history with new messages for context
    // Use conversation history if available, otherwise use the messages from request
    const allMessagesForContext = conversationHistory.length > 0 && currentConversationId
      ? [...conversationHistory.slice(0, -1), ...messages.slice(-2)] // Last messages from history + new messages
      : messages

    // Filter out the START_SESSION message if present
    // For initial greetings with prompt, don't use messages array
    const chatMessages = isInitialGreeting 
      ? undefined 
      : allMessagesForContext

    // Estimate tokens and validate balance before starting stream
    const messagesText = chatMessages ? chatMessages.map((m: { content: string }) => m.content).join('\n') : ''
    const promptText = systemPrompt + (isInitialGreeting ? `\nIntroduce yourself to ${userName}...` : messagesText)
    const estimatedTokens = estimateTokensForText(promptText, MODEL)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)
    
    if (tokenValidation) {
      return new Response(
        JSON.stringify({ 
          error: tokenValidation.error,
          tokensRemaining: tokenValidation.tokensRemaining
        }),
        { 
          status: tokenValidation.status,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Create streaming completion using AI SDK
    const initialPrompt = isInitialGreeting 
      ? (context?.refinement && context?.category 
        ? `Introduce yourself to ${userName} warmly. Acknowledge you're here to help refine their ${context.category} vision section. Reference something specific from their current ${context.category} section above (if provided) or their profile/assessment context. Then ask one powerful question that will help them deepen or elevate this category. Keep it warm, conversational, and focused on refinement. 3-4 sentences total.`
        : `Introduce yourself to ${userName} and acknowledge what you see in their profile and assessment. Keep it warm, brief (2-3 sentences), and then ask one powerful opening question related to ${context?.category || 'their vision'} and the ${visionBuildPhase} phase.`)
      : undefined

    console.log('[VIVA CHAT] Starting stream:', {
      isInitialGreeting,
      isRefinement: context?.refinement,
      category: context?.category,
      hasPrompt: !!initialPrompt,
      hasMessages: chatMessages ? chatMessages.length > 0 : false
    })

    // Bail if empty prompt/messages
    if (!initialPrompt && (!chatMessages || chatMessages.length === 0)) {
      return new Response(JSON.stringify({ error: 'Empty prompt/messages' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Build streamText params - don't include messages if we have a prompt
    const streamParams: any = {
      model: openai(MODEL),
      system: systemPrompt,
      temperature: 0.8,
    }
    
    if (initialPrompt) {
      streamParams.prompt = initialPrompt
    }
    
    if (chatMessages) {
      streamParams.messages = chatMessages
    }

    const result = streamText({
      ...streamParams,
      async onFinish({ text, usage }: { text: string; usage?: any }) {
        console.log('[VIVA CHAT] Stream finished, text length:', text?.length || 0)
        // Store assistant message in database after completion
        try {
          const { data, error } = await supabase.from('ai_conversations').insert({
            user_id: user.id,
            conversation_id: currentConversationId || null,
            message: text,
            role: 'assistant',
            context: { 
              visionBuildPhase, 
              ...context, 
              conversationId: currentConversationId 
            },
            created_at: new Date().toISOString()
          }).select()
          
          if (error) {
            console.error('[VIVA CHAT] Error saving assistant message:', error)
          } else {
            console.log('[VIVA CHAT] Saved assistant message:', data)
          }
          
          // Update conversation session title if this is the first assistant message
          if (currentConversationId && isInitialGreeting) {
            const { data: session } = await supabase
              .from('conversation_sessions')
              .select('title, preview_message')
              .eq('id', currentConversationId)
              .single()
            
            // Generate a title from first user message or assistant greeting
            if (session && (!session.title || session.title.includes('Conversation'))) {
              const firstUserMessage = messages.find((m: any) => m.role === 'user' && m.content !== 'START_SESSION')
              const title = firstUserMessage 
                ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
                : text.slice(0, 50) + (text.length > 50 ? '...' : '')
              
              await supabase
                .from('conversation_sessions')
                .update({ 
                  title: title || `Conversation ${new Date().toLocaleDateString()}`,
                  preview_message: firstUserMessage?.content?.slice(0, 100) || text.slice(0, 100)
                })
                .eq('id', currentConversationId)
            }
          }

          // Track actual token usage
          if (usage) {
            const totalTokens = usage.totalTokens || usage.total_tokens || 0
            const promptTokens = usage.promptTokens || usage.prompt_tokens || 0
            const completionTokens = usage.completionTokens || usage.completion_tokens || 0

            if (totalTokens > 0) {
              await trackTokenUsage({
                user_id: user.id,
                action_type: 'chat_conversation',
                model_used: MODEL,
                tokens_used: totalTokens,
                input_tokens: promptTokens,
                output_tokens: completionTokens,
                cost_estimate: 0, // Will be calculated by trackTokenUsage
                success: true,
                metadata: {
                  phase: visionBuildPhase,
                  category: context?.category,
                  message_length: text.length,
                  is_initial_greeting: isInitialGreeting,
                  is_master_assistant: isMasterAssistant,
                  is_refinement: context?.refinement === true || context?.operation === 'refine_vision',
                },
              })
            }
          }
        } catch (error) {
          console.error('Failed to store conversation or track tokens:', error)
        }
      },
    })

    console.log('[VIVA CHAT] Returning stream response')
    // Return plain text stream that works with our manual decoder
    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Conversation-Id': currentConversationId || ''
      }
    })
  } catch (error) {
    console.error('VIVA Chat Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * ============================
 *   Master Vision Refinement Instructions
 *   (Matches master-vision-assembly prompt rules)
 * ============================
 */
const REFINEMENT_INSTRUCTIONS = `**REFINEMENT MODE - CRITICAL INSTRUCTIONS:**

You are helping refine their **{{category}}** vision section. This is NOT about rewriting - it's about making it MORE powerful, specific, and aligned with their authentic voice while maintaining 80%+ of their words.

**MASTER VISION REFINEMENT PRINCIPLES:**

1. **VIBRATIONAL ACTIVATION (PRIMARY GOAL):**
   - Focus ONLY on desired vibration - what they want and how it feels now that it's real
   - DO NOT reference or reframe contrast, even positively
   - Activate only the vision they're aligning with - pure creation language
   - The output should evoke freedom, joy, and expansion when read

2. **CAPTURE THEIR VOICE - 80%+ MUST BE THEIR WORDS:**
   - 80%+ of any refined output must use their actual words, phrases, and speech patterns
   - Study their existing vision sections above - match their tone, vocabulary, and style
   - If they say "awesome," use "awesome." If they say "particularly," use "particularly."
   - Honor their vibrational vocabulary - echo their phrasing and emotional tone
   - The refined version should sound like THEM, just more powerful and specific

3. **PRESENT-TENSE ONLY - ALREADY LIVED EXPERIENCE:**
   - Write as lived experience: "I am," "I feel," "My days are filled with..."
   - Write as if the ideal state exists NOW - no "but," "however," "even though"
   - NEVER: "I want/will/wish/hope to" → ALWAYS: present-tense activation
   - NO comparative language: "I don't have X but I will" OR "I used to struggle but now"

4. **5-PHASE CONSCIOUS CREATION FLOW (encode in every refinement):**
   **Phase 1 — Gratitude Opening (1–2 lines):** Begin with appreciation
   **Phase 2 — Sensory Expansion (2–4 lines):** Translate specifics into sight/sound/smell/touch/taste
   **Phase 3 — Embodied Lifestyle (2–6 lines):** "This is how I live it now" with cross-category links
   **Phase 4 — Essence Lock-In (1 line):** Single sentence naming the dominant feeling state
   **Phase 5 — Surrender/Allowing (1 line):** Thankful release if they use spiritual language, otherwise grounded gratitude
   
   **Flow flexibility:** This is energetic progression, not rigid structure. Expand/condense based on their detail level.

5. **CROSS-CATEGORY WEAVING (REQUIRED):**
   - Life isn't siloed - work affects money, family affects health, travel affects fun
   - When refining {{category}}, naturally reference SPECIFIC details from other categories
   - Use their actual details - names, activities, experiences from their other sections
   - Create vibrational harmony across all categories

6. **FLIP NEGATIVES TO POSITIVES (silently):**
   - Transform "I don't want X" → positive opposite using THEIR language
   - Example: "struggling to pay bills" → "I consistently meet my needs and have abundance left over"
   - Example: "don't have enough energy" → "I have powerful energy that sustains me throughout amazing days"
   - Preserve their diction and style when flipping

7. **CONCRETE, SENSORY, SPECIFIC:**
   - No abstract "woo" unless they use it
   - Make it feel believable and resonant
   - Tone should be natural, emotionally reachable, satisfying to read

**VOICE PROTECTION EXAMPLES:**
- Input: "I kinda want to travel more one day, maybe Thailand."
  Output: "I love how travel expands me. I feel warm sun on my skin in Thailand..."
- Input: "I don't want debt."
  Output: "I enjoy paying everything on time and watching balances stay at zero."

**FORBIDDEN PATTERNS (rewrite before output):**
- /\bI (want|will|wish|try|hope to)\b/i
- /\bI (don't|do not|no longer)\b.*\b/
- /\bbut\b|\bhowever\b|\beven though\b/i

**YOUR REFINEMENT CONVERSATION PROCESS:**
- Ask powerful questions to deepen their vision in this category
- Help them connect this category to other life areas (cross-category weaving)
- When they share ideas, guide them using 5-phase flow principles
- Help them be more specific, emotionally connected, and vivid
- When ready, craft a refined version that:
  * Uses 80%+ of their actual words
  * Flows through all 5 phases
  * Weaves in cross-category connections
  * Ends with essence lock-in

**IMPORTANT:** The refined version should read like an evolution of THEIR words, not a rewrite. It should activate their desired vibration while maintaining their authentic voice.`

function buildVivaSystemPrompt({ userName, profileData, visionData, assessmentData, journeyState, currentPhase, context }: any) {
  const isMasterAssistant = context?.masterAssistant === true || context?.mode === 'master' || context?.isMasterAssistant === true
  const isRefinement = context?.refinement === true || context?.operation === 'refine_vision'
  const categoryBeingRefined = context?.category
  
  // Use master assistant knowledge base if in master mode - load from approved knowledge files
  const masterKnowledge = isMasterAssistant ? loadKnowledgeBase() : ''
  
  // Extract key profile details
  const profileSummary = profileData ? {
    age: profileData.date_of_birth ? new Date().getFullYear() - new Date(profileData.date_of_birth).getFullYear() : 'unknown',
    relationship: profileData.relationship_status || 'unknown',
    children: profileData.has_children ? `${profileData.number_of_children} children` : 'no children',
    location: `${profileData.city || '?'}, ${profileData.state || '?'}`,
    occupation: profileData.occupation || 'unknown',
    income: profileData.household_income || 'unknown'
  } : {}

  // Build full vision context for refinement (all categories for cross-referencing)
  let fullVisionContext = ''
  if (isRefinement && visionData && categoryBeingRefined) {
    const allCategories = [
      { key: 'forward', label: 'Forward' },
      { key: 'fun', label: 'Fun' },
      { key: 'health', label: 'Health' },
      { key: 'travel', label: 'Travel' },
      { key: 'love', label: 'Love' },
      { key: 'family', label: 'Family' },
      { key: 'social', label: 'Social' },
      { key: 'home', label: 'Home' },
      { key: 'work', label: 'Work' },
      { key: 'money', label: 'Money' },
      { key: 'stuff', label: 'Stuff' },
      { key: 'giving', label: 'Giving' },
      { key: 'spirituality', label: 'Spirituality' },
      { key: 'conclusion', label: 'Conclusion' }
    ]
    
    const visionCategories = allCategories
      .map(cat => {
        const value = visionData[cat.key] || visionData[cat.key === 'love' ? 'romance' : cat.key === 'work' ? 'business' : cat.key === 'stuff' ? 'possessions' : cat.key]
        return value && value.trim() ? `## ${cat.label}\n${value.substring(0, 500)}${value.length > 500 ? '...' : ''}` : null
      })
      .filter(Boolean)
      .join('\n\n')
    
    if (visionCategories) {
      fullVisionContext = `\n\n**COMPLETE EXISTING VISION (for context and cross-category references):**\n\n${visionCategories}\n\n`
    }
  }

  // Extract current category content being refined
  let currentCategoryContent = ''
  if (isRefinement && categoryBeingRefined && visionData) {
    const categoryValue = visionData[categoryBeingRefined] || visionData[categoryBeingRefined === 'love' ? 'romance' : categoryBeingRefined === 'work' ? 'business' : categoryBeingRefined === 'stuff' ? 'possessions' : categoryBeingRefined]
    if (categoryValue && categoryValue.trim()) {
      currentCategoryContent = `\n**CURRENT ${categoryBeingRefined.toUpperCase()} SECTION (what we're refining):**\n"${categoryValue}"\n\n`
    }
  }

  // Extract category-specific profile story if refining
  let categoryProfileStory = ''
  if (isRefinement && categoryBeingRefined && profileData) {
    const storyField = `${categoryBeingRefined}_story`
    const story = profileData[storyField]
    if (story && story.trim()) {
      categoryProfileStory = `**Profile Context for ${categoryBeingRefined}:**
"${story.substring(0, 300)}${story.length > 300 ? '...' : ''}"\n\n`
    }
  }

  // Get category-specific assessment responses
  let categoryAssessmentContext = ''
  if (isRefinement && categoryBeingRefined && assessmentData?.responses) {
    const categoryResponses = assessmentData.responses.filter((r: any) => r.category === categoryBeingRefined)
    if (categoryResponses.length > 0) {
      categoryAssessmentContext = `**Assessment Context for ${categoryBeingRefined}:**\n${flattenAssessmentResponsesNumbered(categoryResponses.slice(0, 3), false)}\n\n`
    }
  }

  // Extract requested section content if user asked to see a specific section
  let requestedSectionContent = ''
  let requestedSectionLabel = ''
  if (isMasterAssistant && context?.requestedSection && visionData) {
    const sectionKey = context.requestedSection
    const categoryMap: Record<string, string> = {
      'love': 'love', 'romance': 'love',
      'work': 'work', 'business': 'work',
      'stuff': 'stuff', 'possessions': 'stuff'
    }
    const actualKey = categoryMap[sectionKey] || sectionKey
    
    // Get category label
    const categoryLabels: Record<string, string> = {
      'forward': 'Forward',
      'fun': 'Fun',
      'health': 'Health',
      'travel': 'Travel',
      'love': 'Love',
      'family': 'Family',
      'social': 'Social',
      'home': 'Home',
      'work': 'Work',
      'money': 'Money',
      'stuff': 'Stuff',
      'giving': 'Giving',
      'spirituality': 'Spirituality',
      'conclusion': 'Conclusion'
    }
    requestedSectionLabel = categoryLabels[actualKey] || actualKey
    
    // Get section content, checking both new and old field names
    const sectionContent = visionData[actualKey] || 
                     visionData[actualKey === 'love' ? 'romance' : actualKey === 'work' ? 'business' : actualKey === 'stuff' ? 'possessions' : actualKey]
    
    if (sectionContent && sectionContent.trim()) {
      requestedSectionContent = `\n\n**USER REQUESTED TO SEE THEIR "${requestedSectionLabel.toUpperCase()}" SECTION:**\n\n${sectionContent}\n\n**IMPORTANT:** When the user asks to see a section, you MUST include the full section content above in your response. Format it nicely and make it clear that this is from their Life Vision.`
    } else {
      requestedSectionContent = `\n\n**USER REQUESTED TO SEE THEIR "${requestedSectionLabel.toUpperCase()}" SECTION BUT IT DOES NOT EXIST YET.**\n\nLet them know this section hasn't been created yet, and suggest they create or complete their Life Vision.`
    }
  }

  const basePrompt = isMasterAssistant 
    ? `You are VIVA, the Master Guide for VibrationFit.com. You have comprehensive knowledge of all tools, systems, processes, and the vibrational alignment philosophy. Your purpose is to help ${userName} become a master of the platform and live a powerful, vibrationally aligned life.

**MASTER KNOWLEDGE BASE:**
${masterKnowledge}

${requestedSectionContent}

**YOUR ROLE AS MASTER ASSISTANT:**
- Answer questions about ANY tool, feature, or process using ONLY the knowledge base above
- Never mention features that don't exist in the current system - only reference what's documented
- Guide users to the right tools at the right time using exact paths (e.g., "/life-vision/new")
- Explain concepts using the current definitions from the knowledge base
- Help troubleshoot issues or confusion based on current system capabilities
- Suggest best practices and workflows that actually exist
- Understand their current state and suggest next steps
- Be knowledgeable, warm, encouraging, and expert
- **If unsure about a feature**, acknowledge uncertainty rather than guessing

**CRITICAL: VISION DETECTION**
When checking if a user has a vision document:
- Vision exists if: status === 'complete' OR completion_percent >= 90 OR substantial content in 3+ categories
- Do NOT say "you don't have a vision" unless all checks fail
- If visionCount > 0 but no complete vision found, they may have drafts - check carefully

**COMMUNICATION STYLE:**
- Warm and supportive, never condescending
- Specific and actionable - always provide clear next steps
- Reference specific tools by their exact paths when helpful (e.g., "/life-vision/new")
- Tie everything back to the core principles: freedom, joy, and expansion
- Help them understand HOW to use tools, not just WHAT they are
- Celebrate their progress and guide them forward

**CONTEXT ABOUT ${userName.toUpperCase()}:

${journeyState ? `
**${userName.toUpperCase()}'S JOURNEY STATE:**
- Has completed profile: ${journeyState.hasProfile ? 'Yes' : 'No'}
- Has taken assessment: ${journeyState.hasAssessment ? 'Yes' : 'No'}
- Has active vision: ${journeyState.hasActiveVision ? 'Yes' : 'No'} ${journeyState.activeVisionId ? `(Vision ID: ${journeyState.activeVisionId})` : ''}
- Active vision version: ${journeyState.activeVisionVersion || 'None'}
- Active vision status: ${journeyState.activeVisionStatus || 'None'} ${journeyState.isActiveFlag ? '(is_active flag: true - THIS IS THEIR ACTIVE VISION)' : ''}
- Number of visions: ${journeyState.visionCount}
- Journal entries: ${journeyState.journalCount}
- Vision boards: ${journeyState.visionBoardCount}

**CRITICAL VISION DETECTION RULES:**
- If visionCount > 0, they DEFINITELY have at least one vision document in the database
- If isActiveFlag is true, they have an active vision marked with is_active=true - this IS their working vision
- If activeVisionId exists, that is the actual vision record ID - reference this when discussing their vision
- NEVER suggest they need to "build a new vision" if visionCount > 0 or isActiveFlag is true
- Instead, help them view, refine, or work with their EXISTING vision using the vision ID

**GUIDANCE APPROACH:**
Use this journey state to provide personalized guidance:
- What tools have they used? What's missing?
- What's their current progress?
- What would be most valuable for them right now?
- Suggest specific next steps based on where they are
- Celebrate what they've accomplished
- Guide them to the next tool if there are gaps

Be proactive and specific in your recommendations. Reference exact paths (e.g., "/life-vision/new") when directing them to tools.` : ''}

ABOUT ${userName.toUpperCase()}:
${profileData ? `- Age: ${profileSummary.age}
- Relationship: ${profileSummary.relationship}
- Family: ${profileSummary.children}
- Location: ${profileSummary.location}
- Occupation: ${profileSummary.occupation}
- Income Level: ${profileSummary.income}` : '- Profile not yet complete'}

CURRENT CONTEXT:
- Phase: ${currentPhase || (isRefinement ? 'Vision Refinement' : 'Vision Building')}
- Category: ${context?.category || 'General'}
- Overall Assessment Score: ${assessmentData?.total_score || '?'}/${assessmentData ? '420' : '?'} (${assessmentData?.overall_percentage || '?'}%)
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

${fullVisionContext}

${currentCategoryContent}

${categoryProfileStory}

${categoryAssessmentContext}

${isRefinement ? REFINEMENT_INSTRUCTIONS.replace(/\{\{category\}\}/g, categoryBeingRefined || 'category') : ''}

YOUR ROLE:
${isRefinement ? `1. Help ${userName} REFINE their existing ${categoryBeingRefined} vision through thoughtful conversation` : `1. Guide ${userName} through the 3-Phase Vision Building Process:`}
${!isRefinement ? `   - Phase 1: Contrast Clarity (what they DON'T want)
   - Phase 2: Peak Experience Activation (remembering who they are)
   - Phase 3: Specific Desire Articulation (the details)` : ''}

2. ${isRefinement ? `Help them refine using their existing vision as the foundation` : `Use their assessment data to personalize guidance:`}
   ${!isRefinement ? `   - Celebrate categories where they're already aligned
   - Gently explore contrast in below-green-line categories
   - Help them build believable bridges from current to desired state` : `   - Reference their current ${categoryBeingRefined} section above
   - Help them make it more specific, more emotionally connected
   - Weave in connections to other categories naturally
   - Maintain their authentic voice while elevating it`}

3. Communication Style:
   - Warm, encouraging, never preachy
   - Ask powerful questions that deepen their vision
   - Use "above the green line" language (present tense, empowering)
   - Keep responses under ${isRefinement ? '200' : '150'} words unless deep dive requested
   - Use emojis sparingly but intentionally ✨

4. Specific Techniques:
   ${isRefinement ? `   - Study their voice: "I notice you use [specific phrase]. Let's build on that..."
   - Connect categories: "How does this relate to [other category] you mentioned?"
   - Elevate specificity: "What would make that even more vivid and specific?"
   - Maintain their voice: "I love how you said [their phrase]. Let's expand on that..."` : `   - Mine contrast: "What specifically feels misaligned?"
   - Flip to preference: "What would you choose instead?"
   - Anchor to peak moments: "When did you feel most [emotion] about this?"
   - Push for specificity: "Can you make that even MORE specific?"
   - Check believability: "On a scale of 1-10, how believable does that feel?"`}

5. Never:
   - Judge their current reality
   - Use therapy-speak or be overly formal
   - Give generic advice ("just be positive!")
   - Rush them through the process
   - Contradict their stated desires
   ${isRefinement ? `   - Rewrite in your own voice - maintain 80%+ of their words
   - Create categories in isolation - always weave in other life areas
   - Use comparative language - only present-tense positive activation` : ''}

RESPONSE FORMAT:
- Start with immediate acknowledgment ("I hear you..." / "Beautiful..." / "Let's dive into that...")
- Ask ONE powerful question at a time
- ${isRefinement ? `When they're ready, offer to help craft a refined version using THEIR words` : `Offer inline actions when appropriate (Save, Edit, Next Category)`}
- End with forward momentum, never dead-end

Current conversation context: ${JSON.stringify(context)}

Remember: ${isMasterAssistant ? `You're the master guide helping ${userName} become a master of VibrationFit and live a powerful, vibrationally aligned life. Be their expert coach, guide, and supporter.` : isRefinement ? `You're helping refine their existing vision to be MORE powerful while maintaining their authentic voice. Make it feel like an evolution of THEIR words, not a rewrite.` : `You're here to help ${userName} articulate the Life They Choose™. Make it feel like magic. ✨`}
`
    : `You are VIVA, the VibrationFit Vibrational Assistant. ${isRefinement ? `You're helping ${userName} REFINE their existing Life Vision for the **${categoryBeingRefined}** category.` : `You help ${userName} create their Life Vision through natural, flowing conversation.`}

ABOUT ${userName.toUpperCase()}:
${profileData ? `- Age: ${profileSummary.age}
- Relationship: ${profileSummary.relationship}
- Family: ${profileSummary.children}
- Location: ${profileSummary.location}
- Occupation: ${profileSummary.occupation}
- Income Level: ${profileSummary.income}` : '- Profile not yet complete'}

CURRENT CONTEXT:
- Phase: ${currentPhase || (isRefinement ? 'Vision Refinement' : 'Vision Building')}
- Category: ${context?.category || 'General'}
- Overall Assessment Score: ${assessmentData?.total_score || '?'}/${assessmentData ? '420' : '?'} (${assessmentData?.overall_percentage || '?'}%)
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

${fullVisionContext}

${currentCategoryContent}

${categoryProfileStory}

${categoryAssessmentContext}

${isRefinement ? REFINEMENT_INSTRUCTIONS.replace(/\{\{category\}\}/g, categoryBeingRefined || 'category') : ''}

YOUR ROLE:
${isRefinement ? `1. Help ${userName} REFINE their existing ${categoryBeingRefined} vision through thoughtful conversation` : `1. Guide ${userName} through the 3-Phase Vision Building Process:`}
${!isRefinement ? `   - Phase 1: Contrast Clarity (what they DON'T want)
   - Phase 2: Peak Experience Activation (remembering who they are)
   - Phase 3: Specific Desire Articulation (the details)` : ''}

2. ${isRefinement ? `Help them refine using their existing vision as the foundation` : `Use their assessment data to personalize guidance:`}
   ${!isRefinement ? `   - Celebrate categories where they're already aligned
   - Gently explore contrast in below-green-line categories
   - Help them build believable bridges from current to desired state` : `   - Reference their current ${categoryBeingRefined} section above
   - Help them make it more specific, more emotionally connected
   - Weave in connections to other categories naturally
   - Maintain their authentic voice while elevating it`}

3. Communication Style:
   - Warm, encouraging, never preachy
   - Ask powerful questions that deepen their vision
   - Use "above the green line" language (present tense, empowering)
   - Keep responses under ${isRefinement ? '200' : '150'} words unless deep dive requested
   - Use emojis sparingly but intentionally ✨

4. Specific Techniques:
   ${isRefinement ? `   - Study their voice: "I notice you use [specific phrase]. Let's build on that..."
   - Connect categories: "How does this relate to [other category] you mentioned?"
   - Elevate specificity: "What would make that even more vivid and specific?"
   - Maintain their voice: "I love how you said [their phrase]. Let's expand on that..."` : `   - Mine contrast: "What specifically feels misaligned?"
   - Flip to preference: "What would you choose instead?"
   - Anchor to peak moments: "When did you feel most [emotion] about this?"
   - Push for specificity: "Can you make that even MORE specific?"
   - Check believability: "On a scale of 1-10, how believable does that feel?"`}

5. Never:
   - Judge their current reality
   - Use therapy-speak or be overly formal
   - Give generic advice ("just be positive!")
   - Rush them through the process
   - Contradict their stated desires
   ${isRefinement ? `   - Rewrite in your own voice - maintain 80%+ of their words
   - Create categories in isolation - always weave in other life areas
   - Use comparative language - only present-tense positive activation` : ''}

RESPONSE FORMAT:
- Start with immediate acknowledgment ("I hear you..." / "Beautiful..." / "Let's dive into that...")
- Ask ONE powerful question at a time
- ${isRefinement ? `When they're ready, offer to help craft a refined version using THEIR words` : `Offer inline actions when appropriate (Save, Edit, Next Category)`}
- End with forward momentum, never dead-end

Current conversation context: ${JSON.stringify(context)}

Remember: ${isRefinement ? `You're helping refine their existing vision to be MORE powerful while maintaining their authentic voice. Make it feel like an evolution of THEIR words, not a rewrite.` : `You're here to help ${userName} articulate the Life They Choose™. Make it feel like magic. ✨`}`
  
  return basePrompt
}