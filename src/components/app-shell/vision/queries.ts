'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { keys } from '@/lib/query/keys'
import type { StoryMetadata } from '@/lib/stories/types'

export interface VisionStory {
  id: string
  title: string | null
  word_count: number | null
  metadata: StoryMetadata | null
  created_at: string
}

/**
 * Stories, incantations and SparkQueries the member made from a Life Vision.
 * They live under Tool Box; the Vision page shows these ones too.
 */
export function useStoriesFromVision(limit = 4) {
  return useQuery({
    queryKey: [...keys.stories, 'from-life-vision', limit],
    queryFn: async (): Promise<VisionStory[]> => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase
        .from('stories')
        .select('id, title, word_count, metadata, created_at')
        .eq('user_id', user.id)
        .eq('entity_type', 'life_vision')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(limit)
      return (data ?? []) as VisionStory[]
    },
    staleTime: 60_000,
  })
}
