import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrSeedKits, KIT_SETTINGS_FIELDS } from '@/lib/activation-kit/kits'

/**
 * Activation Kit presets CRUD.
 *
 * GET    /api/activation-kit/kits          — list (lazily seeds a default kit)
 * POST   /api/activation-kit/kits          — create { name, is_default?, ...settings }
 * PATCH  /api/activation-kit/kits          — update { id, ...changes }
 * DELETE /api/activation-kit/kits?id=<id>  — delete
 */

const MUTABLE_FIELDS = ['name', 'is_default', ...KIT_SETTINGS_FIELDS] as const

function pickKitFields(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const field of MUTABLE_FIELDS) {
    if (field in body) out[field] = body[field]
  }
  return out
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const kits = await getOrSeedKits(supabase, user.id)
  return NextResponse.json({ kits })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const fields = pickKitFields(body)

  if (fields.is_default) {
    await supabase
      .from('activation_kits')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true)
  }

  const { data: kit, error } = await supabase
    .from('activation_kits')
    .insert({ ...fields, user_id: user.id })
    .select('*')
    .single()
  if (error || !kit) {
    return NextResponse.json({ error: error?.message || 'Failed to create kit' }, { status: 500 })
  }
  return NextResponse.json({ kit })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'Missing kit id' }, { status: 400 })
  const fields = pickKitFields(body)

  if (fields.is_default) {
    await supabase
      .from('activation_kits')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true)
      .neq('id', body.id)
  }

  const { data: kit, error } = await supabase
    .from('activation_kits')
    .update(fields)
    .eq('id', body.id)
    .eq('user_id', user.id)
    .select('*')
    .single()
  if (error || !kit) {
    return NextResponse.json({ error: error?.message || 'Failed to update kit' }, { status: 500 })
  }
  return NextResponse.json({ kit })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing kit id' }, { status: 400 })

  const { error } = await supabase
    .from('activation_kits')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
