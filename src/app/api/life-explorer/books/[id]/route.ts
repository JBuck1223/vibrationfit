import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { illustrateBook } from '@/lib/life-explorer/book-illustrator'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** GET: one book with its pages and cast — used by the reader and for progress polling. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: book, error } = await supabase
    .from('le_books')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [{ data: pages }, { data: characters }] = await Promise.all([
    supabase
      .from('le_book_pages')
      .select('*')
      .eq('book_id', id)
      .order('page_number', { ascending: true }),
    supabase
      .from('le_characters')
      .select('id, name, species, catchphrase, portrait_url')
      .in(
        'id',
        (book.character_ids as string[])?.length
          ? (book.character_ids as string[])
          : ['00000000-0000-0000-0000-000000000000']
      ),
  ])

  return NextResponse.json({ book, pages: pages || [], characters: characters || [] })
}

/** POST: resume/retry illustration for a stuck or failed book. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: book } = await supabase.from('le_books').select('id, status').eq('id', id).maybeSingle()
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await supabase
    .from('le_books')
    .update({ status: 'generating', status_detail: 'Picking the paintbrushes back up…', updated_at: new Date().toISOString() })
    .eq('id', id)

  after(async () => {
    await illustrateBook(supabase, user.id, id)
  })

  return NextResponse.json({ ok: true })
}

/** DELETE: remove a book (pages cascade). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('le_books').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
