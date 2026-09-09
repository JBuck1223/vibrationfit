'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'
import { resolveToolWalkthrough } from '@/lib/life-activation/walkthroughs'
import { ToolWalkthroughHost, UnavailableWalkthroughHost } from './WalkthroughChromeContext'

function RouteToolWalkthroughHost({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const search = useSearchParams()
  const stepId = resolveToolWalkthrough(pathname, search)

  if (!stepId) {
    return <UnavailableWalkthroughHost>{children}</UnavailableWalkthroughHost>
  }

  return (
    <ToolWalkthroughHost key={stepId} stepId={stepId}>
      {children}
    </ToolWalkthroughHost>
  )
}

/** Resolves the walk-through from the current studio tab. No tour on other tabs. */
export function StudioWalkthroughHost({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<UnavailableWalkthroughHost>{children}</UnavailableWalkthroughHost>}>
      <RouteToolWalkthroughHost>{children}</RouteToolWalkthroughHost>
    </Suspense>
  )
}

/** @deprecated Use StudioWalkthroughHost */
export function StoryWalkthroughHost({ children }: { children: ReactNode }) {
  return <StudioWalkthroughHost>{children}</StudioWalkthroughHost>
}

/** @deprecated Use StudioWalkthroughHost */
export function AudioWalkthroughHost({ children }: { children: ReactNode }) {
  return <StudioWalkthroughHost>{children}</StudioWalkthroughHost>
}
