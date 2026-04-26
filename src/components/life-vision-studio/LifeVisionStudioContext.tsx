'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface VisionVersion {
  id: string
  version_number: number
  is_active: boolean
  is_draft: boolean
  household_id: string | null
  parent_id: string | null
  created_at: string
  updated_at: string
  title?: string
  refined_categories?: string[]
}

export interface AudioSetOption {
  id: string
  name: string
  variant: string
  voice_id: string
  track_count: number
}

interface LifeVisionStudioContextValue {
  visions: VisionVersion[]
  loading: boolean
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
  const [profileNewerThanVision, setProfileNewerThanVision] = useState(false)
  const [profileVersionNumber, setProfileVersionNumber] = useState<number | null>(null)
  const [audioSets, setAudioSets] = useState<AudioSetOption[]>([])
  const [selectedAudioSetId, setSelectedAudioSetId] = useState<string | null>(null)

  const loadVisions = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) {
      setLoading(false)
      return
    }

    const [visionsResult, profileResult, profileCountResult] = await Promise.all([
      supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
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
      const nonDrafts = visionsResult.data.filter((v: any) => !v.is_draft)
      const enriched: VisionVersion[] = visionsResult.data.map((v: any) => ({
        ...v,
        version_number: v.is_draft
          ? 0
          : nonDrafts.length - nonDrafts.findIndex((nd: any) => nd.id === v.id),
      }))
      setVisions(enriched)

      const activeVision = visionsResult.data.find((v: any) => v.is_active && !v.is_draft)
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

  const activeVision = visions.find(v => v.is_active && !v.is_draft)
  const activeVisionId = activeVision?.id ?? null
  const activeVisionVersion = activeVision?.version_number ?? null
  const activeVisionDate = activeVision?.updated_at ?? activeVision?.created_at ?? null

  const draft = visions.find(v => v.is_draft)
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
      }}
    >
      {children}
    </LifeVisionStudioContext.Provider>
  )
}
