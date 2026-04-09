import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('idea_custom_field_defs')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch custom fields' }, { status: 500 })
    }

    return NextResponse.json({ fields: data || [] })
  } catch (error) {
    console.error('Error in custom-fields GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { name, field_type, options, category_id, sort_order } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('idea_custom_field_defs')
      .insert({
        name: name.trim(),
        field_type: field_type || 'text',
        options: options || null,
        category_id: category_id || null,
        sort_order: sort_order ?? 99,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create custom field' }, { status: 500 })
    }

    return NextResponse.json({ field: data }, { status: 201 })
  } catch (error) {
    console.error('Error in custom-fields POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { id, name, field_type, options, category_id, sort_order } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (field_type !== undefined) updates.field_type = field_type
    if (options !== undefined) updates.options = options
    if (category_id !== undefined) updates.category_id = category_id || null
    if (sort_order !== undefined) updates.sort_order = sort_order

    const { data, error } = await supabase
      .from('idea_custom_field_defs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update custom field' }, { status: 500 })
    }

    return NextResponse.json({ field: data })
  } catch (error) {
    console.error('Error in custom-fields PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('idea_custom_field_defs')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete custom field' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in custom-fields DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
