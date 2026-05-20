import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  autoVerifyOccurrence,
  autoVerifyOccurrenceByActivityType,
} from '@/lib/map/auto-verify'

/**
 * POST /api/map/auto-verify
 *
 * Body: { area?: string, activityType?: string, occurredOn?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { area, activityType, occurredOn } = body as {
      area?: string
      activityType?: string
      occurredOn?: string
    }

    if (!area && !activityType) {
      return NextResponse.json(
        { error: 'area or activityType is required' },
        { status: 400 },
      )
    }

    const result = activityType
      ? await autoVerifyOccurrenceByActivityType(
          user.id,
          activityType,
          occurredOn,
        )
      : await autoVerifyOccurrence(user.id, area!, occurredOn)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Error in POST /api/map/auto-verify:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
