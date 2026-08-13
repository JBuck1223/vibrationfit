/**
 * Story composer — writes the complete book text via the AI gateway and
 * persists le_books + le_book_pages. Illustration runs afterwards
 * (see book-illustrator.ts).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { gatewayClient } from '@/lib/ai/gateway'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { READING_LADDER, currentLadderPosition } from './ladders'
import { weeklySightWords } from './sight-words'
import { buildBookUserPrompt } from './book-prompts'
import { BOOK_STYLE_BIBLE } from './book-characters'
import { loadStorybookWriterConfig } from './book-tools-config'
import type { LeBook, LeCharacter, LeSkillProgress, LeStudent, BookReadingMode } from './types'

interface ComposedBook {
  title: string
  premise: string
  setting?: string
  facts_taught?: string[]
  cover_image_prompt: string
  pages: Array<{ text: string; image_prompt: string }>
}

function parseComposedBook(text: string): ComposedBook {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Book response contained no JSON')
    parsed = JSON.parse(match[0])
  }
  const book = parsed as ComposedBook
  if (!book?.title || !Array.isArray(book.pages) || book.pages.length < 6) {
    throw new Error('Book payload missing title or enough pages')
  }
  return book
}

export interface CreateBookInput {
  studentId?: string
  topic: string
  readingMode: BookReadingMode
  characterIds: string[]
}

export async function composeAndSaveBook(
  supabase: SupabaseClient,
  userId: string,
  input: CreateBookInput
): Promise<LeBook> {
  // Student (explicit id or the active one)
  let studentQuery = supabase.from('le_students').select('*').eq('active', true)
  if (input.studentId) studentQuery = studentQuery.eq('id', input.studentId)
  const { data: studentRow } = await studentQuery
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  const student = studentRow as LeStudent | null
  if (!student) throw new Error('No active student')

  const { data: expedition } = await supabase
    .from('le_expeditions')
    .select('id, title')
    .eq('student_id', student.id)
    .eq('status', 'active')
    .maybeSingle()

  const { data: charRows } = await supabase
    .from('le_characters')
    .select('*')
    .in('id', input.characterIds)
  const characters = (charRows || []) as LeCharacter[]
  if (characters.length === 0) throw new Error('Pick at least one Life Explorer character')

  // Reading-level vocabulary for "I read it" mode
  let decodableWords: string[] | undefined
  let sightWords: string[] | undefined
  if (input.readingMode === 'i_read') {
    const { data: skills } = await supabase
      .from('le_skill_progress')
      .select('*')
      .eq('student_id', student.id)
    const readingPos = currentLadderPosition(
      READING_LADDER,
      (skills || []) as LeSkillProgress[],
      student.grade_level
    )
    decodableWords = readingPos.current_rung.decodable_words || []
    // Wide window — a book needs more vocabulary than the weekly 12 cards.
    sightWords = weeklySightWords(new Date(), 60)
  }

  const userPrompt = buildBookUserPrompt({
    studentName: student.name,
    gradeLevel: student.grade_level,
    topic: input.topic,
    readingMode: input.readingMode,
    characters: characters.map((c) => ({
      name: c.name,
      species: c.species,
      personality: c.personality,
      catchphrase: c.catchphrase,
      visual_description: c.visual_description,
    })),
    expeditionTitle: expedition?.title || null,
    decodableWords,
    sightWords,
  })

  // Model, temperature, token budget, and system prompt are admin-editable
  // (/admin/ai-models → Tools → Life Explorer Storybook Writer).
  const writerConfig = await loadStorybookWriterConfig(supabase)
  const estimated = estimateTokensForText(userPrompt, writerConfig.gatewayModel)
  const tokenValidation = await validateTokenBalance(userId, estimated, supabase)
  if (tokenValidation) throw new Error(tokenValidation.error)

  // NOTE: the AI gateway rejects response_format ("400 Invalid input"),
  // so JSON-only output is enforced by the prompt and parseComposedBook.
  // Reasoning models reject temperature and use max_completion_tokens.
  const completion = await gatewayClient.chat.completions.create({
    model: writerConfig.gatewayModel,
    ...(writerConfig.supportsTemperature ? { temperature: writerConfig.temperature } : {}),
    ...(writerConfig.maxTokensParam === 'max_completion_tokens'
      ? { max_completion_tokens: writerConfig.maxTokens }
      : { max_tokens: writerConfig.maxTokens }),
    messages: [
      { role: 'system', content: writerConfig.systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })

  const content = completion.choices[0]?.message?.content
  if (!content) throw new Error('No story generated')
  const composed = parseComposedBook(content)

  await trackTokenUsage(
    {
      user_id: userId,
      action_type: 'life_explorer_book',
      model_used: writerConfig.modelName,
      tokens_used:
        (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0),
      input_tokens: completion.usage?.prompt_tokens || 0,
      output_tokens: completion.usage?.completion_tokens || 0,
      openai_request_id: completion.id,
      success: true,
      metadata: {
        topic: input.topic,
        reading_mode: input.readingMode,
        page_count: composed.pages.length,
      },
    },
    supabase
  )

  const { data: bookRow, error: bookError } = await supabase
    .from('le_books')
    .insert({
      student_id: student.id,
      expedition_id: expedition?.id || null,
      created_by: userId,
      household_id: student.household_id,
      title: composed.title,
      premise: composed.premise || null,
      topic: input.topic,
      reading_mode: input.readingMode,
      status: 'generating',
      status_detail: 'Story written — warming up the paintbrushes…',
      cover_image_prompt: composed.cover_image_prompt || null,
      setting: typeof composed.setting === 'string' && composed.setting.trim()
        ? composed.setting.trim()
        : null,
      facts_taught: Array.isArray(composed.facts_taught)
        ? composed.facts_taught.filter((f) => typeof f === 'string' && f.trim()).slice(0, 6)
        : [],
      style_notes: BOOK_STYLE_BIBLE,
      character_ids: characters.map((c) => c.id),
      page_count: composed.pages.length,
    })
    .select('*')
    .single()
  if (bookError || !bookRow) {
    throw new Error(bookError?.message || 'Failed to save book')
  }
  const book = bookRow as LeBook

  const pageInserts = composed.pages.map((p, i) => ({
    book_id: book.id,
    created_by: userId,
    household_id: student.household_id,
    page_number: i + 1,
    text: p.text,
    image_prompt: p.image_prompt,
    status: 'pending',
  }))
  const { error: pagesError } = await supabase.from('le_book_pages').insert(pageInserts)
  if (pagesError) {
    await supabase.from('le_books').delete().eq('id', book.id)
    throw new Error(pagesError.message)
  }

  return book
}
