'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VisionTarget, Commitment, CommitmentOccurrence } from '@/lib/map/types'

export interface CommitmentStats {
  thisWeekCompleted: number
  thisWeekTotal: number
  last30Completed: number
  last30Total: number
  currentStreak: number
  hitRate: number
}

interface MapStudioContextValue {
  targets: VisionTarget[]
  commitments: Commitment[]
  todayOccurrences: CommitmentOccurrence[]
  recentOccurrences: CommitmentOccurrence[]
  commitmentStats: Map<string, CommitmentStats>
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
  const [recentOccurrences, setRecentOccurrences] = useState<CommitmentOccurrence[]>([])
  const [commitmentStats, setCommitmentStats] = useState<Map<string, CommitmentStats>>(new Map())
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

    // Today's occurrences
    const { data: todayData } = await supabase
      .from('commitment_occurrences')
      .select('*, commitment:commitments(*)')
      .eq('user_id', session.user.id)
      .eq('occurred_on', today)
      .order('created_at', { ascending: true })

    if (todayData) setTodayOccurrences(todayData)

    // Last 30 days of occurrences for stats
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    const { data: recentData } = await supabase
      .from('commitment_occurrences')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('occurred_on', thirtyDaysAgoStr)
      .order('occurred_on', { ascending: false })

    if (recentData) {
      setRecentOccurrences(recentData)
      setCommitmentStats(computeStats(recentData))
    }
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
        recentOccurrences,
        commitmentStats,
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

function computeStats(occurrences: CommitmentOccurrence[]): Map<string, CommitmentStats> {
  const stats = new Map<string, CommitmentStats>()
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  // Week boundaries (Monday-based)
  const day = now.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + mondayOffset)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  // Group by commitment
  const byCommitment = new Map<string, CommitmentOccurrence[]>()
  for (const occ of occurrences) {
    const existing = byCommitment.get(occ.commitment_id) || []
    existing.push(occ)
    byCommitment.set(occ.commitment_id, existing)
  }

  for (const [commitmentId, occs] of byCommitment) {
    // Sort by date descending for streak calculation
    const sorted = [...occs].sort((a, b) => b.occurred_on.localeCompare(a.occurred_on))

    const thisWeek = occs.filter(o => o.occurred_on >= weekStartStr)
    const thisWeekCompleted = thisWeek.filter(o => o.status === 'yes').length
    const thisWeekTotal = thisWeek.length

    const last30Completed = occs.filter(o => o.status === 'yes').length
    const last30Total = occs.length
    const hitRate = last30Total > 0 ? Math.round((last30Completed / last30Total) * 100) : 0

    // Current streak: consecutive 'yes' days from most recent
    let currentStreak = 0
    for (const occ of sorted) {
      if (occ.status === 'yes') {
        currentStreak++
      } else if (occ.status === 'pending' && occ.occurred_on === todayStr) {
        continue
      } else {
        break
      }
    }

    stats.set(commitmentId, {
      thisWeekCompleted,
      thisWeekTotal,
      last30Completed,
      last30Total,
      currentStreak,
      hitRate,
    })
  }

  return stats
}
