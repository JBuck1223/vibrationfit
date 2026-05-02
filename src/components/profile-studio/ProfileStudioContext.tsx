'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface ProfileVersion {
  id: string
  version_number?: number
  is_active: boolean
  is_draft: boolean
  first_name?: string
  last_name?: string
  parent_id?: string | null
  created_at: string
  updated_at?: string
}

interface ProfileStudioContextValue {
  versions: ProfileVersion[]
  loading: boolean
  activeProfileId: string | null
  activeProfileVersion: number | null
  activeProfileDate: string | null
  draftId: string | null
  draftParentId: string | null
  draftParentVersion: number | null
  draftCreatedAt: string | null
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

  const activeProfile = versions.find(v => v.is_active && !v.is_draft)
  const activeProfileId = activeProfile?.id ?? null
  const activeProfileVersion = activeProfile?.version_number ?? null
  const activeProfileDate = activeProfile?.updated_at ?? activeProfile?.created_at ?? null

  const draft = versions.find(v => v.is_draft)
  const draftId = draft?.id ?? null
  const draftParentId = draft?.parent_id ?? null
  const draftCreatedAt = draft?.created_at ?? null

  const draftParent = draftParentId ? versions.find(v => v.id === draftParentId) : null
  const draftParentVersion = draftParent?.version_number ?? null

  return (
    <ProfileStudioContext.Provider
      value={{
        versions,
        loading,
        activeProfileId,
        activeProfileVersion,
        activeProfileDate,
        draftId,
        draftParentId,
        draftParentVersion,
        draftCreatedAt,
        refreshVersions: loadVersions,
      }}
    >
      {children}
    </ProfileStudioContext.Provider>
  )
}
