import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import type { CreateSeriesInput } from '@/lib/cinematic/types'

export async function GET() {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cu_series')
    .select('*, cu_characters(*)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ series: data })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body: CreateSeriesInput = await request.json()
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('auth_user_id', auth.user.id)
    .single()

  const { data, error } = await supabase
    .from('cu_series')
    .insert({
      title: body.title.trim(),
      concept: body.concept ?? null,
      tone: body.tone ?? null,
      style_guide: body.style_guide ?? {},
      platform_targets: body.platform_targets ?? [],
      created_by: staff?.id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ series: data }, { status: 201 })
}
