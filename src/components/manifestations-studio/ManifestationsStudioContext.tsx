'use client'

import React, { createContext, useCallback, useContext } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query/keys'
import type { ManifestationListItem } from '@/lib/manifestations/types'

interface ManifestationsStudioContextValue {
  manifestations: ManifestationListItem[]
  loading: boolean
  refreshManifestations: () => Promise<void>
}

const ManifestationsStudioContext = createContext<ManifestationsStudioContextValue | null>(null)

export function useManifestationsStudio() {
  const ctx = useContext(ManifestationsStudioContext)
  if (!ctx) throw new Error('useManifestationsStudio must be used within ManifestationsStudioProvider')
  return ctx
}

async function fetchManifestations(): Promise<ManifestationListItem[]> {
  const res = await fetch('/api/manifestations')
  if (!res.ok) return []
  const data = await res.json()
  return data.manifestations || []
}

export function ManifestationsStudioProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const { data: manifestations = [], isLoading: loading } = useQuery({
    queryKey: keys.manifestationKits,
    queryFn: fetchManifestations,
  })

  const refreshManifestations = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: keys.manifestationKits })
  }, [queryClient])

  return (
    <ManifestationsStudioContext.Provider value={{ manifestations, loading, refreshManifestations }}>
      {children}
    </ManifestationsStudioContext.Provider>
  )
}
