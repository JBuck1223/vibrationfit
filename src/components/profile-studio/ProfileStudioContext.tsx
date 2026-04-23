'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface ProfileVersion {
  id: string
  version_number?: number
  is_active: boolean
  is_draft: boolean
  first_name?: string
  last_name?: string
  created_at: string
}

interface ProfileStudioContextValue {
  versions: ProfileVersion[]
  loading: boolean
  activeProfileId: string | null
  draftId: string | null
  refreshVersions: () => Promise<void>
}

const ProfileStudioContext = createContext<ProfileStudioContextValue | null>(null)

export function useProfileStudio() {
  const ctx = useContext(ProfileStudioContext)
  if (!ctx) throw new Error('useProfileStudio must be used within ProfileStudioProvider')
  return ctx
}

export function ProfileStudioProvider({ children }: { children: React.ReactNode }) {
  const [versions, setVersions] = useState<ProfileVersion[]>([])
  const [loading, setLoading] = useState(true)

  const loadVersions = useCallback(async () => {
    try {
      const response = await fetch('/api/profile?includeVersions=true')
      if (!response.ok) {
        setLoading(false)
        return
      }
      const data = await response.json()
      setVersions(data.versions || [])
    } catch {
      // Silently fail - user may not be logged in
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  const activeProfileId = versions.find(v => v.is_active && !v.is_draft)?.id ?? null
  const draftId = versions.find(v => v.is_draft)?.id ?? null

  return (
    <ProfileStudioContext.Provider
      value={{
        versions,
        loading,
        activeProfileId,
        draftId,
        refreshVersions: loadVersions,
      }}
    >
      {children}
    </ProfileStudioContext.Provider>
  )
}
