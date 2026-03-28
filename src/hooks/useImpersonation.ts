'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'vf-impersonation'

interface ImpersonationData {
  returnToken: string
  targetName: string
  targetEmail: string
  adminName: string
  startedAt: string
}

function getStoredData(): ImpersonationData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function useImpersonation() {
  const [data, setData] = useState<ImpersonationData | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    setData(getStoredData())
    setInitialized(true)
  }, [])

  const isImpersonating = !!data

  const startImpersonating = useCallback((info: Omit<ImpersonationData, 'startedAt'>) => {
    const entry: ImpersonationData = { ...info, startedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
    setData(entry)
  }, [])

  const stopImpersonating = useCallback(async () => {
    const stored = getStoredData()
    if (!stored?.returnToken) {
      localStorage.removeItem(STORAGE_KEY)
      window.location.href = '/auth/login'
      return
    }

    try {
      const res = await fetch('/api/admin/impersonate-session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnToken: stored.returnToken }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Exit impersonation failed:', err)
        localStorage.removeItem(STORAGE_KEY)
        window.location.href = '/auth/login'
        return
      }

      const { tokenHash } = await res.json()
      window.location.href = `/auth/impersonate-verify?token_hash=${encodeURIComponent(tokenHash)}&return=admin`
    } catch (err) {
      console.error('Exit impersonation error:', err)
      localStorage.removeItem(STORAGE_KEY)
      window.location.href = '/auth/login'
    }
  }, [])

  return {
    initialized,
    isImpersonating,
    targetUserName: data?.targetName ?? null,
    targetUserEmail: data?.targetEmail ?? null,
    adminName: data?.adminName ?? null,
    startImpersonating,
    stopImpersonating,
  }
}
