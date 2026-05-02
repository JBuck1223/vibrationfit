'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Story, StoryEntityType } from '@/lib/stories/types'

type FilterType = 'all' | StoryEntityType

interface StoryStudioContextValue {
  stories: Story[]
  loading: boolean
  selectedStoryId: string | null
  selectedStory: Story | null
  selectStory: (id: string) => void
  activePill: string
  setActivePill: (value: string) => void
  refreshStories: () => Promise<void>
}

const StoryStudioContext = createContext<StoryStudioContextValue | null>(null)

export function useStoryStudio() {
  const ctx = useContext(StoryStudioContext)
  if (!ctx) throw new Error('useStoryStudio must be used within StoryStudioProvider')
  return ctx
}

export function StoryStudioProvider({ children }: { children: React.ReactNode }) {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)
  const [activePill, setActivePill] = useState('all')

  useEffect(() => {
    loadStories()
  }, [])

  const loadStories = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setStories(data)
      if (!selectedStoryId && data.length > 0) {
        setSelectedStoryId(data[0].id)
      }
    }
    setLoading(false)
  }, [selectedStoryId])

  const selectStory = useCallback((id: string) => {
    setSelectedStoryId(id)
  }, [])

  const selectedStory = stories.find(s => s.id === selectedStoryId) ?? null

  return (
    <StoryStudioContext.Provider
      value={{
        stories,
        loading,
        selectedStoryId,
        selectedStory,
        selectStory,
        activePill,
        setActivePill,
        refreshStories: loadStories,
      }}
    >
      {children}
    </StoryStudioContext.Provider>
  )
}
