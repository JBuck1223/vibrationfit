'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

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

export function VisionBoardStudioProvider({ children }: { children: React.ReactNode }) {
  const [itemCount, setItemCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadCount = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { count } = await supabase
      .from('vision_board_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    setItemCount(count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCount()
  }, [loadCount])

  return (
    <VisionBoardStudioContext.Provider
      value={{
        itemCount,
        loading,
        refreshCount: loadCount,
      }}
    >
      {children}
    </VisionBoardStudioContext.Provider>
  )
}
