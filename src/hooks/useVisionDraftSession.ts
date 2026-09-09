'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { keys } from '@/lib/query/keys'
import {
  loadDraftSession,
  type DraftSessionPayload,
} from '@/lib/life-vision/draft-session'

export function useVisionDraftSession(draftId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: [...keys.visionDraftSession, draftId || ''],
    enabled: Boolean(draftId) && enabled,
    queryFn: async (): Promise<DraftSessionPayload | null> => {
      const supabase = createClient()
      return loadDraftSession(supabase, draftId!)
    },
  })
}
