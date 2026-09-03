import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runActivationKit, type KitRunRow, type KitSettings } from '@/lib/activation-kit/orchestrator'
import { kitToSettings } from '@/lib/activation-kit/kits'

// Voice TTS for a full vision + images can take a while
export const maxDuration = 800

/**
 * POST /api/activation-kit/generate
 *
 * Kicks off (or retries) an Activation Kit run for a committed vision.
 * Body: { visionId, kitId?, settings?, runId? }
 *  - kitId: saved preset to run (settings snapshot taken from it)
 *  - settings: inline overrides (from the commit dialog); merged over the kit
 *  - runId: retry an existing run (idempotent — only missing/failed assets rerun)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { visionId, kitId, settings: inlineSettings, runId } = body as {
      visionId?: string
      kitId?: string
      settings?: Partial<KitSettings>
      runId?: string
    }

    let run: KitRunRow | null = null

    if (runId) {
      // Retry an existing run
      const { data } = await supabase
        .from('activation_kit_runs')
        .select('*')
        .eq('id', runId)
        .eq('user_id', user.id)
        .single()
      if (!data) return NextResponse.json({ error: 'Run not found' }, { status: 404 })
      run = data as KitRunRow
    } else {
      if (!visionId) return NextResponse.json({ error: 'Missing visionId' }, { status: 400 })

      // The vision must be the member's own committed (non-draft) vision
      const { data: vision } = await supabase
        .from('vision_versions')
        .select('id, user_id, is_draft')
        .eq('id', visionId)
        .single()
      if (!vision || vision.user_id !== user.id) {
        return NextResponse.json({ error: 'Vision not found' }, { status: 404 })
      }
      if (vision.is_draft) {
        return NextResponse.json({ error: 'Commit the vision before generating its Activation Kit' }, { status: 400 })
      }

      // Resolve settings: saved kit + inline overrides
      let baseSettings: KitSettings | null = null
      if (kitId) {
        const { data: kit } = await supabase
          .from('activation_kits')
          .select('*')
          .eq('id', kitId)
          .eq('user_id', user.id)
          .single()
        if (!kit) return NextResponse.json({ error: 'Kit not found' }, { status: 404 })
        baseSettings = kitToSettings(kit)
      }
      const settings: KitSettings = {
        ...(baseSettings || kitToSettings({})),
        ...(inlineSettings || {}),
      }
      if (!settings.include_voice && !settings.include_mix && !settings.include_board) {
        return NextResponse.json({ error: 'Select at least one asset to generate' }, { status: 400 })
      }

      // Reuse an in-flight run for this vision instead of double-generating
      const { data: existing } = await supabase
        .from('activation_kit_runs')
        .select('*')
        .eq('vision_id', visionId)
        .eq('user_id', user.id)
        .eq('status', 'running')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing) {
        run = existing as KitRunRow
      } else {
        const { data: created, error: createErr } = await supabase
          .from('activation_kit_runs')
          .insert({
            user_id: user.id,
            vision_id: visionId,
            kit_id: kitId || null,
            settings,
            status: 'running',
            asset_status: {},
          })
          .select('*')
          .single()
        if (createErr || !created) {
          return NextResponse.json({ error: createErr?.message || 'Failed to create run' }, { status: 500 })
        }
        run = created as KitRunRow
      }
    }

    const { errors } = await runActivationKit(supabase, run)

    return NextResponse.json({ run, errors })
  } catch (error) {
    const err = error as Error & { insufficientTokens?: boolean; status?: number }
    if (err.insufficientTokens) {
      return NextResponse.json({ error: err.message, insufficientTokens: true }, { status: err.status || 402 })
    }
    console.error('[activation-kit] generate failed:', error)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
