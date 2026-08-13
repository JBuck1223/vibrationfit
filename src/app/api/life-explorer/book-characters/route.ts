import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { STARTER_CHARACTERS } from '@/lib/life-explorer/book-characters'
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

  const { data: existingRows, error } = await supabase
    .from('le_characters')
    .select('*')
    .order('is_starter', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let characters = (existingRows || []) as LeCharacter[]
  const existingSlugs = new Set(characters.map((c) => c.slug))
  const missing = STARTER_CHARACTERS.filter((s) => !existingSlugs.has(s.slug))

  if (missing.length > 0) {
    const { data: student } = await supabase
      .from('le_students')
      .select('household_id')
      .eq('active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    const { data: inserted, error: insertError } = await supabase
      .from('le_characters')
      .insert(
        missing.map((s) => ({
          created_by: user.id,
          household_id: student?.household_id || null,
          slug: s.slug,
          name: s.name,
          species: s.species,
          personality: s.personality,
          catchphrase: s.catchphrase,
          visual_description: s.visual_description,
          is_starter: true,
        }))
      )
      .select('*')
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
    characters = [...characters, ...((inserted || []) as LeCharacter[])]
  }

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
