'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface IntensiveStepContextValue {
  completedAt: string | null
  setCompletedAt: (date: string | null) => void
}

const IntensiveStepContext = createContext<IntensiveStepContextValue>({
  completedAt: null,
  setCompletedAt: () => {},
})

export function IntensiveStepProvider({ children }: { children: ReactNode }) {
  const [completedAt, setCompletedAtRaw] = useState<string | null>(null)
  const setCompletedAt = useCallback((date: string | null) => setCompletedAtRaw(date), [])

  return (
    <IntensiveStepContext.Provider value={{ completedAt, setCompletedAt }}>
      {children}
    </IntensiveStepContext.Provider>
  )
}

export function useIntensiveStep() {
  return useContext(IntensiveStepContext)
}
