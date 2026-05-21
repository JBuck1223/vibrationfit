'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  partitionCommitments,
  groupSystemByPillar,
  groupCustomByLifeCategory,
} from '@/lib/map/commitment-classification'
import { todayDateString } from '@/lib/map/map-date-utils'
import type { MapViewMode } from '@/lib/map/map-date-utils'
import type { VisionTarget, Commitment, CommitmentOccurrence, UserMap, MapCategory, OccurrenceStatus } from '@/lib/map/types'

export interface CommitmentStats {
  thisWeekCompleted: number
  thisWeekTotal: number
  last30Completed: number
  last30Total: number
  currentStreak: number
  hitRate: number
}

interface MapStudioContextValue {
  maps: UserMap[]
  activeMap: UserMap | null
  draftMap: UserMap | null

  targets: VisionTarget[]
  commitments: Commitment[]
  planCommitments: Commitment[]
  activeCommitments: Commitment[]
  systemCommitments: Commitment[]
  customCommitments: Commitment[]
  customActiveCommitments: Commitment[]
  commitmentsByPillar: Record<MapCategory, Commitment[]>
  commitmentsByLifeCategory: Record<string, Commitment[]>

  todayOccurrences: CommitmentOccurrence[]
  dateOccurrences: CommitmentOccurrence[]
  recentOccurrences: CommitmentOccurrence[]
  commitmentStats: Map<string, CommitmentStats>
  loading: boolean
  planSnapshotLoading: boolean
  isHistoricalPlan: boolean
  earliestPlanDate: string | null
  selectablePlanDates: ReadonlySet<string>

  selectedDate: string
  viewMode: MapViewMode
  setSelectedDate: (date: string) => void
  setViewMode: (mode: MapViewMode) => void

  refreshMaps: () => Promise<void>
  refreshTargets: () => Promise<void>
  refreshCommitments: () => Promise<void>
  refreshOccurrences: () => Promise<void>
  refreshAll: () => Promise<void>
  refreshPlanForDate: (date: string) => Promise<void>
  loadOccurrencesForDate: (date: string) => Promise<CommitmentOccurrence[]>
  loadOccurrencesForRange: (from: string, to: string) => Promise<CommitmentOccurrence[]>
  ensureOccurrencesForDate: (date: string) => Promise<void>
  verifyOccurrence: (id: string, status: OccurrenceStatus, note?: string) => Promise<void>
}

const MapStudioContext = createContext<MapStudioContextValue | null>(null)

export function useMapStudio() {
  const ctx = useContext(MapStudioContext)
  if (!ctx) throw new Error('useMapStudio must be used within MapStudioProvider')
  return ctx
}

export function MapStudioProvider({ children }: { children: React.ReactNode }) {
  const [maps, setMaps] = useState<UserMap[]>([])
  const [targets, setTargets] = useState<VisionTarget[]>([])
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [planCommitments, setPlanCommitments] = useState<Commitment[]>([])
  const [planSnapshotLoading, setPlanSnapshotLoading] = useState(false)
  const [earliestPlanDate, setEarliestPlanDate] = useState<string | null>(null)
  const [selectablePlanDates, setSelectablePlanDates] = useState<ReadonlySet<string>>(new Set())
  const [todayOccurrences, setTodayOccurrences] = useState<CommitmentOccurrence[]>([])
  const [dateOccurrences, setDateOccurrences] = useState<CommitmentOccurrence[]>([])
  const [recentOccurrences, setRecentOccurrences] = useState<CommitmentOccurrence[]>([])
  const [commitmentStats, setCommitmentStats] = useState<Map<string, CommitmentStats>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDateState] = useState(todayDateString)
  const [viewMode, setViewModeState] = useState<MapViewMode>('day')

  const loadMaps = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { data } = await supabase
      .from('user_maps')
      .select('*')
      .eq('user_id', session.user.id)
      .order('version_number', { ascending: false })

    if (data) setMaps(data)
  }, [])

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

  const loadSelectablePlanDates = useCallback(async () => {
    const res = await fetch('/api/map/selectable-dates')
    if (!res.ok) return
    const data = await res.json()
    const dates = (data.dates || []) as string[]
    setSelectablePlanDates(new Set(dates))
    if (dates.length > 0) {
      setEarliestPlanDate(dates[0])
    } else {
      setEarliestPlanDate(null)
    }
  }, [])

  const loadCommitments = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { data } = await supabase
      .from('commitments')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (data) setCommitments(data)
    await loadSelectablePlanDates()
  }, [loadSelectablePlanDates])

  const loadOccurrencesForDate = useCallback(async (date: string) => {
    const res = await fetch(`/api/map/occurrences?date=${date}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.occurrences || []) as CommitmentOccurrence[]
  }, [])

  const loadOccurrencesForRange = useCallback(async (from: string, to: string) => {
    const res = await fetch(`/api/map/occurrences?from=${from}&to=${to}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.occurrences || []) as CommitmentOccurrence[]
  }, [])

  const ensureOccurrencesForDateFn = useCallback(async (date: string) => {
    await fetch('/api/map/occurrences/ensure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    })
  }, [])

  const loadOccurrences = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const today = todayDateString()

    const { data: todayData } = await supabase
      .from('commitment_occurrences')
      .select('*, commitment:commitments(*)')
      .eq('user_id', session.user.id)
      .eq('occurred_on', today)
      .order('created_at', { ascending: true })

    if (todayData) setTodayOccurrences(todayData)

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

  const refreshDateOccurrences = useCallback(async (date: string) => {
    await ensureOccurrencesForDateFn(date)
    const occs = await loadOccurrencesForDate(date)
    setDateOccurrences(occs)
    if (date === todayDateString()) {
      setTodayOccurrences(occs)
    }
  }, [ensureOccurrencesForDateFn, loadOccurrencesForDate])

  const verifyOccurrence = useCallback(async (
    id: string,
    status: OccurrenceStatus,
    note?: string,
  ) => {
    const res = await fetch('/api/map/occurrences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, note }),
    })
    if (!res.ok) throw new Error('Failed to verify')
    await refreshDateOccurrences(selectedDate)
    await loadOccurrences()
  }, [selectedDate, refreshDateOccurrences, loadOccurrences])

  const refreshPlanForDate = useCallback(async (date: string) => {
    const today = todayDateString()
    if (date >= today) {
      setPlanSnapshotLoading(false)
      await loadCommitments()
      return
    }

    setPlanSnapshotLoading(true)
    try {
      const res = await fetch(`/api/map/snapshot?date=${date}`)
      if (!res.ok) return
      const data = await res.json()
      setPlanCommitments((data.plan || []) as Commitment[])
      if (data.meta?.earliestDate) {
        setEarliestPlanDate(data.meta.earliestDate)
      }
    } finally {
      setPlanSnapshotLoading(false)
    }
  }, [loadCommitments])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadMaps(), loadTargets(), loadCommitments(), loadOccurrences()])
    setLoading(false)
  }, [loadMaps, loadTargets, loadCommitments, loadOccurrences])

  const refreshAll = useCallback(async () => {
    await loadAll()
    await refreshDateOccurrences(selectedDate)
  }, [loadAll, refreshDateOccurrences, selectedDate])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    if (loading) return
    refreshDateOccurrences(selectedDate)
    void refreshPlanForDate(selectedDate)
  }, [selectedDate, loading, refreshDateOccurrences, refreshPlanForDate])

  useEffect(() => {
    const today = todayDateString()
    if (selectedDate >= today) {
      setPlanCommitments(commitments)
    }
  }, [commitments, selectedDate])

  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateState(date)
  }, [])

  const setViewMode = useCallback((mode: MapViewMode) => {
    setViewModeState(mode)
  }, [])

  const activeMap = maps.find(m => m.is_active && !m.is_draft) ?? null
  const draftMap = maps.find(m => m.is_draft) ?? null

  const todayStr = todayDateString()
  const isHistoricalPlan = selectedDate < todayStr

  const activeCommitments = useMemo(
    () => commitments.filter(c => c.status === 'active'),
    [commitments],
  )

  const { system: systemCommitments, custom: customCommitments } = useMemo(
    () => partitionCommitments(planCommitments),
    [planCommitments],
  )

  const customActiveCommitments = useMemo(
    () => partitionCommitments(activeCommitments).custom,
    [activeCommitments],
  )

  const commitmentsByPillar = useMemo(
    () => groupSystemByPillar(systemCommitments),
    [systemCommitments],
  )

  const commitmentsByLifeCategory = useMemo(
    () => groupCustomByLifeCategory(customCommitments),
    [customCommitments],
  )

  return (
    <MapStudioContext.Provider
      value={{
        maps,
        activeMap,
        draftMap,
        targets,
        commitments,
        planCommitments,
        activeCommitments,
        systemCommitments,
        customCommitments,
        customActiveCommitments,
        commitmentsByPillar,
        commitmentsByLifeCategory,
        todayOccurrences,
        dateOccurrences,
        recentOccurrences,
        commitmentStats,
        loading,
        planSnapshotLoading,
        isHistoricalPlan,
        earliestPlanDate,
        selectablePlanDates,
        selectedDate,
        viewMode,
        setSelectedDate,
        setViewMode,
        refreshMaps: loadMaps,
        refreshTargets: loadTargets,
        refreshCommitments: loadCommitments,
        refreshOccurrences: loadOccurrences,
        refreshAll,
        refreshPlanForDate,
        loadOccurrencesForDate,
        loadOccurrencesForRange,
        ensureOccurrencesForDate: ensureOccurrencesForDateFn,
        verifyOccurrence,
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

  const day = now.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + mondayOffset)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const byCommitment = new Map<string, CommitmentOccurrence[]>()
  for (const occ of occurrences) {
    const existing = byCommitment.get(occ.commitment_id) || []
    existing.push(occ)
    byCommitment.set(occ.commitment_id, existing)
  }

  for (const [commitmentId, occs] of byCommitment) {
    const sorted = [...occs].sort((a, b) => b.occurred_on.localeCompare(a.occurred_on))

    const thisWeek = occs.filter(o => o.occurred_on >= weekStartStr)
    const thisWeekCompleted = thisWeek.filter(o => o.status === 'yes').length
    const thisWeekTotal = thisWeek.length

    const last30Completed = occs.filter(o => o.status === 'yes').length
    const last30Total = occs.length
    const hitRate = last30Total > 0 ? Math.round((last30Completed / last30Total) * 100) : 0

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
