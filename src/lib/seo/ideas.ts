import { createAdminClient } from '@/lib/supabase/admin'

/** Path used for ideas that are not attached to a roadmap page yet. */
export const GENERAL_IDEAS_PATH = '_general'

export type SeoIdeaSource = 'voice' | 'typed'

export type SeoPageIdea = {
  id: string
  page_path: string
  transcript: string
  source: SeoIdeaSource
  audio_seconds: number | null
  applied_at: string | null
  created_by: string | null
  created_at: string
}

const COLUMNS = 'id, page_path, transcript, source, audio_seconds, applied_at, created_by, created_at'

export function normalizeIdeaPath(path: string): string {
  const trimmed = path.trim().replace(/^\/+|\/+$/g, '')
  return trimmed || GENERAL_IDEAS_PATH
}

export async function listIdeas(path?: string): Promise<SeoPageIdea[]> {
  const supabase = createAdminClient()
  let query = supabase.from('seo_page_ideas').select(COLUMNS).order('created_at', { ascending: false })
  if (path) query = query.eq('page_path', normalizeIdeaPath(path))
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as SeoPageIdea[]
}

export async function createIdea(input: {
  path: string
  transcript: string
  source?: SeoIdeaSource
  audioSeconds?: number | null
  userId: string
}): Promise<SeoPageIdea> {
  const transcript = input.transcript.trim()
  if (!transcript) throw new Error('Idea is empty')
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('seo_page_ideas')
    .insert({
      page_path: normalizeIdeaPath(input.path),
      transcript,
      source: input.source ?? 'voice',
      audio_seconds: input.audioSeconds ?? null,
      created_by: input.userId,
    })
    .select(COLUMNS)
    .single()
  if (error) throw new Error(error.message)
  return data as SeoPageIdea
}

export async function setIdeaApplied(id: string, applied: boolean): Promise<SeoPageIdea> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('seo_page_ideas')
    .update({ applied_at: applied ? new Date().toISOString() : null })
    .eq('id', id)
    .select(COLUMNS)
    .single()
  if (error) throw new Error(error.message)
  return data as SeoPageIdea
}

export async function deleteIdea(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('seo_page_ideas').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
