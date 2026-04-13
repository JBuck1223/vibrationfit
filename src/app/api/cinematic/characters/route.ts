import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import type { CreateCharacterInput } from '@/lib/cinematic/types'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const seriesId = searchParams.get('series_id')

  const supabase = createAdminClient()
  let query = supabase.from('cu_characters').select('*').order('name')

  if (seriesId) {
    query = query.or(`series_id.eq.${seriesId},series_id.is.null`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ characters: data })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body: CreateCharacterInput = await request.json()
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cu_characters')
    .insert({
      series_id: body.series_id ?? null,
      name: body.name.trim(),
      description: body.description ?? null,
      reference_images: body.reference_images ?? [],
      style_notes: body.style_notes ?? null,
      character_type: body.character_type ?? 'generated',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ character: data }, { status: 201 })
}
