import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { getActiveStudent } from '@/lib/life-explorer/context'
import { trackTokenUsage, validateTokenBalance } from '@/lib/tokens/tracking'
import { putLifeExplorerObject } from '@/lib/life-explorer/media-s3'
import {
  alignReadAloud,
  expectedWords,
  heardWords,
  summarizeResults,
} from '@/lib/life-explorer/read-aloud'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/** GET ?page_id= — latest pass 1 and pass 2 for this page. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pageId = request.nextUrl.searchParams.get('page_id')
  if (!pageId) return NextResponse.json({ error: 'page_id required' }, { status: 400 })

  const { data: rows, error } = await supabase
    .from('le_book_read_alouds')
    .select('*')
    .eq('book_id', bookId)
    .eq('page_id', pageId)
    .order('created_at', { ascending: false })
    .limit(12)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const pass1 = (rows || []).find((r) => r.pass === 1) || null
  const pass2 = (rows || []).find((r) => r.pass === 2) || null
  return NextResponse.json({ pass1, pass2 })
}

/** POST multipart: audio, page_id, pass. Transcribe, align, store. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const student = await getActiveStudent(supabase)
  if (!student) return NextResponse.json({ error: 'No active student' }, { status: 400 })

  const form = await request.formData()
  const audio = form.get('audio') as File | null
  const pageId = String(form.get('page_id') || '')
  const pass = Number(form.get('pass'))
  if (!audio || !pageId || (pass !== 1 && pass !== 2)) {
    return NextResponse.json({ error: 'audio, page_id, and pass (1|2) are required' }, { status: 400 })
  }
  if (audio.size < 200) {
    return NextResponse.json({ error: 'Recording was empty. Try again.' }, { status: 400 })
  }

  const { data: page } = await supabase
    .from('le_book_pages')
    .select('id, book_id, text')
    .eq('id', pageId)
    .eq('book_id', bookId)
    .maybeSingle()
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

  const tokenValidation = await validateTokenBalance(user.id, 80, supabase)
  if (tokenValidation) {
    return NextResponse.json({ error: tokenValidation.error }, { status: tokenValidation.status })
  }

  const buffer = Buffer.from(await audio.arrayBuffer())
  const file = new File([buffer], audio.name || 'reading.webm', {
    type: audio.type || 'audio/webm',
  })

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  })

  const whisperWords = (
    transcription as { words?: Array<{ word?: string }> }
  ).words

  const expected = expectedWords(page.text)
  const heard = heardWords(transcription.text, whisperWords)
  const word_results = alignReadAloud(expected, heard)
  const { hit_count, miss_count } = summarizeResults(word_results)

  const key = `users/${user.id}/homeschool/life-explorer/${student.id}/books/${bookId}/read-aloud/${pageId}-pass${pass}-${Date.now()}.webm`
  const audio_url = await putLifeExplorerObject(key, buffer, audio.type || 'audio/webm')

  const { data: row, error } = await supabase
    .from('le_book_read_alouds')
    .insert({
      book_id: bookId,
      page_id: pageId,
      student_id: student.id,
      created_by: user.id,
      household_id: student.household_id,
      pass,
      expected_text: page.text,
      transcript: transcription.text,
      audio_url,
      duration_seconds: transcription.duration ?? null,
      word_results,
      hit_count,
      miss_count,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await trackTokenUsage(
    {
      user_id: user.id,
      action_type: 'transcription',
      model_used: 'whisper-1',
      tokens_used: Math.ceil((transcription.duration || 1) * 60),
      input_tokens: Math.ceil((transcription.duration || 1) * 60),
      output_tokens: (transcription.text || '').split(/\s+/).length,
      audio_seconds: transcription.duration,
      success: true,
      metadata: {
        kind: 'life_explorer_read_aloud',
        book_id: bookId,
        page_id: pageId,
        pass,
        hit_count,
        miss_count,
      },
    },
    supabase
  )

  return NextResponse.json({ reading: row })
}
