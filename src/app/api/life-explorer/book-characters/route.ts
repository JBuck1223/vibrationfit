import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureStarterCharacters } from '@/lib/life-explorer/book-characters'
import { ensureCharacterPortrait } from '@/lib/life-explorer/book-illustrator'
import type { LeCharacter } from '@/lib/life-explorer/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * GET: the Life Explorers cast for this user. Starter characters get their
 * rows created on first load; portraits generate lazily (first book) or via
 * POST /portrait below.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: student } = await supabase
    .from('le_students')
    .select('id, household_id')
    .eq('active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const characters = await ensureStarterCharacters(supabase, user.id, {
    studentId: student?.id || null,
    householdId: student?.household_id || null,
  })

  return NextResponse.json({ characters })
}

/**
 * POST: create a custom character (e.g. the student as an explorer), or
 * generate a portrait for an existing one ({ portrait_for: characterId }).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  if (body.portrait_for) {
    const { data: row } = await supabase
      .from('le_characters')
      .select('*')
      .eq('id', body.portrait_for)
      .single()
    if (!row) return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    const url = await ensureCharacterPortrait(supabase, user.id, row as LeCharacter)
    if (!url) return NextResponse.json({ error: 'Portrait generation failed' }, { status: 500 })
    return NextResponse.json({ portrait_url: url })
  }

  const name = (body.name || '').trim()
  const personality = (body.personality || '').trim()
  const visualDescription = (body.visual_description || '').trim()
  if (!name || !personality || !visualDescription) {
    return NextResponse.json(
      { error: 'name, personality, and visual_description are required' },
      { status: 400 }
    )
  }

  const { data: student } = await supabase
    .from('le_students')
    .select('id, household_id')
    .eq('active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const slug = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`
  const { data: inserted, error } = await supabase
    .from('le_characters')
    .insert({
      created_by: user.id,
      household_id: student?.household_id || null,
      student_id: student?.id || null,
      slug,
      name,
      species: (body.species || '').trim() || null,
      personality,
      catchphrase: (body.catchphrase || '').trim() || null,
      visual_description: visualDescription,
      is_starter: false,
    })
    .select('*')
    .single()
  if (error || !inserted) {
    return NextResponse.json({ error: error?.message || 'Failed to create character' }, { status: 500 })
  }

  // Portrait generates in the background; the client can poll GET.
  after(async () => {
    await ensureCharacterPortrait(supabase, user.id, inserted as LeCharacter)
  })

  return NextResponse.json({ character: inserted })
}
