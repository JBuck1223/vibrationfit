'use client'

import React, { createContext, useContext, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { keys } from '@/lib/query/keys'

interface VisionBoardStudioContextValue {
  itemCount: number
  loading: boolean
  refreshCount: () => Promise<void>
}

const VisionBoardStudioContext = createContext<VisionBoardStudioContextValue | null>(null)

export function useVisionBoardStudio() {
  const ctx = useContext(VisionBoardStudioContext)
  if (!ctx) throw new Error('useVisionBoardStudio must be used within VisionBoardStudioProvider')
  return ctx
}

async function fetchItemCount(): Promise<number> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return 0

  const { count } = await supabase
    .from('vision_board_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return count ?? 0
}

export function VisionBoardStudioProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const { data: itemCount = 0, isLoading: loading } = useQuery({
    queryKey: keys.visionBoardCount,
    queryFn: fetchItemCount,
  })

  const refreshCount = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: keys.visionBoardCount })
  }, [queryClient])

  return (
    <VisionBoardStudioContext.Provider
      value={{
        itemCount,
        loading,
        refreshCount,
      }}
    >
      {children}
    </VisionBoardStudioContext.Provider>
  )
}
