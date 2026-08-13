import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redoBookImage } from '@/lib/life-explorer/book-illustrator'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST: regenerate one illustration (the cover or a single page) with
 * optional parent corrections.
 * Body: { target: 'cover' | '<pageId>', notes?: string }
 *
 * Notes are persisted on the page (revision_notes) so any future retry of
 * that page keeps the correction. Responds immediately; the image is redone
 * in the background and the reader picks it up via its normal polling.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { target?: string; notes?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const target = (body.target || '').trim()
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 1000) : ''
  if (!target) return NextResponse.json({ error: 'target is required' }, { status: 400 })

  const { data: book } = await supabase
    .from('le_books')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (book.status === 'generating') {
    return NextResponse.json(
      { error: 'This book is still illustrating — try again when it finishes' },
      { status: 409 }
    )
  }

  if (target === 'cover') {
    await supabase
      .from('le_books')
      .update({
        cover_url: null,
        status: 'generating',
        status_detail: 'Repainting the cover…',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    after(async () => {
      await redoBookImage(supabase, user.id, id, { kind: 'cover' }, notes || null)
    })
    return NextResponse.json({ ok: true })
  }

  const { data: page } = await supabase
    .from('le_book_pages')
    .select('id, page_number')
    .eq('id', target)
    .eq('book_id', id)
    .maybeSingle()
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

  await Promise.all([
    supabase
      .from('le_book_pages')
      .update({
        image_url: null,
        status: 'pending',
        ...(notes ? { revision_notes: notes } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', page.id),
    supabase
      .from('le_books')
      .update({
        status: 'generating',
        status_detail: `Repainting page ${page.page_number}…`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id),
  ])

  after(async () => {
    await redoBookImage(supabase, user.id, id, { kind: 'page', pageId: page.id }, notes || null)
  })

  return NextResponse.json({ ok: true })
}
