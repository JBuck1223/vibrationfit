// /src/app/api/viva/chat/route.ts
// Streaming AI chat endpoint with OpenAI

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { buildVivaSystemPrompt } from '@/lib/viva/prompts/chat-system-prompt'

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
    console.log('[VIVA CHAT] conversationId from request:', conversationId, 'type:', typeof conversationId)
    
    // If no conversation ID and not initial greeting, create new session
    const isInitialGreeting = context?.isInitialGreeting === true || 
                              (messages.length === 1 && messages[0].content === 'START_SESSION')
    
    console.log('[VIVA CHAT] isInitialGreeting:', isInitialGreeting, 'currentConversationId:', currentConversationId)
    
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

    console.log('[VIVA CHAT] Mode:', mode, 'Category:', category, 'VisionId:', visionIdForSession)

    if (!currentConversationId) {
      // Only create new session if we don't have one
      if (isInitialGreeting) {
        console.log('[VIVA CHAT] Creating new session for initial greeting')
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
        
        console.log('[VIVA CHAT] Initial greeting session created:', newSession?.id, 'error:', sessionError)
        
        if (!sessionError && newSession) {
          currentConversationId = newSession.id
        }
      } else {
        console.log('[VIVA CHAT] Creating new session for non-greeting message')
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
        
        console.log('[VIVA CHAT] New session created:', newSession?.id, 'error:', sessionError)
        
        if (!sessionError && newSession) {
          currentConversationId = newSession.id
        }
      }
    } else {
      console.log('[VIVA CHAT] Using existing conversation:', currentConversationId)
    }
    
    console.log('[VIVA CHAT] Final currentConversationId:', currentConversationId)
    
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
        ? `Say hi to ${userName} and ask: "What refinements would you like to make?" Keep it brief and direct.`
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
