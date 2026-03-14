import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scheduleMapNotifications } from '@/lib/map/notifications'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/map/[id]/activate
 * Set this MAP as active, archive the previous active MAP, and schedule notifications.
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

    if (!map.items || map.items.length === 0) {
      return NextResponse.json({ error: 'Cannot activate an empty map' }, { status: 400 })
    }

    // Archive current active map
    await supabase
      .from('user_maps')
      .update({ status: 'archived' })
      .eq('user_id', user.id)
      .eq('status', 'active')

    // Set this map as active
    const { error: activateError } = await supabase
      .from('user_maps')
      .update({ status: 'active' })
      .eq('id', id)

    if (activateError) {
      console.error('Error activating map:', activateError)
      return NextResponse.json({ error: 'Failed to activate map' }, { status: 500 })
    }

    // Schedule SMS notifications
    const { data: account } = await supabase
      .from('user_accounts')
      .select('phone, sms_opt_in')
      .eq('id', user.id)
      .single()

    if (account?.phone && account?.sms_opt_in) {
      try {
        await scheduleMapNotifications({
          map: { ...map, status: 'active' },
          userId: user.id,
          phone: account.phone,
        })
      } catch (notifErr) {
        console.error('Error scheduling notifications (map still activated):', notifErr)
      }
    }

    const { data: updatedMap } = await supabase
      .from('user_maps')
      .select('*, items:user_map_items(*)')
      .eq('id', id)
      .single()

    return NextResponse.json({ map: updatedMap })
  } catch (err) {
    console.error('Error in POST /api/map/[id]/activate:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
