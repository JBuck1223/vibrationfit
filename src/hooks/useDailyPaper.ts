'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export interface DailyPaperEntry {
  id: string
  entry_date: string
  gratitude: string
  task_one: string
  task_two: string
  task_three: string
  fun_plan: string
  attachment_url: string | null
  attachment_key: string | null
  attachment_content_type: string | null
  attachment_size: number | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface DailyPaperAttachmentInput {
  url: string
  key: string
  contentType?: string
  size?: number
}

export interface DailyPaperPayload {
  entryDate: string
  gratitude: string
  tasks?: string[]
  taskOne?: string
  taskTwo?: string
  taskThree?: string
  funPlan: string
  attachment?: DailyPaperAttachmentInput
  metadata?: Record<string, unknown>
}

interface UseDailyPaperEntriesOptions {
  date?: string
  limit?: number
}

interface UseDailyPaperEntriesResult {
  entries: DailyPaperEntry[]
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  refresh: () => Promise<void>
  setEntries: React.Dispatch<React.SetStateAction<DailyPaperEntry[]>>
}

async function fetchDailyPaperEntries(options?: UseDailyPaperEntriesOptions) {
  const params = new URLSearchParams()
  if (options?.date) {
    params.set('date', options.date)
  }
  if (options?.limit) {
    params.set('limit', options.limit.toString())
  }

  const response = await fetch(
    `/api/daily-paper${params.toString() ? `?${params.toString()}` : ''}`,
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      (errorData as { error?: string }).error || 'Failed to load Daily Paper entries.',
    )
  }

  const data = (await response.json()) as { data: DailyPaperEntry[] }
  return data.data ?? []
}

export function useDailyPaperEntries(
  options?: UseDailyPaperEntriesOptions,
): UseDailyPaperEntriesResult {
  const [entries, setEntries] = useState<DailyPaperEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadEntries = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'initial') {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError(null)

      try {
        const fetched = await fetchDailyPaperEntries(options)
        setEntries(fetched)
      } catch (err) {
        console.error('useDailyPaperEntries error:', err)
        setError(err instanceof Error ? err.message : 'Unable to load Daily Papers.')
      } finally {
        if (mode === 'initial') {
          setIsLoading(false)
        } else {
          setIsRefreshing(false)
        }
      }
    },
    [options?.date, options?.limit],
  )

  useEffect(() => {
    void loadEntries('initial')
  }, [loadEntries])

  const refresh = useCallback(async () => {
    await loadEntries('refresh')
  }, [loadEntries])

  return useMemo(
    () => ({
      entries,
      isLoading,
      isRefreshing,
      error,
      refresh,
      setEntries,
    }),
    [entries, error, isLoading, isRefreshing, refresh],
  )
}

interface UseDailyPaperMutationResult {
  saveDailyPaper: (payload: DailyPaperPayload) => Promise<DailyPaperEntry>
  isSaving: boolean
  error: string | null
}

export function useDailyPaperMutation(): UseDailyPaperMutationResult {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveDailyPaper = useCallback(async (payload: DailyPaperPayload) => {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/daily-paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          (errorData as { error?: string }).error || 'Failed to save Daily Paper.',
        )
      }

      const data = (await response.json()) as { data: DailyPaperEntry }
      return data.data
    } catch (err) {
      console.error('useDailyPaperMutation error:', err)
      const message =
        err instanceof Error ? err.message : 'Unable to save your Daily Paper.'
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setIsSaving(false)
    }
  }, [])

  return { saveDailyPaper, isSaving, error }
}






