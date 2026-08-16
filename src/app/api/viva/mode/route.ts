import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseVivaMode, type VivaMode } from '@/lib/viva/modes'

export const dynamic = 'force-dynamic'

/**
 * POST /api/viva/mode
 * Persist an in-thread mode switch. Writes conversation_sessions.viva_mode
 * and a viva_mode_switches row. Do not infer switches from prompt text.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId : null
    const toMode = parseVivaMode(body.toMode)
    const source = body.source === 'restore' ? 'restore' : 'composer'

    if (!conversationId) {
      return NextResponse.json({ ok: true, persisted: false, toMode })
    }

    const { data: session, error: sessionError } = await supabase
      .from('conversation_sessions')
      .select('id, viva_mode, message_count')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const fromMode = parseVivaMode(session.viva_mode)
    if (fromMode === toMode) {
      return NextResponse.json({ ok: true, persisted: true, fromMode, toMode, unchanged: true })
    }

    const { error: updateError } = await supabase
      .from('conversation_sessions')
      .update({ viva_mode: toMode })
      .eq('id', conversationId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[VIVA mode] session update failed:', updateError)
      return NextResponse.json({ error: 'Could not save mode' }, { status: 500 })
    }

    const { error: switchError } = await supabase.from('viva_mode_switches').insert({
      user_id: user.id,
      conversation_id: conversationId,
      from_mode: fromMode,
      to_mode: toMode,
      message_count_at_switch: session.message_count ?? 0,
      source,
    })

    if (switchError) {
      console.error('[VIVA mode] switch insert failed:', switchError)
    }

    return NextResponse.json({ ok: true, persisted: true, fromMode, toMode })
  } catch (error) {
    console.error('[VIVA mode] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export type { VivaMode }
