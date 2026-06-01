'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface IntensiveSidebarContextValue {
  mobileOpen: boolean
  openMobileSidebar: () => void
  closeMobileSidebar: () => void
}

const IntensiveSidebarContext = createContext<IntensiveSidebarContextValue>({
  mobileOpen: false,
  openMobileSidebar: () => {},
  closeMobileSidebar: () => {},
})

export function IntensiveSidebarProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const openMobileSidebar = useCallback(() => setMobileOpen(true), [])
  const closeMobileSidebar = useCallback(() => setMobileOpen(false), [])

  return (
    <IntensiveSidebarContext.Provider value={{ mobileOpen, openMobileSidebar, closeMobileSidebar }}>
      {children}
    </IntensiveSidebarContext.Provider>
  )
}

export function useIntensiveSidebar() {
  return useContext(IntensiveSidebarContext)
}
