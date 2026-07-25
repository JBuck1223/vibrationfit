'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { keys } from '@/lib/query/keys'

interface VisionVersion {
  id: string
  user_id: string
  version_number: number
  is_active: boolean
  is_draft: boolean
  household_id: string | null
  parent_id: string | null
  created_at: string
  updated_at: string
  title?: string
  refined_categories?: string[]
  /** false when the vision belongs to another household member (shared with you) */
  is_mine: boolean
  /** true for "Life We Choose" household visions */
  is_household: boolean
}

export interface AudioSetOption {
  id: string
  name: string
  variant: string
  voice_id: string
  track_count: number
}

/** Optional page-level copy merged into `LifeVisionAreaBar` (replaces former PageHero).
 * The area title itself never changes — pages may only adjust the eyebrow/context text. */
export interface LifeVisionStudioAreaChrome {
  contextEyebrow?: string
  contextText?: string
}

interface LifeVisionStudioContextValue {
  visions: VisionVersion[]
  loading: boolean
  /** true when the user belongs to a household account */
  hasHousehold: boolean
  activeVisionId: string | null
  activeVisionVersion: number | null
  activeVisionDate: string | null
  /** Active "Life We Choose" household vision, tracked separately from the personal active */
  householdActiveVisionId: string | null
  householdActiveVisionVersion: number | null
  householdDraftId: string | null
  draftId: string | null
  draftParentId: string | null
  draftParentVersion: number | null
  draftCreatedAt: string | null
  draftRefinedCount: number
  profileNewerThanVision: boolean
  profileVersionNumber: number | null
  refreshVisions: () => Promise<void>
  audioSets: AudioSetOption[]
  setAudioSets: (sets: AudioSetOption[]) => void
  selectedAudioSetId: string | null
  setSelectedAudioSetId: (id: string | null) => void
  studioAreaChrome: LifeVisionStudioAreaChrome | null
  setStudioAreaChrome: (chrome: LifeVisionStudioAreaChrome | null) => void
}

const LifeVisionStudioContext = createContext<LifeVisionStudioContextValue | null>(null)

export function useLifeVisionStudio() {
  const ctx = useContext(LifeVisionStudioContext)
  if (!ctx) throw new Error('useLifeVisionStudio must be used within LifeVisionStudioProvider')
  return ctx
}

async function fetchVisions(): Promise<VisionVersion[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []

  // No user_id filter: RLS returns own visions plus household-shared ones
  // ("Life We Choose" joint visions and any personal visions a household
  // member shares, explicitly or via share-all).
  const { data, error } = await supabase
    .from('vision_versions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  // Versions are numbered per group: "Life I Choose" (each member's
  // personal visions) and "Life We Choose" (household visions) each start
  // at 1. Rows are ordered newest-first, so newest gets the highest number.
  const groupKeyOf = (v: any) => (v.household_id ? `hh:${v.household_id}` : `me:${v.user_id}`)
  const groupCounts: Record<string, number> = {}
  for (const v of data) {
    if (v.is_draft) continue
    const key = groupKeyOf(v)
    groupCounts[key] = (groupCounts[key] || 0) + 1
  }
  const groupSeen: Record<string, number> = {}
  return data.map((v: any) => {
    const key = groupKeyOf(v)
    let versionNumber = 0
    if (!v.is_draft) {
      groupSeen[key] = (groupSeen[key] || 0) + 1
      versionNumber = (groupCounts[key] || 0) - groupSeen[key] + 1
    }
    return {
      ...v,
      version_number: versionNumber,
      is_mine: v.user_id === user.id,
      is_household: !!v.household_id,
    }
  })
}

interface ActiveProfileInfo {
  activeProfileCreatedAt: string | null
  versionCount: number | null
}

async function fetchActiveProfileInfo(): Promise<ActiveProfileInfo> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return { activeProfileCreatedAt: null, versionCount: null }

  const [profileResult, profileCountResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('is_draft', false)
      .maybeSingle(),
    supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_draft', false),
  ])

  return {
    activeProfileCreatedAt: profileResult.data?.created_at ?? null,
    versionCount: profileCountResult.count ?? null,
  }
}

async function fetchHasHousehold(): Promise<boolean> {
  try {
    const res = await fetch('/api/household')
    if (!res.ok) return false
    const data = await res.json()
    return !!data?.household
  } catch {
    return false
  }
}

export function LifeVisionStudioProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  // UI-only state (not entity data)
  const [audioSets, setAudioSets] = useState<AudioSetOption[]>([])
  const [selectedAudioSetId, setSelectedAudioSetId] = useState<string | null>(null)
  const [studioAreaChrome, setStudioAreaChrome] = useState<LifeVisionStudioAreaChrome | null>(null)

  const { data: visions = [], isLoading: loading } = useQuery({
    queryKey: keys.visions,
    queryFn: fetchVisions,
  })

  const { data: profileInfo } = useQuery({
    queryKey: keys.activeProfile,
    queryFn: fetchActiveProfileInfo,
  })

  // Household membership rarely changes; keep it fresh for 5 minutes.
  const { data: hasHousehold = false } = useQuery({
    queryKey: keys.household,
    queryFn: fetchHasHousehold,
    staleTime: 5 * 60_000,
  })

  const refreshVisions = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.visions }),
      queryClient.invalidateQueries({ queryKey: keys.profile }),
    ])
  }, [queryClient])

  // Personal ("Life I Choose") and household ("Life We Choose") actives are
  // tracked separately — the DB allows one of each. Personal chrome (create/
  // refine flows) still keys off the personal document; household chrome keys
  // off the household document. Shared-with-me visions never drive either.
  const activeVision = visions.find(v => v.is_active && !v.is_draft && v.is_mine && !v.is_household)
  const activeVisionId = activeVision?.id ?? null
  const activeVisionVersion = activeVision?.version_number ?? null
  const activeVisionDate = activeVision?.updated_at ?? activeVision?.created_at ?? null

  const profileNewerThanVision = !!(
    activeVision &&
    profileInfo?.activeProfileCreatedAt &&
    new Date(profileInfo.activeProfileCreatedAt) > new Date(activeVision.created_at)
  )
  const profileVersionNumber = profileInfo?.versionCount ?? null

  const householdActiveVision = visions.find(v => v.is_active && !v.is_draft && v.is_household)
  const householdActiveVisionId = householdActiveVision?.id ?? null
  const householdActiveVisionVersion = householdActiveVision?.version_number ?? null
  const householdDraft = visions.find(v => v.is_draft && v.is_household)
  const householdDraftId = householdDraft?.id ?? null

  const draft = visions.find(v => v.is_draft && v.is_mine && !v.is_household)
  const draftId = draft?.id ?? null
  const draftParentId = draft?.parent_id ?? null
  const draftCreatedAt = draft?.created_at ?? null
  const draftRefinedCount = (draft as any)?.refined_categories?.length ?? 0

  const draftParent = draftParentId ? visions.find(v => v.id === draftParentId) : null
  const draftParentVersion = draftParent?.version_number ?? null

  return (
    <LifeVisionStudioContext.Provider
      value={{
        visions,
        loading,
        hasHousehold,
        activeVisionId,
        activeVisionVersion,
        activeVisionDate,
        householdActiveVisionId,
        householdActiveVisionVersion,
        householdDraftId,
        draftId,
        draftParentId,
        draftParentVersion,
        draftCreatedAt,
        draftRefinedCount,
        profileNewerThanVision,
        profileVersionNumber,
        refreshVisions,
        audioSets,
        setAudioSets,
        selectedAudioSetId,
        setSelectedAudioSetId,
        studioAreaChrome,
        setStudioAreaChrome,
      }}
    >
      {children}
    </LifeVisionStudioContext.Provider>
  )
}
