'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { AreaBarTab } from '@/lib/design-system/components'

export type AdminStudioChrome = {
  title?: string
  icon?: LucideIcon
  tabs?: AreaBarTab[]
}

type AdminStudioContextValue = {
  chrome: AdminStudioChrome | null
  setChrome: (chrome: AdminStudioChrome | null) => void
}

const AdminStudioContext = createContext<AdminStudioContextValue | null>(null)

export function AdminStudioProvider({ children }: { children: React.ReactNode }) {
  const [chrome, setChromeState] = useState<AdminStudioChrome | null>(null)
  const setChrome = useCallback((next: AdminStudioChrome | null) => {
    setChromeState(next)
  }, [])

  const value = useMemo(() => ({ chrome, setChrome }), [chrome, setChrome])

  return (
    <AdminStudioContext.Provider value={value}>
      {children}
    </AdminStudioContext.Provider>
  )
}

export function useAdminStudio() {
  const ctx = useContext(AdminStudioContext)
  if (!ctx) throw new Error('useAdminStudio must be used within AdminStudioProvider')
  return ctx
}

/** Push page-specific AreaBar tabs/title. Only for in-page views that are not sidebar destinations. */
export function useAdminStudioChrome(chrome: AdminStudioChrome | null) {
  const { setChrome } = useAdminStudio()
  const tabKey = chrome?.tabs?.map(tab => `${tab.path}:${tab.label}:${tab.isActive ? 1 : 0}`).join('|') ?? ''

  useEffect(() => {
    setChrome(chrome)
    return () => setChrome(null)
  }, [setChrome, chrome?.title, tabKey])
}
