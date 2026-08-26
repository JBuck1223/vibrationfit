import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { composeAndSaveBook } from '@/lib/life-explorer/book-composer'
import { illustrateBook } from '@/lib/life-explorer/book-illustrator'
import { loadActiveContext } from '@/lib/life-explorer/context'
import { weeklyLifeLearningFocus } from '@/lib/life-explorer/life-learning'
import { computeYearMap, untouchedIdeas } from '@/lib/life-explorer/year-map'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export interface BookTopicIdea {
  topic: string
  source: 'life_learning' | 'year_map'
  label: string
}

/**
 * Book topic ideas that pull learning forward: this week's Life Learning
 * focus and Big Ideas the year hasn't met yet.
 */
async function loadTopicIdeas(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<BookTopicIdea[]> {
  const ctx = await loadActiveContext(supabase)
  if (!ctx) return []

  const ideas: BookTopicIdea[] = []

  const focus = weeklyLifeLearningFocus(ctx.skills)
  ideas.push({
    topic: `${focus.resource.name}: ${focus.rung.label}`,
    source: 'life_learning',
    label: focus.resource.name,
  })

  const since = new Date(Date.now() - 300 * 86_400_000).toISOString()
  const [lessons, evidence, logs] = await Promise.all([
    supabase
      .from('le_lessons')
      .select('payload, created_at, status')
      .eq('student_id', ctx.student.id)
      .gte('created_at', since),
    supabase
      .from('le_learning_evidence')
      .select('academic_tags, created_at')
      .eq('student_id', ctx.student.id)
      .gte('created_at', since),
    supabase
      .from('le_activity_logs')
      .select('subjects, entry_date')
      .eq('student_id', ctx.student.id)
      .gte('entry_date', since.slice(0, 10)),
  ])
  const yearMap = computeYearMap({
    lessons: (lessons.data || []) as never,
    evidence: (evidence.data || []) as never,
    activityLogs: (logs.data || []) as never,
  })
  for (const idea of untouchedIdeas(yearMap).slice(0, 3)) {
    ideas.push({
      topic: idea.kid_prompt,
      source: 'year_map',
      label: idea.subject === 'science' ? 'Science' : 'Social studies',
    })
  }

  return ideas
}

/** GET: the student's bookshelf (newest first). ?ideas=1 adds topic ideas. */
export async function GET(request: NextRequest) {
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

  // Ideas only on the initial page load — the bookshelf polls this
  // endpoint while illustrating and doesn't need them recomputed.
  let topicIdeas: BookTopicIdea[] = []
  if (request.nextUrl.searchParams.get('ideas') === '1') {
    try {
      topicIdeas = await loadTopicIdeas(supabase)
    } catch {
      // Ideas are decorative; never fail the bookshelf for them.
    }
  }

  return NextResponse.json({ books: data || [], topic_ideas: topicIdeas })
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
