'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Story, StoryEntityType } from '@/lib/stories/types'

type FilterType = 'all' | StoryEntityType

export interface StoryHouseholdMember {
  userId: string
  firstName: string | null
  displayName: string
  avatarUrl: string | null
  isSelf: boolean
  isAdmin: boolean
}

export interface StoryHousehold {
  householdId: string
  householdName: string
  isMultiMember: boolean
  members: StoryHouseholdMember[]
}

interface StoryStudioContextValue {
  stories: Story[]
  loading: boolean
  selectedStoryId: string | null
  selectedStory: Story | null
  selectStory: (id: string) => void
  activePill: string
  setActivePill: (value: string) => void
  refreshStories: () => Promise<void>
  updateTargetId: string | null
  setUpdateTargetId: (id: string) => void
  currentUserId: string | null
  household: StoryHousehold | null
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
  const [updateTargetId, setUpdateTargetId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [household, setHousehold] = useState<StoryHousehold | null>(null)

  useEffect(() => {
    loadStories()
    loadHousehold()
  }, [])

  const loadStories = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) {
      setLoading(false)
      return
    }
    setCurrentUserId(user.id)

    // No user_id filter: RLS returns the user's own stories plus household
    // stories shared with them (explicitly or via a member's share-all mode).
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setStories(data)
      if (!selectedStoryId && data.length > 0) {
        setSelectedStoryId(data[0].id)
      }
    }
    setLoading(false)
  }, [selectedStoryId])

  const loadHousehold = useCallback(async () => {
    try {
      const res = await fetch('/api/household/context')
      if (!res.ok) return
      const json = await res.json()
      if (json.household?.isMultiMember) {
        setHousehold({
          householdId: json.household.householdId,
          householdName: json.household.householdName,
          isMultiMember: json.household.isMultiMember,
          members: (json.household.members || []).map((m: any) => ({
            userId: m.userId,
            firstName: m.firstName ?? null,
            displayName: m.displayName,
            avatarUrl: m.avatarUrl ?? null,
            isSelf: m.isSelf,
            isAdmin: Boolean(m.isAdmin),
          })),
        })
      }
    } catch {
      // Household lens is optional; stories still load without it.
    }
  }, [])

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
        updateTargetId,
        setUpdateTargetId,
        currentUserId,
        household,
      }}
    >
      {children}
    </StoryStudioContext.Provider>
  )
}
