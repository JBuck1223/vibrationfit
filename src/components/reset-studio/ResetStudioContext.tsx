'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import type { ResetRow, ResetItemWithDetection } from '@/lib/reset/service'
import type { ResetItemType } from '@/lib/reset/reset-config'

export interface ResetProgress {
  total: number
  completed: number
  percent: number
  allComplete: boolean
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
  updateFocus: (categories: string[]) => Promise<void>
  completeReset: () => Promise<boolean>
}

const ResetStudioContext = createContext<ResetStudioContextValue | null>(null)

export function useResetStudio() {
  const ctx = useContext(ResetStudioContext)
  if (!ctx) throw new Error('useResetStudio must be used within ResetStudioProvider')
  return ctx
}

export function ResetStudioProvider({ children }: { children: React.ReactNode }) {
  const [reset, setReset] = useState<ResetRow | null>(null)
  const [items, setItems] = useState<ResetItemWithDetection[]>([])
  const [progress, setProgress] = useState<ResetProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [focusFilter, setFocusFilter] = useState<string>('all')

  const applyPayload = useCallback((data: any) => {
    setReset(data.reset ?? null)
    setItems(data.items ?? [])
    setProgress(data.progress ?? null)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reset')
      if (res.ok) applyPayload(await res.json())
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [applyPayload])

  const verify = useCallback(async () => {
    // Pull the active reset first, then self-heal it.
    const res = await fetch('/api/reset')
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    if (!data.reset) {
      applyPayload(data)
      setLoading(false)
      return
    }
    const vRes = await fetch(`/api/reset/${data.reset.id}/verify`, { method: 'POST' })
    if (vRes.ok) {
      applyPayload(await vRes.json())
    } else {
      applyPayload(data)
    }
    setLoading(false)
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

  const updateFocus = useCallback(async (categories: string[]) => {
    if (!reset) return
    const res = await fetch(`/api/reset/${reset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ focus_categories: categories }),
    })
    if (res.ok) {
      const data = await res.json()
      setReset(data.reset)
    } else {
      toast.error('Failed to update focus areas')
    }
  }, [reset])

  const completeReset = useCallback(async () => {
    if (!reset) return false
    const res = await fetch(`/api/reset/${reset.id}/complete`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setReset(data.reset)
      return true
    }
    toast.error('Complete every selected item to finish your Reset')
    return false
  }, [reset])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <ResetStudioContext.Provider
      value={{
        reset, items, progress, loading, focusFilter,
        setFocusFilter, refresh, verify, startReset, toggleItem, updateFocus, completeReset,
      }}
    >
      {children}
    </ResetStudioContext.Provider>
  )
}
