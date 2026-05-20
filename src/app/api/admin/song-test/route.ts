import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { gateway } from '@/lib/ai/gateway'
import {
  MASTER_SONGWRITER_SYSTEM_PROMPT,
  buildSimpleSongPrompt,
} from '@/lib/viva/prompts/song-lyrics-prompt'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return new Response(JSON.stringify({ error: auth.error }), { status: auth.status })
    }

    const body = await request.json()
    const { songIdea, modelName, temperature = 0.85 } = body

    if (!songIdea || !modelName) {
      return new Response(JSON.stringify({ error: 'Missing required fields: songIdea, modelName' }), { status: 400 })
    }

    const prompt = buildSimpleSongPrompt(songIdea)

    console.log(`[SongTest] model=${modelName} idea="${songIdea.slice(0, 50)}" temp=${temperature}`)

    const result = streamText({
      model: gateway(modelName),
      system: MASTER_SONGWRITER_SYSTEM_PROMPT,
      prompt,
      temperature,
    })

    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Model': modelName,
        'X-Start-Time': startTime.toString(),
      },
    })
  } catch (err) {
    const elapsed = Date.now() - startTime
    console.error(`[SongTest] Error after ${elapsed}ms:`, err)
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : 'Song test generation failed',
    }), { status: 500 })
  }
}
