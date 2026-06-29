import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { gatewayClient, VISION_MODEL } from '@/lib/ai/gateway'
import { getAIToolConfig, buildOpenAIParams } from '@/lib/ai/database-config'
import {
  trackTokenUsage,
  validateTokenBalance,
  estimateTokensForText,
} from '@/lib/tokens/tracking'
import { FOCUS_STORY_SYSTEM_PROMPT } from '@/lib/viva/prompts/focus-story-prompt'

export const runtime = 'edge'

type RefineMode = 'refine' | 'rewrite'

interface RefineStoryRequest {
  storyId: string
  feedback: string
  currentContent: string
  mode?: RefineMode
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const supabase = await createClient()
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Authentication required' })}\n\n`)
          )
          controller.close()
          return
        }

        const body: RefineStoryRequest = await req.json()
        const { storyId, feedback, currentContent, mode = 'refine' } = body

        if (!storyId || !feedback?.trim() || !currentContent?.trim()) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Missing required fields: storyId, feedback, currentContent' })}\n\n`)
          )
          controller.close()
          return
        }

        const { data: story } = await supabase
          .from('stories')
          .select('id, user_id, title, entity_type, metadata')
          .eq('id', storyId)
          .eq('user_id', user.id)
          .single()

        if (!story) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Story not found or access denied' })}\n\n`)
          )
          controller.close()
          return
        }

        const wordCount = currentContent.trim().split(/\s+/).filter(Boolean).length
        const lengthTarget = wordCount > 0
          ? `~${wordCount} words (similar length to the current story)`
          : '400-700 words'

        const prompt = mode === 'rewrite'
          ? `STORY TITLE: ${story.title || 'Untitled'}

USER INSTRUCTIONS (PRIMARY SIGNAL):
${feedback}

EXISTING STORY (for thematic context only — feel free to depart significantly):
${currentContent}

TASK:
Write a completely new day-in-the-life narrative from scratch.
Treat the user's instructions as the primary creative direction. The existing
story is reference only — use it for theme, tone, real names, and places, but
build something fresh that fully embraces what the user asked for.

REQUIREMENTS:
1. Lead with the user's instructions — they are the brief.
2. Preserve real names, real places, and concrete details from the existing
   story unless the instructions explicitly say to change them.
3. Maintain first person, present tense throughout.
4. Keep vibrational integrity — zero forbidden patterns, no future tense
   ("I will"), no negations ("don't", "no more"), no contrast framing.
5. Sensory, immersive, written for audio listening.
6. Target length: ${lengthTarget}.

Apply the authenticity test: "Could I tell who this person is from reading this?"
Apply the energy test: "Would this person recognize their own life here?"

OUTPUT:
Return ONLY the new narrative text. No explanations, no headings, no commentary.`
          : `CURRENT STORY:
${currentContent}

USER INSTRUCTIONS:
${feedback}

TASK:
Refine the story by weaving the user's instructions into the existing narrative.
Keep the bones of the current story intact. Adjust, expand, or polish based on
the instructions — do NOT rewrite from scratch.

REQUIREMENTS:
1. Address the specific instructions faithfully.
2. Preserve all real names, places, and concrete details from the original.
3. Keep vibrational integrity — zero forbidden patterns, no future tense
   ("I will"), no negations ("don't", "no more"), no contrast framing.
4. Keep the sensory, immersive, audio-ready quality.
5. Match the original length (~${wordCount} words) unless the instructions
   explicitly ask for shorter or longer.
6. Maintain first person, present tense throughout.

Apply the authenticity test: "Could I tell who this person is from reading this?"
Apply the energy test: "Would this person recognize their own life here?"

OUTPUT:
Return ONLY the revised narrative text. No explanations, no headings, no commentary.`

        const toolConfig = await getAIToolConfig('vision_refinement')
        const tokenEstimate = estimateTokensForText(prompt, toolConfig.model_name)

        const balanceCheck = await validateTokenBalance(user.id, tokenEstimate)
        if (balanceCheck) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: balanceCheck.error, insufficientTokens: true, tokensRemaining: balanceCheck.tokensRemaining })}\n\n`)
          )
          controller.close()
          return
        }

        const messages = [
          { role: 'system' as const, content: FOCUS_STORY_SYSTEM_PROMPT },
          { role: 'user' as const, content: prompt },
        ]
        const openaiParams = buildOpenAIParams(toolConfig, messages, {
          forceNoJsonMode: true,
        })
        openaiParams.model = VISION_MODEL

        const completion = await gatewayClient.chat.completions.create({
          ...openaiParams,
          stream: true,
          stream_options: { include_usage: true },
        }) as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>

        let fullText = ''
        let streamUsage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null = null
        let actualModel: string | null = null

        for await (const chunk of completion) {
          if (!actualModel && chunk.model) {
            actualModel = chunk.model
          }
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            fullText += content
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            )
          }
          if ((chunk as any).usage) {
            streamUsage = (chunk as any).usage
          }
        }

        const inputTokens = streamUsage?.prompt_tokens || 0
        const outputTokens = streamUsage?.completion_tokens || 0
        const totalTokens = streamUsage?.total_tokens || (inputTokens + outputTokens)

        await trackTokenUsage({
          user_id: user.id,
          action_type: 'story_refinement',
          model_used: actualModel || VISION_MODEL,
          tokens_used: totalTokens,
          actual_cost_cents: 0,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          success: true,
          metadata: {
            story_id: storyId,
            mode,
            streaming: true,
            had_stream_usage: !!streamUsage,
          },
        })

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            done: true,
            usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
          })}\n\n`)
        )
        controller.close()
      } catch (error) {
        console.error('Story refine error:', error)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            error: error instanceof Error ? error.message : 'Failed to refine story',
          })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
