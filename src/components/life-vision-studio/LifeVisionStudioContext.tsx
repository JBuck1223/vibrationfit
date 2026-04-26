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
  title?: string
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
  draftId: string | null
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
  const [audioSets, setAudioSets] = useState<AudioSetOption[]>([])
  const [selectedAudioSetId, setSelectedAudioSetId] = useState<string | null>(null)

  const loadVisions = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const nonDrafts = data.filter((v: any) => !v.is_draft)
      const enriched: VisionVersion[] = data.map((v: any) => ({
        ...v,
        version_number: v.is_draft
          ? 0
          : nonDrafts.length - nonDrafts.findIndex((nd: any) => nd.id === v.id),
      }))
      setVisions(enriched)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadVisions()
  }, [loadVisions])

  const activeVisionId = visions.find(v => v.is_active && !v.is_draft)?.id ?? null
  const draftId = visions.find(v => v.is_draft)?.id ?? null

  return (
    <LifeVisionStudioContext.Provider
      value={{
        visions,
        loading,
        activeVisionId,
        draftId,
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
