import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dashboardLayoutSchema, normalizeLayout } from '@/lib/dashboard/layout'

/**
 * GET /api/dashboard/layout — the member's widget layout (normalized against the registry).
 * PUT /api/dashboard/layout — replace the layout. Body: DashboardLayout.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabase
    .from('member_dashboard_layouts')
    .select('layout')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ layout: normalizeLayout(data?.layout ?? null) })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = dashboardLayoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid layout', issues: parsed.error.issues }, { status: 400 })
  }

  const layout = normalizeLayout(parsed.data)

  const { error: upsertError } = await supabase
    .from('member_dashboard_layouts')
    .upsert({ user_id: user.id, layout }, { onConflict: 'user_id' })

  if (upsertError) {
    console.error('Error saving dashboard layout:', upsertError)
    return NextResponse.json({ error: 'Failed to save layout' }, { status: 500 })
  }

  return NextResponse.json({ layout })
}
