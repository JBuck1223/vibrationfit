'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

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

export function LifeVisionStudioProvider({ children }: { children: React.ReactNode }) {
  const [visions, setVisions] = useState<VisionVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [hasHousehold, setHasHousehold] = useState(false)
  const [profileNewerThanVision, setProfileNewerThanVision] = useState(false)
  const [profileVersionNumber, setProfileVersionNumber] = useState<number | null>(null)
  const [audioSets, setAudioSets] = useState<AudioSetOption[]>([])
  const [selectedAudioSetId, setSelectedAudioSetId] = useState<string | null>(null)
  const [studioAreaChrome, setStudioAreaChrome] = useState<LifeVisionStudioAreaChrome | null>(null)

  const loadVisions = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) {
      setLoading(false)
      return
    }

    const [visionsResult, profileResult, profileCountResult] = await Promise.all([
      // No user_id filter: RLS returns own visions plus household-shared ones
      // ("Life We Choose" joint visions and any personal visions a household
      // member shares, explicitly or via share-all).
      supabase
        .from('vision_versions')
        .select('*')
        .order('created_at', { ascending: false }),
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

    if (!visionsResult.error && visionsResult.data) {
      // Versions are numbered per group: "Life I Choose" (each member's
      // personal visions) and "Life We Choose" (household visions) each start
      // at 1. Rows are ordered newest-first, so newest gets the highest number.
      const groupKeyOf = (v: any) => (v.household_id ? `hh:${v.household_id}` : `me:${v.user_id}`)
      const groupCounts: Record<string, number> = {}
      for (const v of visionsResult.data) {
        if (v.is_draft) continue
        const key = groupKeyOf(v)
        groupCounts[key] = (groupCounts[key] || 0) + 1
      }
      const groupSeen: Record<string, number> = {}
      const enriched: VisionVersion[] = visionsResult.data.map((v: any) => {
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
      setVisions(enriched)

      const activeVision = enriched.find(v => v.is_active && !v.is_draft && v.is_mine && !v.is_household)
      if (activeVision && profileResult.data?.created_at) {
        setProfileNewerThanVision(
          new Date(profileResult.data.created_at) > new Date(activeVision.created_at)
        )
      }
    }

    if (profileCountResult.count != null) {
      setProfileVersionNumber(profileCountResult.count)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadVisions()
  }, [loadVisions])

  // Household membership rarely changes; fetch once per mount.
  useEffect(() => {
    let cancelled = false
    fetch('/api/household')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled) setHasHousehold(!!data?.household)
      })
      .catch(() => {
        if (!cancelled) setHasHousehold(false)
      })
    return () => { cancelled = true }
  }, [])

  // "Active vision" and "draft" always refer to the user's own personal
  // ("Life I Choose") documents; shared and household visions never drive
  // the create/refine flows.
  const activeVision = visions.find(v => v.is_active && !v.is_draft && v.is_mine && !v.is_household)
  const activeVisionId = activeVision?.id ?? null
  const activeVisionVersion = activeVision?.version_number ?? null
  const activeVisionDate = activeVision?.updated_at ?? activeVision?.created_at ?? null

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
        draftId,
        draftParentId,
        draftParentVersion,
        draftCreatedAt,
        draftRefinedCount,
        profileNewerThanVision,
        profileVersionNumber,
        refreshVisions: loadVisions,
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
