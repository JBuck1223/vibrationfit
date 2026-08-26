/**
 * Storybook illustration pipeline.
 *
 * Consistency strategy:
 * 1. Each book gets ONE generated "cast lineup sheet" — every character in the
 *    book standing side by side on a plain background, generated from text.
 *    (Passing multiple separate portraits made the edit model blend
 *    characters together — chipmunk head on a penguin body. One reference
 *    with all the characters in it avoids cross-image feature mixing.)
 * 2. Each book also gets ONE "setting plate" — an empty wide shot of the
 *    story's setting with no characters in it. It anchors every page to the
 *    same location so backgrounds stop drifting (Antarctica staying
 *    Antarctica instead of becoming a grassy field).
 * 3. Cover and pages are edited from those two labeled references, with the
 *    setting description repeated in text and feature-blending forbidden.
 * 4. Pages can be regenerated individually with parent "art director" notes
 *    (le_book_pages.revision_notes), re-applied on any future retry.
 *
 * The edit model and style bible are admin-editable in ai_tools
 * (tool_key: life_explorer_storybook_illustrator).
 *
 * Runs fire-and-forget after the composer saves the book; progress is
 * written to le_books.status_detail so the client can poll.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { generateImage, editImage } from '@/lib/services/imageService'
import { buildPortraitPrompt, isHumanSpecies } from './book-characters'
import { loadStorybookIllustratorConfig } from './book-tools-config'
import type { LeBook, LeBookPage, LeCharacter } from './types'

async function setBookProgress(
  supabase: SupabaseClient,
  bookId: string,
  detail: string
): Promise<void> {
  await supabase
    .from('le_books')
    .update({ status_detail: detail, updated_at: new Date().toISOString() })
    .eq('id', bookId)
}

/**
 * Generate (once) and return a character's portrait URL.
 * Used for character avatars in the library UI — the book pipeline itself
 * uses the per-book cast sheet instead.
 */
export async function ensureCharacterPortrait(
  supabase: SupabaseClient,
  userId: string,
  character: LeCharacter
): Promise<string | null> {
  if (character.portrait_url) return character.portrait_url

  const result = await generateImage({
    userId,
    prompt: buildPortraitPrompt(character),
    dimension: 'square',
    context: 'custom',
  })
  if (!result.success || !result.imageUrl) {
    console.error('le book: portrait generation failed for', character.name, result.error)
    return null
  }

  await supabase
    .from('le_characters')
    .update({ portrait_url: result.imageUrl, updated_at: new Date().toISOString() })
    .eq('id', character.id)

  return result.imageUrl
}

function characterLabel(c: LeCharacter): string {
  if (isHumanSpecies(c.species) || !c.species) return c.name
  return `${c.name} the ${c.species}`
}

/** Prompt for the one-per-book cast lineup sheet (text-to-image, no refs). */
function castSheetPrompt(characters: LeCharacter[], styleBible: string): string {
  const lineup = characters
    .map((c, i) => `${i + 1}. ${characterLabel(c)}: ${c.visual_description}`)
    .join(' ')
  return [
    `Character lineup sheet for a children's picture book: ${characters.length} characters standing side by side in a single row, evenly spaced, all facing the viewer, full body.`,
    `From left to right: ${lineup}`,
    'Each character is one complete figure — a child or an animal, never a child head on an animal body. Its own head, its own body, its own limbs. No character touches or overlaps another.',
    'Plain soft cream background, no scenery, no props beyond what each character wears or carries.',
    styleBible,
  ].join(' ')
}

/** Prompt for the one-per-book setting plate (text-to-image, no refs). */
function settingPlatePrompt(setting: string, styleBible: string): string {
  return [
    `Establishing shot for a children's picture book — the empty stage where the whole story happens: ${setting}`,
    'Wide view of the location only. Absolutely no characters, no animals, no people, no figures of any kind.',
    styleBible,
  ].join(' ')
}

/**
 * Scene prompt for the cover or a page. References: the cast lineup sheet
 * (characters) and, when available, the setting plate (location). Only the
 * characters actually in the scene get appearance descriptions, and blending
 * features between characters is explicitly banned.
 */
function scenePrompt(options: {
  imagePrompt: string
  inScene: LeCharacter[]
  allCharacters: LeCharacter[]
  styleBible: string
  setting?: string | null
  hasSettingPlate: boolean
  revisionNotes?: string | null
}): string {
  const { imagePrompt, inScene, allCharacters, styleBible, setting, hasSettingPlate, revisionNotes } = options
  const lineup = allCharacters.map((c) => characterLabel(c)).join(', ')
  const appearances = inScene
    .map((c) => `${characterLabel(c)} looks exactly as in the lineup: ${c.visual_description}`)
    .join(' ')
  const parts = [
    `Children's picture-book illustration: ${imagePrompt}`,
    `The first reference image is the official character lineup, left to right: ${lineup}.`,
  ]
  if (hasSettingPlate) {
    parts.push(
      'The second reference image is the story\u2019s setting — this scene takes place in that exact location. Match its terrain, colors, weather, and lighting.'
    )
  }
  if (setting) {
    parts.push(`SETTING (never change it): ${setting}`)
  }
  parts.push(
    appearances,
    'CRITICAL: each character is ONE complete figure — a human child stays a human child, an animal stays that animal — head, body, limbs, and colors all belong to that same character, exactly as in the lineup. Never put a child head on an animal body. Never mix, merge, or swap features between characters.',
    'Do not include any characters that are not named in this scene.'
  )
  if (revisionNotes && revisionNotes.trim()) {
    parts.push(`ART DIRECTOR CORRECTIONS (must be followed): ${revisionNotes.trim()}`)
  }
  parts.push(styleBible)
  return parts.join(' ')
}

/** Characters whose name appears in the image prompt; all of them as fallback. */
function charactersInScene(imagePrompt: string, characters: LeCharacter[]): LeCharacter[] {
  const lower = imagePrompt.toLowerCase()
  const mentioned = characters.filter((c) => lower.includes(c.name.toLowerCase()))
  return mentioned.length > 0 ? mentioned : characters
}

interface BookContext {
  book: LeBook
  pages: LeBookPage[]
  characters: LeCharacter[]
  editModel: string
  styleBible: string
}

async function loadBookContext(supabase: SupabaseClient, bookId: string): Promise<BookContext> {
  const { data: bookRow } = await supabase
    .from('le_books')
    .select('*')
    .eq('id', bookId)
    .single()
  const book = bookRow as LeBook | null
  if (!book) throw new Error('Book not found')

  const { data: pageRows } = await supabase
    .from('le_book_pages')
    .select('*')
    .eq('book_id', bookId)
    .order('page_number', { ascending: true })
  const pages = (pageRows || []) as LeBookPage[]

  const { data: charRows } = await supabase
    .from('le_characters')
    .select('*')
    .in('id', book.character_ids.length ? book.character_ids : ['00000000-0000-0000-0000-000000000000'])
  const characters = (charRows || []) as LeCharacter[]
  if (characters.length === 0) throw new Error('Book has no characters')

  const { editModel, styleBible } = await loadStorybookIllustratorConfig(supabase)
  return { book, pages, characters, editModel, styleBible }
}

/** Generate (once) the cast lineup sheet; returns its URL. */
async function ensureCastSheet(
  supabase: SupabaseClient,
  userId: string,
  ctx: BookContext
): Promise<string> {
  if (ctx.book.cast_sheet_url) return ctx.book.cast_sheet_url
  await setBookProgress(supabase, ctx.book.id, 'Drawing the cast lineup…')
  const sheet = await generateImage({
    userId,
    prompt: castSheetPrompt(ctx.characters, ctx.styleBible),
    dimension: 'landscape_4_3',
    context: 'custom',
  })
  if (!sheet.success || !sheet.imageUrl) {
    throw new Error(sheet.error || 'Cast sheet generation failed')
  }
  await supabase
    .from('le_books')
    .update({ cast_sheet_url: sheet.imageUrl, updated_at: new Date().toISOString() })
    .eq('id', ctx.book.id)
  ctx.book.cast_sheet_url = sheet.imageUrl
  return sheet.imageUrl
}

/**
 * Generate (once) the setting plate; returns its URL, or null for legacy
 * books that were composed before the writer produced a setting.
 */
async function ensureSettingPlate(
  supabase: SupabaseClient,
  userId: string,
  ctx: BookContext
): Promise<string | null> {
  if (ctx.book.setting_plate_url) return ctx.book.setting_plate_url
  if (!ctx.book.setting) return null
  await setBookProgress(supabase, ctx.book.id, 'Painting the setting…')
  const plate = await generateImage({
    userId,
    prompt: settingPlatePrompt(ctx.book.setting, ctx.styleBible),
    dimension: 'landscape_4_3',
    context: 'custom',
  })
  if (!plate.success || !plate.imageUrl) {
    // Non-fatal: pages fall back to the textual setting anchor only.
    console.error('le book: setting plate generation failed', plate.error)
    return null
  }
  await supabase
    .from('le_books')
    .update({ setting_plate_url: plate.imageUrl, updated_at: new Date().toISOString() })
    .eq('id', ctx.book.id)
  ctx.book.setting_plate_url = plate.imageUrl
  return plate.imageUrl
}

/** Render one scene (cover or page) from the book's reference images. */
async function renderScene(
  userId: string,
  ctx: BookContext,
  refs: string[],
  imagePrompt: string,
  revisionNotes?: string | null
) {
  return editImage({
    userId,
    imageUrls: refs,
    prompt: scenePrompt({
      imagePrompt,
      inScene: charactersInScene(imagePrompt, ctx.characters),
      allCharacters: ctx.characters,
      styleBible: ctx.styleBible,
      setting: ctx.book.setting,
      hasSettingPlate: refs.length > 1,
      revisionNotes,
    }),
    dimension: 'square',
    context: 'life_explorer_book',
    model: ctx.editModel,
  })
}

function coverImagePrompt(book: LeBook): string {
  return book.cover_image_prompt || `The cover of "${book.title}": ${book.premise || book.topic}`
}

/**
 * Illustrate every page of a book. Safe to re-run: existing cast sheet,
 * setting plate, cover, and already-ready pages are skipped, so a failed
 * run can be resumed.
 */
export async function illustrateBook(
  supabase: SupabaseClient,
  userId: string,
  bookId: string
): Promise<void> {
  try {
    const ctx = await loadBookContext(supabase, bookId)

    // 1. Reference images: cast lineup + setting plate
    const castSheetUrl = await ensureCastSheet(supabase, userId, ctx)
    const settingPlateUrl = await ensureSettingPlate(supabase, userId, ctx)
    const refs = settingPlateUrl ? [castSheetUrl, settingPlateUrl] : [castSheetUrl]

    // 2. Cover
    if (!ctx.book.cover_url) {
      await setBookProgress(supabase, bookId, 'Painting the cover…')
      const cover = await renderScene(userId, ctx, refs, coverImagePrompt(ctx.book))
      if (!cover.success || !cover.imageUrl) {
        throw new Error(cover.error || 'Cover generation failed')
      }
      ctx.book.cover_url = cover.imageUrl
      await supabase
        .from('le_books')
        .update({ cover_url: cover.imageUrl, updated_at: new Date().toISOString() })
        .eq('id', bookId)
    }

    // 3. Pages, in order
    let failedPages = 0
    for (const page of ctx.pages) {
      if (page.status === 'ready' && page.image_url) continue
      await setBookProgress(
        supabase,
        bookId,
        `Illustrating page ${page.page_number} of ${ctx.pages.length}…`
      )
      const result = await renderScene(userId, ctx, refs, page.image_prompt, page.revision_notes)
      if (result.success && result.imageUrl) {
        await supabase
          .from('le_book_pages')
          .update({
            image_url: result.imageUrl,
            status: 'ready',
            updated_at: new Date().toISOString(),
          })
          .eq('id', page.id)
      } else {
        failedPages += 1
        console.error(`le book: page ${page.page_number} failed`, result.error)
        await supabase
          .from('le_book_pages')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', page.id)
      }
    }

    await supabase
      .from('le_books')
      .update({
        status: 'ready',
        status_detail:
          failedPages > 0
            ? `Ready — ${failedPages} page illustration${failedPages === 1 ? '' : 's'} didn't come out (text still shows)`
            : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookId)
  } catch (err) {
    console.error('le book: illustration pipeline failed', err)
    await supabase
      .from('le_books')
      .update({
        status: 'failed',
        status_detail: err instanceof Error ? err.message : 'Illustration failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookId)
  }
}

/**
 * Regenerate a single image (the cover or one page) with optional parent
 * corrections. The caller is expected to have already persisted
 * revision_notes / cleared the image and set the book to 'generating' so the
 * reader shows progress immediately.
 */
export async function redoBookImage(
  supabase: SupabaseClient,
  userId: string,
  bookId: string,
  target: { kind: 'cover' } | { kind: 'page'; pageId: string },
  notes?: string | null
): Promise<void> {
  try {
    const ctx = await loadBookContext(supabase, bookId)
    const castSheetUrl = await ensureCastSheet(supabase, userId, ctx)
    const settingPlateUrl = await ensureSettingPlate(supabase, userId, ctx)
    const refs = settingPlateUrl ? [castSheetUrl, settingPlateUrl] : [castSheetUrl]

    if (target.kind === 'cover') {
      await setBookProgress(supabase, bookId, 'Repainting the cover…')
      const cover = await renderScene(userId, ctx, refs, coverImagePrompt(ctx.book), notes)
      if (!cover.success || !cover.imageUrl) {
        throw new Error(cover.error || 'Cover regeneration failed')
      }
      await supabase
        .from('le_books')
        .update({ cover_url: cover.imageUrl, updated_at: new Date().toISOString() })
        .eq('id', bookId)
    } else {
      const page = ctx.pages.find((p) => p.id === target.pageId)
      if (!page) throw new Error('Page not found')
      await setBookProgress(supabase, bookId, `Repainting page ${page.page_number}…`)
      const result = await renderScene(
        userId,
        ctx,
        refs,
        page.image_prompt,
        notes ?? page.revision_notes
      )
      if (!result.success || !result.imageUrl) {
        await supabase
          .from('le_book_pages')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', page.id)
        throw new Error(result.error || 'Page regeneration failed')
      }
      await supabase
        .from('le_book_pages')
        .update({
          image_url: result.imageUrl,
          status: 'ready',
          updated_at: new Date().toISOString(),
        })
        .eq('id', page.id)
    }

    await supabase
      .from('le_books')
      .update({ status: 'ready', status_detail: null, updated_at: new Date().toISOString() })
      .eq('id', bookId)
  } catch (err) {
    console.error('le book: image redo failed', err)
    await supabase
      .from('le_books')
      .update({
        status: 'ready',
        status_detail: err instanceof Error ? err.message : 'Image redo failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookId)
  }
}
