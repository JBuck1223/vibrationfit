import type { SupabaseClient } from '@supabase/supabase-js'
import type { StoryEntityType, StoryMetadata } from './types'

interface CreateStoryRecordParams {
  userId: string
  entityType: StoryEntityType
  entityId: string
  title?: string | null
  metadata?: StoryMetadata
  source?: 'ai_generated' | 'user_written' | 'ai_assisted'
  status?: 'draft' | 'generating' | 'completed'
}

export async function getNextStoryDisplayOrder(
  supabase: SupabaseClient,
  userId: string,
  entityType: StoryEntityType,
  entityId: string
): Promise<number> {
  const { data } = await supabase
    .from('stories')
    .select('display_order')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data?.display_order ?? 0) + 1
}

/** Insert a new story row with no audio attachments. */
export async function createFreshStoryRecord(
  supabase: SupabaseClient,
  params: CreateStoryRecordParams
): Promise<{ id: string }> {
  const displayOrder = await getNextStoryDisplayOrder(
    supabase,
    params.userId,
    params.entityType,
    params.entityId
  )

  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: params.userId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      title: params.title ?? null,
      metadata: params.metadata ?? {},
      source: params.source ?? 'ai_generated',
      status: params.status ?? 'generating',
      generation_count: 1,
      display_order: displayOrder,
      audio_set_id: null,
      user_audio_url: null,
      user_audio_duration_seconds: null,
    })
    .select('id')
    .single()

  if (error || !data) {
    throw error || new Error('Failed to create story record')
  }

  return data
}
