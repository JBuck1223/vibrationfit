/**
 * One illustrated Life Explorers book per expedition — a chapter a day.
 * Does not block Today: authored chapter text already lives on the lesson
 * as a passage visual while pictures paint.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { composeAndSaveBook } from './book-composer'
import { ensureStarterCharacters } from './book-characters'
import { ensureCharacterPortrait, illustrateBook } from './book-illustrator'
import { OCEAN_CHAPTERS } from './packs/oceans'
import type { LeBook, LeCharacter, LessonPayload } from './types'

const CREW_SLUGS = ['oliver', 'leila', 'octavia', 'zigzag', 'waffles', 'pip', 'boots']

export async function ensureExpeditionBook(
  supabase: SupabaseClient,
  userId: string,
  options: { studentId: string; expeditionId: string }
): Promise<LeBook | null> {
  const { studentId, expeditionId } = options

  const { data: student } = await supabase
    .from('le_students')
    .select('id, household_id')
    .eq('id', studentId)
    .maybeSingle()

  const characters = await ensureStarterCharacters(supabase, userId, {
    studentId,
    householdId: student?.household_id || null,
  })

  const crew = CREW_SLUGS.map((slug) => characters.find((c) => c.slug === slug)).filter(
    (c): c is LeCharacter => Boolean(c)
  )
  if (crew.length < 3) {
    console.error('le expedition book: missing starter cast')
    return null
  }

  const firstBook = async (): Promise<LeBook | null> => {
    const { data } = await supabase
      .from('le_books')
      .select('*')
      .eq('expedition_id', expeditionId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    return (data as LeBook | null) || null
  }

  let book = await firstBook()
  if (book) {
    await attachBookToLessons(supabase, expeditionId, book.id)
    return book
  }

  const kids = crew.filter((c) => c.slug === 'oliver' || c.slug === 'leila')
  await Promise.all(kids.map((c) => ensureCharacterPortrait(supabase, userId, c)))

  book = await firstBook()
  if (!book) {
    book = await composeAndSaveBook(supabase, userId, {
      studentId,
      expeditionId,
      topic:
        'Ocean Explorers — from the dock to the deep. Five chapters, one week. Oliver and Leila on the Gulf.',
      readingMode: 'i_read',
      characterIds: crew.map((c) => c.id),
      chapters: OCEAN_CHAPTERS,
    })
    const winner = await firstBook()
    if (winner && winner.id !== book.id) {
      await supabase.from('le_book_pages').delete().eq('book_id', book.id)
      await supabase.from('le_books').delete().eq('id', book.id)
      book = winner
    } else {
      void illustrateBook(supabase, userId, book.id).catch((err) =>
        console.error('le expedition book illustrate', err)
      )
    }
  }

  await attachBookToLessons(supabase, expeditionId, book.id)
  return book
}

async function attachBookToLessons(
  supabase: SupabaseClient,
  expeditionId: string,
  bookId: string
): Promise<void> {
  const { data: rows } = await supabase
    .from('le_lessons')
    .select('id, status, payload')
    .eq('expedition_id', expeditionId)

  for (const row of rows || []) {
    if (row.status !== 'ready' && row.status !== 'in_progress') continue
    const payload = (row.payload || {}) as LessonPayload
    if (payload.book_id === bookId) continue
    await supabase
      .from('le_lessons')
      .update({
        payload: { ...payload, book_id: bookId },
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)
  }
}
