import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { project_id, values } = body

    if (!project_id || !Array.isArray(values)) {
      return NextResponse.json({ error: 'project_id and values array are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    for (const { field_id, value } of values) {
      if (!field_id) continue

      const { error } = await supabase
        .from('idea_custom_field_values')
        .upsert(
          { project_id, field_id, value: value ?? null },
          { onConflict: 'project_id,field_id' }
        )

      if (error) {
        console.error('Error upserting field value:', error)
      }
    }

    const { data: updated } = await supabase
      .from('idea_custom_field_values')
      .select('*, field:idea_custom_field_defs(*)')
      .eq('project_id', project_id)

    return NextResponse.json({ values: updated || [] })
  } catch (error) {
    console.error('Error in custom-field values POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
