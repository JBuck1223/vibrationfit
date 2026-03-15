import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scheduleMapNotifications } from '@/lib/map/notifications'
import type { UserMap, UserMapItem } from '@/lib/map/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/map/[id]/schedule
 * Regenerate SMS notifications for a specific MAP.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: map } = await supabase
      .from('user_maps')
      .select('*, items:user_map_items(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 })
    }

    if (!map.is_active || map.is_draft) {
      return NextResponse.json(
        { error: 'Only active maps can have notifications scheduled' },
        { status: 400 }
      )
    }

    const { data: account } = await supabase
      .from('user_accounts')
      .select('phone, sms_opt_in')
      .eq('id', user.id)
      .single()

    if (!account?.phone) {
      return NextResponse.json(
        { error: 'No phone number on file. Update your account settings to enable SMS.' },
        { status: 400 }
      )
    }

    if (!account.sms_opt_in) {
      return NextResponse.json(
        { error: 'SMS opt-in is required. Enable it in your account settings.' },
        { status: 400 }
      )
    }

    const result = await scheduleMapNotifications({
      map: map as UserMap & { items: UserMapItem[] },
      userId: user.id,
      phone: account.phone,
    })

    return NextResponse.json({
      success: true,
      scheduled: result.scheduled,
    })
  } catch (err) {
    console.error('Error in POST /api/map/[id]/schedule:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
