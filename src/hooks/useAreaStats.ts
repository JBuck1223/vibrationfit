'use client'

import { useState, useEffect } from 'react'
import type { AreaStatsResponse } from '@/app/api/area-stats/route'

export type AreaSlug =
  | 'vision-audio'
  | 'journal'
  | 'daily-paper'
  | 'alignment-gym'
  | 'abundance-tracker'
  | 'vibe-tribe'
  | 'vision-board'

export type AreaStats = AreaStatsResponse

export function useAreaStats(area: AreaSlug) {
  const [stats, setStats] = useState<AreaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchStats() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/area-stats?area=${encodeURIComponent(area)}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Failed to fetch stats (${res.status})`)
        }
        const data: AreaStats = await res.json()
        if (!cancelled) setStats(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchStats()
    return () => { cancelled = true }
  }, [area])

  return { stats, loading, error, refetch: () => setLoading(true) }
}

export function useAllAreaStats() {
  const areas: AreaSlug[] = [
    'vision-audio',
    'journal',
    'daily-paper',
    'alignment-gym',
    'abundance-tracker',
    'vibe-tribe',
    'vision-board',
  ]

  const [allStats, setAllStats] = useState<Record<AreaSlug, AreaStats | null>>(
    () => Object.fromEntries(areas.map((a) => [a, null])) as Record<AreaSlug, AreaStats | null>,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      setLoading(true)
      setError(null)
      try {
        const results = await Promise.all(
          areas.map(async (area) => {
            const res = await fetch(`/api/area-stats?area=${encodeURIComponent(area)}`)
            if (!res.ok) return [area, null] as const
            const data: AreaStats = await res.json()
            return [area, data] as const
          }),
        )
        if (!cancelled) {
          setAllStats(
            Object.fromEntries(results) as Record<AreaSlug, AreaStats | null>,
          )
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [])

  return { allStats, loading, error }
}
