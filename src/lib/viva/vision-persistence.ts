// src/lib/viva/vision-persistence.ts
// Helper functions for persisting vision paragraphs with version handling

import { SupabaseClient } from '@supabase/supabase-js'

export const CATEGORIES = [
  "forward", "fun", "travel", "home", "family", "romance", "health",
  "money", "business", "social", "possessions", "giving", "spirituality", "conclusion"
] as const

export type Category = typeof CATEGORIES[number]

export interface SaveOptions {
  sources?: any // {profile_id, assessment_id, mode, input_hash}
  derivation_map?: any // { [cat]: [{from,to}] }
}

/**
 * Saves a vision paragraph to the database with version handling
 * Creates a new draft version if none exists, or updates the current draft
 */
export async function saveVisionParagraph(
  supabase: SupabaseClient,
  userId: string,
  category: Category,
  text: string,
  options?: SaveOptions
) {
  // 1) Get latest vision
  const { data: latest, error: fetchError } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', userId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError) {
    console.error('Error fetching latest vision:', fetchError)
    throw new Error('Failed to fetch vision data')
  }

  let draft = latest

  // 2) Create new draft if none exists or if latest is not draft
  if (!draft || (draft as any).status !== 'draft') {
    const nextVersion = (latest?.version_number ?? 0) + 1
    const { data: created, error: createError } = await supabase
      .from('vision_versions')
      .insert({
        user_id: userId,
        version_number: nextVersion,
        title: `Life I Choose v${nextVersion}`,
        status: 'draft',
        completion_percent: 0,
        ai_generated: true,
        ...(options?.sources ? { sources: options.sources } : {})
      })
      .select('*')
      .single()

    if (createError) {
      console.error('Error creating new vision:', createError)
      throw new Error('Failed to create vision version')
    }

    draft = created
  }

  // 3) Update the category field
  const updateData: any = {
    [category]: text
  }

  if (options?.derivation_map) {
    updateData.derivation_map = options.derivation_map
  }

  const { data: updated, error: updateError } = await supabase
    .from('vision_versions')
    .update(updateData)
    .eq('id', draft!.id)
    .select('*')
    .single()

  if (updateError) {
    console.error('Error updating vision:', updateError)
    throw new Error('Failed to update vision')
  }

  // 4) Recompute completion percentage
  const filled = CATEGORIES.filter(c => {
    const content = (updated as any)?.[c]
    return content && typeof content === 'string' && content.trim().length > 0
  }).length

  const completion_percent = Math.round((filled / CATEGORIES.length) * 100)

  // 5) Update completion if changed
  if (completion_percent !== (updated as any)?.completion_percent) {
    await supabase
      .from('vision_versions')
      .update({ completion_percent })
      .eq('id', draft!.id)
  }

  return {
    id: draft!.id,
    version_number: draft!.version_number,
    completion_percent
  }
}
