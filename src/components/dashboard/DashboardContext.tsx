'use client'

import { createContext, useContext, type ReactNode } from 'react'

/** Data the server page resolves once and hands to every widget. */
export interface DashboardServerContext {
  userId: string
  userEmail: string | null
  firstName: string | null
  userTimezone: string | null
}

interface DashboardContextValue {
  server: DashboardServerContext
  customizing: boolean
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({
  server,
  customizing,
  children,
}: {
  server: DashboardServerContext
  customizing: boolean
  children: ReactNode
}) {
  return (
    <DashboardContext.Provider value={{ server, customizing }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider')
  return ctx
}
