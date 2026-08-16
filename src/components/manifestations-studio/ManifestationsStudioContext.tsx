'use client'

import React, { createContext, useCallback, useContext } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query/keys'
import type { KitListItem } from '@/lib/manifestations/types'

interface ManifestationsStudioContextValue {
  kits: KitListItem[]
  loading: boolean
  refreshKits: () => Promise<void>
}

const ManifestationsStudioContext = createContext<ManifestationsStudioContextValue | null>(null)

export function useManifestationsStudio() {
  const ctx = useContext(ManifestationsStudioContext)
  if (!ctx) throw new Error('useManifestationsStudio must be used within ManifestationsStudioProvider')
  return ctx
}

async function fetchKits(): Promise<KitListItem[]> {
  const res = await fetch('/api/manifestations')
  if (!res.ok) return []
  const data = await res.json()
  return data.kits || []
}

export function ManifestationsStudioProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const { data: kits = [], isLoading: loading } = useQuery({
    queryKey: keys.manifestationKits,
    queryFn: fetchKits,
  })

  const refreshKits = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: keys.manifestationKits })
  }, [queryClient])

  return (
    <ManifestationsStudioContext.Provider value={{ kits, loading, refreshKits }}>
      {children}
    </ManifestationsStudioContext.Provider>
  )
}
