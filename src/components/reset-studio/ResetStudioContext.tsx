'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { keys } from '@/lib/query/keys'
import type { ResetRow, ResetItemWithDetection } from '@/lib/reset/service'
import type { ResetItemType } from '@/lib/reset/reset-config'

export interface ResetProgress {
  total: number
  completed: number
  percent: number
  allComplete: boolean
}

interface ResetPayload {
  reset: ResetRow | null
  items: ResetItemWithDetection[]
  progress: ResetProgress | null
}

interface ResetStudioContextValue {
  reset: ResetRow | null
  items: ResetItemWithDetection[]
  progress: ResetProgress | null
  loading: boolean
  focusFilter: string // 'all' or a life category key

  setFocusFilter: (key: string) => void
  refresh: () => Promise<void>
  verify: () => Promise<void>
  startReset: (opts?: { item_types?: ResetItemType[]; focus_categories?: string[]; title?: string }) => Promise<boolean>
  toggleItem: (type: ResetItemType, selected: boolean) => Promise<void>
  markItemComplete: (type: ResetItemType, complete: boolean) => Promise<void>
  updateFocus: (categories: string[]) => Promise<void>
  completeReset: () => Promise<boolean>
}

const ResetStudioContext = createContext<ResetStudioContextValue | null>(null)

export function useResetStudio() {
  const ctx = useContext(ResetStudioContext)
  if (!ctx) throw new Error('useResetStudio must be used within ResetStudioProvider')
  return ctx
}

function toPayload(data: any): ResetPayload {
  return {
    reset: data?.reset ?? null,
    items: data?.items ?? [],
    progress: data?.progress ?? null,
  }
}

async function fetchReset(): Promise<ResetPayload> {
  try {
    const res = await fetch('/api/reset')
    if (!res.ok) return { reset: null, items: [], progress: null }
    return toPayload(await res.json())
  } catch {
    return { reset: null, items: [], progress: null }
  }
}

export function ResetStudioProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [focusFilter, setFocusFilter] = useState<string>('all')

  const { data, isLoading: loading } = useQuery({
    queryKey: keys.resets,
    queryFn: fetchReset,
  })
  const reset = data?.reset ?? null
  const items = data?.items ?? []
  const progress = data?.progress ?? null

  // Write a fresh payload straight into the cache (used when a mutation
  // response already contains the full updated state).
  const applyPayload = useCallback((payload: any) => {
    queryClient.setQueryData(keys.resets, toPayload(payload))
  }, [queryClient])

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: keys.resets })
  }, [queryClient])

  const verify = useCallback(async () => {
    // Pull the active reset first, then self-heal it.
    const res = await fetch('/api/reset')
    if (!res.ok) return
    const payload = await res.json()
    if (!payload.reset) {
      applyPayload(payload)
      return
    }
    const vRes = await fetch(`/api/reset/${payload.reset.id}/verify`, { method: 'POST' })
    if (vRes.ok) {
      applyPayload(await vRes.json())
    } else {
      applyPayload(payload)
    }
  }, [applyPayload])

  const startReset = useCallback(async (opts?: { item_types?: ResetItemType[]; focus_categories?: string[]; title?: string }) => {
    const res = await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts || {}),
    })
    if (res.ok) {
      applyPayload(await res.json())
      toast.success('Your Reset has begun')
      return true
    }
    toast.error('Failed to start Reset')
    return false
  }, [applyPayload])

  const toggleItem = useCallback(async (type: ResetItemType, selected: boolean) => {
    if (!reset) return
    const res = await fetch(`/api/reset/${reset.id}/items`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_type: type, is_selected: selected }),
    })
    if (res.ok) {
      await refresh()
    } else {
      toast.error('Failed to update item')
    }
  }, [reset, refresh])

  const markItemComplete = useCallback(async (type: ResetItemType, complete: boolean) => {
    if (!reset) return
    const res = await fetch(`/api/reset/${reset.id}/items`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_type: type, mark_complete: complete }),
    })
    if (res.ok) {
      await refresh()
    } else {
      toast.error('Failed to update item')
    }
  }, [reset, refresh])

  const updateFocus = useCallback(async (categories: string[]) => {
    if (!reset) return
    const res = await fetch(`/api/reset/${reset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ focus_categories: categories }),
    })
    if (res.ok) {
      const payload = await res.json()
      queryClient.setQueryData(keys.resets, (prev: ResetPayload | undefined) => ({
        ...(prev ?? { reset: null, items: [], progress: null }),
        reset: payload.reset,
      }))
    } else {
      toast.error('Failed to update focus areas')
    }
  }, [reset, queryClient])

  const completeReset = useCallback(async () => {
    if (!reset) return false
    const res = await fetch(`/api/reset/${reset.id}/complete`, { method: 'POST' })
    if (res.ok) {
      const payload = await res.json()
      queryClient.setQueryData(keys.resets, (prev: ResetPayload | undefined) => ({
        ...(prev ?? { reset: null, items: [], progress: null }),
        reset: payload.reset,
      }))
      return true
    }
    toast.error('Complete every selected item to finish your Reset')
    return false
  }, [reset, queryClient])

  return (
    <ResetStudioContext.Provider
      value={{
        reset, items, progress, loading, focusFilter,
        setFocusFilter, refresh, verify, startReset, toggleItem, markItemComplete, updateFocus, completeReset,
      }}
    >
      {children}
    </ResetStudioContext.Provider>
  )
}
