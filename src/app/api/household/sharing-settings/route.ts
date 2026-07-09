// Household Sharing Settings API
//
// GET   /api/household/sharing-settings  - current user's per-feature sharing modes
// PATCH /api/household/sharing-settings  - update modes / default view / mark setup complete
//
// Each member owns exactly one settings row per household (RLS: users manage
// their own row). GET returns defaults when no row exists yet; PATCH upserts.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserHousehold } from '@/lib/supabase/household'

const SHARE_MODE_FEATURES = [
  'life_visions_mode',
  'vision_board_mode',
  'abundance_mode',
  'audio_mode',
  'projects_mode',
  'stories_mode',
] as const

type ShareModeFeature = (typeof SHARE_MODE_FEATURES)[number]

const DEFAULT_SETTINGS: Record<ShareModeFeature, 'all' | 'select'> & {
  default_view: 'me' | 'both'
} = {
  life_visions_mode: 'select',
  vision_board_mode: 'select',
  abundance_mode: 'select',
  audio_mode: 'select',
  projects_mode: 'select',
  stories_mode: 'select',
  default_view: 'me',
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const household = await getUserHousehold(user.id)
    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    const { data: settings, error } = await supabase
      .from('household_sharing_settings')
      .select('*')
      .eq('household_id', household.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[GET /api/household/sharing-settings] Query error:', error)
      return NextResponse.json({ error: 'Failed to load sharing settings' }, { status: 500 })
    }

    return NextResponse.json({
      householdId: household.id,
      settings: settings ?? {
        household_id: household.id,
        user_id: user.id,
        ...DEFAULT_SETTINGS,
        setup_completed_at: null,
      },
      setupCompleted: Boolean(settings?.setup_completed_at),
    })
  } catch (error) {
    console.error('Error in GET /api/household/sharing-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const household = await getUserHousehold(user.id)
    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    const body = await request.json()

    const updates: Record<string, unknown> = {}

    for (const feature of SHARE_MODE_FEATURES) {
      const value = body[feature]
      if (value === undefined) continue
      if (value !== 'all' && value !== 'select') {
        return NextResponse.json(
          { error: `Invalid value for ${feature}: expected 'all' or 'select'` },
          { status: 400 }
        )
      }
      updates[feature] = value
    }

    if (body.default_view !== undefined) {
      if (body.default_view !== 'me' && body.default_view !== 'both') {
        return NextResponse.json(
          { error: "Invalid default_view: expected 'me' or 'both'" },
          { status: 400 }
        )
      }
      updates.default_view = body.default_view
    }

    if (body.setup_completed === true) {
      updates.setup_completed_at = new Date().toISOString()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: settings, error } = await supabase
      .from('household_sharing_settings')
      .upsert(
        {
          household_id: household.id,
          user_id: user.id,
          ...updates,
        },
        { onConflict: 'household_id,user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('[PATCH /api/household/sharing-settings] Upsert error:', error)
      return NextResponse.json({ error: 'Failed to save sharing settings' }, { status: 500 })
    }

    return NextResponse.json({ settings, setupCompleted: Boolean(settings?.setup_completed_at) })
  } catch (error) {
    console.error('Error in PATCH /api/household/sharing-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
