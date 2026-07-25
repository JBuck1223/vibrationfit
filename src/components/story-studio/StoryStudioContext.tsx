'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { keys } from '@/lib/query/keys'
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

interface StoriesPayload {
  stories: Story[]
  userId: string | null
}

async function fetchStories(): Promise<StoriesPayload> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return { stories: [], userId: null }

  // No user_id filter: RLS returns the user's own stories plus household
  // stories shared with them (explicitly or via a member's share-all mode).
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('updated_at', { ascending: false })

  return { stories: !error && data ? data : [], userId: user.id }
}

async function fetchHousehold(): Promise<StoryHousehold | null> {
  try {
    const res = await fetch('/api/household/context')
    if (!res.ok) return null
    const json = await res.json()
    if (!json.household?.isMultiMember) return null
    return {
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
    }
  } catch {
    // Household lens is optional; stories still load without it.
    return null
  }
}

export function StoryStudioProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  // UI-only state
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)
  const [activePill, setActivePill] = useState('all')
  const [updateTargetId, setUpdateTargetId] = useState<string | null>(null)

  const { data: storiesPayload, isLoading: loading } = useQuery({
    queryKey: keys.stories,
    queryFn: fetchStories,
  })
  const stories = storiesPayload?.stories ?? []
  const currentUserId = storiesPayload?.userId ?? null

  // Household membership rarely changes; keep it fresh for 5 minutes.
  const { data: household = null } = useQuery({
    queryKey: keys.householdContext,
    queryFn: fetchHousehold,
    staleTime: 5 * 60_000,
  })

  // Auto-select the newest story once loaded (previous mount-time behavior).
  useEffect(() => {
    if (!selectedStoryId && stories.length > 0) {
      setSelectedStoryId(stories[0].id)
    }
  }, [selectedStoryId, stories])

  const refreshStories = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: keys.stories })
  }, [queryClient])

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
        refreshStories,
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
