'use client'

import React from 'react'
import { AccountAreaBar } from './AccountAreaBar'

export function AccountLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AccountAreaBar />
      <main
        className="min-w-0 flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0"
        style={{ '--content-px': '1rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </>
  )
}
