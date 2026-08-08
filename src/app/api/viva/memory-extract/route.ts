/**
 * VIVA Memory Extraction API (Layer 4)
 *
 * Called after a coaching response completes.
 * Extracts durable memories and optionally triggers coaching card generation.
 *
 * This route is designed to be called fire-and-forget from the main coach route.
 */

import { createClient } from '@/lib/supabase/server'
import { extractMemories, saveMemories, loadMemories } from '@/lib/viva/memory-extractor'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { conversationId, messages } = await req.json()

    if (!messages || messages.length < 2) {
      return new Response(
        JSON.stringify({ extracted: 0, note: 'Not enough messages to extract from' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Load existing memories to prevent duplicates
    const existingMemories = await loadMemories(supabase, user.id, { limit: 30 })
    const existingContent = existingMemories.map(m => m.content)

    // Extract new memories
    const { memories, shouldGenerateCoachingCard } = await extractMemories(
      messages,
      existingContent,
      user.id
    )

    // Save extracted memories
    let saveResult = { saved: 0, skipped: 0 }
    if (memories.length > 0) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
      saveResult = await saveMemories(
        supabase,
        user.id,
        memories,
        lastUserMsg?.id || undefined,
        conversationId
      )
    }

    // Synopsis ("coaching card") generation is intentionally disabled:
    // memory items + transcripts are the compounding record.
    void shouldGenerateCoachingCard

    return new Response(
      JSON.stringify({
        extracted: memories.length,
        saved: saveResult.saved,
        skipped: saveResult.skipped,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[VIVA Memory Extract] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Memory extraction failed', extracted: 0 }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
