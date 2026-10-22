'use client'

import React, { createContext, useContext } from 'react'

interface ShellContextValue {
  /** True inside the new AppShell; pages use it to drop their own chrome. */
  inShell: boolean
}

const ShellContext = createContext<ShellContextValue>({ inShell: false })

export function ShellContextProvider({ children }: { children: React.ReactNode }) {
  return <ShellContext.Provider value={{ inShell: true }}>{children}</ShellContext.Provider>
}

export function useInShell(): boolean {
  return useContext(ShellContext).inShell
}
