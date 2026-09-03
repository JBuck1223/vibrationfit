/**
 * Activation funnel event tracking (client-fired steps).
 *
 * POST /api/activation/track  { eventType, activationId?, eventData? }
 * Requires an authenticated session; user_id always comes from the session.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ACTIVATION_EVENT_TYPES,
  recordActivationEvent,
  type ActivationEventType,
} from '@/lib/activation/events'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const eventType = body.eventType as ActivationEventType
    if (!ACTIVATION_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    await recordActivationEvent(createAdminClient(), {
      eventType,
      activationId: body.activationId || null,
      userId: user.id,
      visitorId: body.visitor_id || null,
      sessionId: body.session_id || null,
      eventData: body.eventData || {},
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[activation/track] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
