import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { seedOliverAntarctica } from '@/lib/life-explorer/seed'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const result = await seedOliverAntarctica(supabase, user.id, {
      generateLesson: body.generate_lesson !== false,
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Seed failed'
    const status = /token|balance/i.test(message) ? 402 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
