'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { keys } from '@/lib/query/keys'
import {
  partitionCommitments,
  groupSystemByPillar,
  groupCustomByLifeCategory,
} from '@/lib/map/commitment-classification'
import { toDateString } from '@/lib/map/cadence'
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
  refreshCommitments: () => Promise<Commitment[]>
  refreshOccurrences: () => Promise<void>
  refreshAll: () => Promise<void>
  refreshPlanForDate: (date: string) => Promise<void>
  refreshDateOccurrences: (date: string) => Promise<void>
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

// Child keys under the registry prefixes so table-level invalidation
// (e.g. commitments changed) refetches them automatically.
const selectableDatesKey = [...keys.commitments, 'selectable-dates'] as const
const planKey = (date: string) => [...keys.commitments, 'plan', date] as const
const occurrenceSummaryKey = [...keys.commitmentOccurrences, 'summary'] as const
const dateOccurrencesKey = (date: string) => [...keys.commitmentOccurrences, 'date', date] as const

async function fetchMaps(): Promise<UserMap[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data } = await supabase
    .from('user_maps')
    .select('*')
    .eq('user_id', session.user.id)
    .order('version_number', { ascending: false })

  return data ?? []
}

async function fetchTargets(): Promise<VisionTarget[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data } = await supabase
    .from('vision_targets')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

async function fetchCommitments(): Promise<Commitment[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data } = await supabase
    .from('commitments')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return data ?? []
}

async function fetchSelectableDates(): Promise<string[]> {
  const res = await fetch('/api/map/selectable-dates')
  if (!res.ok) return []
  const data = await res.json()
  return (data.dates || []) as string[]
}

interface OccurrenceSummary {
  today: CommitmentOccurrence[]
  recent: CommitmentOccurrence[]
}

async function fetchOccurrenceSummary(): Promise<OccurrenceSummary> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return { today: [], recent: [] }

  const today = todayDateString()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = toDateString(thirtyDaysAgo)

  const [todayResult, recentResult] = await Promise.all([
    supabase
      .from('commitment_occurrences')
      .select('*, commitment:commitments(*)')
      .eq('user_id', session.user.id)
      .eq('occurred_on', today)
      .order('created_at', { ascending: true }),
    supabase
      .from('commitment_occurrences')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('occurred_on', thirtyDaysAgoStr)
      .order('occurred_on', { ascending: false }),
  ])

  return {
    today: todayResult.data ?? [],
    recent: recentResult.data ?? [],
  }
}

interface PlanSnapshot {
  plan: Commitment[]
  earliestDate: string | null
}

export function MapStudioProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const [selectedDate, setSelectedDateState] = useState(todayDateString)
  const [viewMode, setViewModeState] = useState<MapViewMode>('day')

  const { data: maps = [], isLoading: mapsLoading } = useQuery({
    queryKey: keys.maps,
    queryFn: fetchMaps,
  })

  const { data: targets = [], isLoading: targetsLoading } = useQuery({
    queryKey: keys.mapTargets,
    queryFn: fetchTargets,
  })

  const { data: commitments = [], isLoading: commitmentsLoading } = useQuery({
    queryKey: keys.commitments,
    queryFn: fetchCommitments,
  })

  const { data: selectableDates = [] } = useQuery({
    queryKey: selectableDatesKey,
    queryFn: fetchSelectableDates,
  })

  const { data: occurrenceSummary, isLoading: occurrencesLoading } = useQuery({
    queryKey: occurrenceSummaryKey,
    queryFn: fetchOccurrenceSummary,
  })

  const loading = mapsLoading || targetsLoading || commitmentsLoading || occurrencesLoading

  const todayStr = todayDateString()
  const isHistoricalPlan = selectedDate < todayStr

  // Occurrences for the selected date: the server generates any missing rows
  // ("ensure") before we read them back.
  const { data: dateOccurrencesData } = useQuery({
    queryKey: dateOccurrencesKey(selectedDate),
    queryFn: async () => {
      await fetch('/api/map/occurrences/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      })
      const res = await fetch(`/api/map/occurrences?date=${selectedDate}`)
      if (!res.ok) return [] as CommitmentOccurrence[]
      const data = await res.json()
      return (data.occurrences || []) as CommitmentOccurrence[]
    },
    enabled: !loading,
  })
  const dateOccurrences = dateOccurrencesData ?? []

  // Historical plan snapshot; today/future dates use live active commitments.
  const { data: planSnapshot, isFetching: planSnapshotFetching } = useQuery({
    queryKey: planKey(selectedDate),
    queryFn: async (): Promise<PlanSnapshot> => {
      const res = await fetch(`/api/map/snapshot?date=${selectedDate}`)
      if (!res.ok) return { plan: [], earliestDate: null }
      const data = await res.json()
      return {
        plan: (data.plan || []) as Commitment[],
        earliestDate: data.meta?.earliestDate ?? null,
      }
    },
    enabled: !loading && isHistoricalPlan,
  })
  const planSnapshotLoading = isHistoricalPlan && planSnapshotFetching

  // Fall back to current active commitments when no historical snapshot
  // exists — lets the user backfill past days for recently added commitments.
  const planCommitments = isHistoricalPlan
    ? (planSnapshot && planSnapshot.plan.length > 0 ? planSnapshot.plan : commitments)
    : commitments

  const earliestPlanDate = planSnapshot?.earliestDate ?? (selectableDates.length > 0 ? selectableDates[0] : null)
  const selectablePlanDates = useMemo(() => new Set(selectableDates) as ReadonlySet<string>, [selectableDates])

  const recentOccurrences = occurrenceSummary?.recent ?? []
  const commitmentStats = useMemo(() => computeStats(recentOccurrences), [recentOccurrences])

  // When viewing today, the date query is the freshest source (it runs the
  // "ensure" step); otherwise fall back to the summary query.
  const todayOccurrences = selectedDate === todayStr && dateOccurrencesData
    ? dateOccurrencesData
    : occurrenceSummary?.today ?? []

  // --- Imperative helpers (uncached request/response) ---

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

  // --- Refresh functions (cache invalidation) ---

  const refreshMaps = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: keys.maps })
  }, [queryClient])

  const refreshTargets = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: keys.mapTargets })
  }, [queryClient])

  const refreshCommitments = useCallback(async (): Promise<Commitment[]> => {
    // Prefix invalidation also refetches selectable dates and plan snapshots.
    await queryClient.invalidateQueries({ queryKey: keys.commitments })
    return queryClient.getQueryData<Commitment[]>(keys.commitments) ?? []
  }, [queryClient])

  const refreshOccurrences = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: keys.commitmentOccurrences })
  }, [queryClient])

  const refreshAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.maps }),
      queryClient.invalidateQueries({ queryKey: keys.mapTargets }),
      queryClient.invalidateQueries({ queryKey: keys.commitments }),
      queryClient.invalidateQueries({ queryKey: keys.commitmentOccurrences }),
    ])
  }, [queryClient])

  const refreshPlanForDate = useCallback(async (date: string) => {
    await queryClient.invalidateQueries({ queryKey: planKey(date) })
  }, [queryClient])

  const refreshDateOccurrences = useCallback(async (date: string) => {
    if (date === selectedDate) {
      await queryClient.invalidateQueries({ queryKey: dateOccurrencesKey(date) })
    } else {
      // Not the currently viewed date: ensure + prime the cache for it.
      await ensureOccurrencesForDateFn(date)
      const occs = await loadOccurrencesForDate(date)
      queryClient.setQueryData(dateOccurrencesKey(date), occs)
    }
    if (date === todayDateString()) {
      await queryClient.invalidateQueries({ queryKey: occurrenceSummaryKey })
    }
  }, [queryClient, selectedDate, ensureOccurrencesForDateFn, loadOccurrencesForDate])

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
    await queryClient.invalidateQueries({ queryKey: keys.commitmentOccurrences })
  }, [queryClient])

  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateState(date)
  }, [])

  const setViewMode = useCallback((mode: MapViewMode) => {
    setViewModeState(mode)
  }, [])

  const activeMap = maps.find(m => m.is_active && !m.is_draft) ?? null
  const draftMap = maps.find(m => m.is_draft) ?? null

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
        refreshMaps,
        refreshTargets,
        refreshCommitments,
        refreshOccurrences,
        refreshAll,
        refreshPlanForDate,
        refreshDateOccurrences,
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
  const todayStr = toDateString(now)

  const day = now.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + mondayOffset)
  const weekStartStr = toDateString(weekStart)

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
