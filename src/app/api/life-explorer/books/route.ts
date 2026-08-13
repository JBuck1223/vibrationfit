import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { composeAndSaveBook } from '@/lib/life-explorer/book-composer'
import { illustrateBook } from '@/lib/life-explorer/book-illustrator'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** GET: the student's bookshelf (newest first). */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('le_books')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ books: data || [] })
}

/**
 * POST: write a new book (topic + characters + reading mode), then
 * illustrate it in the background. Returns the book row immediately after
 * the story text is written; the client polls GET /books/[id] for pages.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const topic = (body.topic || '').trim()
  const readingMode = body.reading_mode === 'i_read' ? 'i_read' : 'read_to_me'
  const characterIds = Array.isArray(body.character_ids) ? (body.character_ids as string[]) : []

  if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 })
  if (characterIds.length === 0 || characterIds.length > 3) {
    return NextResponse.json({ error: 'Pick 1 to 3 characters' }, { status: 400 })
  }

  try {
    const book = await composeAndSaveBook(supabase, user.id, {
      studentId: body.student_id,
      topic,
      readingMode,
      characterIds,
    })

    after(async () => {
      await illustrateBook(supabase, user.id, book.id)
    })

    return NextResponse.json({ book })
  } catch (err) {
    console.error('le book compose failed', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Book generation failed' },
      { status: 500 }
    )
  }
}
