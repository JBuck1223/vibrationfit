'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VisionTarget, Commitment, CommitmentOccurrence } from '@/lib/map/types'

interface MapStudioContextValue {
  targets: VisionTarget[]
  commitments: Commitment[]
  todayOccurrences: CommitmentOccurrence[]
  loading: boolean
  refreshTargets: () => Promise<void>
  refreshCommitments: () => Promise<void>
  refreshOccurrences: () => Promise<void>
  refreshAll: () => Promise<void>
}

const MapStudioContext = createContext<MapStudioContextValue | null>(null)

export function useMapStudio() {
  const ctx = useContext(MapStudioContext)
  if (!ctx) throw new Error('useMapStudio must be used within MapStudioProvider')
  return ctx
}

export function MapStudioProvider({ children }: { children: React.ReactNode }) {
  const [targets, setTargets] = useState<VisionTarget[]>([])
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [todayOccurrences, setTodayOccurrences] = useState<CommitmentOccurrence[]>([])
  const [loading, setLoading] = useState(true)

  const loadTargets = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { data } = await supabase
      .from('vision_targets')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (data) setTargets(data)
  }, [])

  const loadCommitments = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { data } = await supabase
      .from('commitments')
      .select('*')
      .eq('user_id', session.user.id)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false })

    if (data) setCommitments(data)
  }, [])

  const loadOccurrences = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('commitment_occurrences')
      .select('*, commitment:commitments(*)')
      .eq('user_id', session.user.id)
      .eq('occurred_on', today)
      .order('created_at', { ascending: true })

    if (data) setTodayOccurrences(data)
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadTargets(), loadCommitments(), loadOccurrences()])
    setLoading(false)
  }, [loadTargets, loadCommitments, loadOccurrences])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  return (
    <MapStudioContext.Provider
      value={{
        targets,
        commitments,
        todayOccurrences,
        loading,
        refreshTargets: loadTargets,
        refreshCommitments: loadCommitments,
        refreshOccurrences: loadOccurrences,
        refreshAll: loadAll,
      }}
    >
      {children}
    </MapStudioContext.Provider>
  )
}
