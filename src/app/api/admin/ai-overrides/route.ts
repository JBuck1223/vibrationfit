import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@/lib/supabase/server'

// Admin-only CRUD for ai_action_token_overrides

export async function GET() {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('ai_action_token_overrides')
      .select('*')
      .order('action_type')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ overrides: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action_type, token_value } = await req.json()
    if (!action_type || typeof token_value !== 'number') {
      return NextResponse.json({ error: 'action_type and token_value required' }, { status: 400 })
    }
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('ai_action_token_overrides')
      .upsert({ action_type, token_value, updated_at: new Date().toISOString() })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ override: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { action_type, token_value } = await req.json()
    if (!action_type || typeof token_value !== 'number') {
      return NextResponse.json({ error: 'action_type and token_value required' }, { status: 400 })
    }
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('ai_action_token_overrides')
      .update({ token_value, updated_at: new Date().toISOString() })
      .eq('action_type', action_type)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ override: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action_type = searchParams.get('action_type')
    if (!action_type) {
      return NextResponse.json({ error: 'action_type required' }, { status: 400 })
    }
    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('ai_action_token_overrides')
      .delete()
      .eq('action_type', action_type)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}


