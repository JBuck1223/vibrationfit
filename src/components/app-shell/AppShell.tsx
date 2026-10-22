'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import { sectionForPath } from '@/lib/app-shell/sections'
import { ThemeProvider } from './ThemeProvider'
import { ThemeBackdrop } from './ThemeBackdrop'
import { ShellHeader } from './ShellHeader'
import { PillNav } from './PillNav'
import { ShellUserSidebar } from '@/components/SidebarClient'
import { useKeyboardOpen } from './useKeyboardOpen'
import { ShellContextProvider } from './ShellContext'
import { FlowBar } from '@/components/flows/FlowBar'

/**
 * Space under the content so the last card clears the pill (and the mini
 * player when one is docked above it).
 */
function BottomClearance() {
  const hasPlayer = useGlobalAudioStore((s) => s.tracks.length > 0)
  return (
    <div
      aria-hidden
      className={cn('lg:hidden', hasPlayer ? 'h-[calc(var(--shell-nav-height)+5rem+env(safe-area-inset-bottom,0px)+24px)]' : 'h-[calc(var(--shell-nav-height)+env(safe-area-inset-bottom,0px)+24px)]')}
    />
  )
}

/**
 * The member shell: backdrop, header, pill or rail, and a content column.
 * Rendered once by GlobalLayout when the shell flag is on; pages inside only
 * ever change the content column.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const section = sectionForPath(pathname)
  const keyboardOpen = useKeyboardOpen()

  React.useEffect(() => {
    const pill = document.querySelector<HTMLElement>('[data-shell-pill]')
    if (pill) pill.dataset.keyboard = keyboardOpen ? 'open' : 'closed'
  }, [keyboardOpen])

  // VIVA scrolls its own thread, so its column is pinned to the viewport height.
  const fullHeight = section.id === 'viva' || (pathname ?? '').startsWith('/vibe-tribe')

  return (
    <ThemeProvider>
      <ShellContextProvider>
        <div
          data-app-shell
          data-section={section.accent === 'viva' ? 'viva' : undefined}
          // `isolate` keeps the -z-10 backdrop inside this stacking context, above the body's black.
          className="relative isolate min-h-dvh text-white"
        >
          <ThemeBackdrop />
          <div className="flex min-h-dvh">
            {/* The member sidebar members already know, regrouped and in glass. Desktop only. */}
            <div className="shell-sidebar hidden lg:flex lg:sticky lg:top-0 lg:h-dvh lg:shrink-0">
              <ShellUserSidebar />
            </div>
            <div className="min-w-0 flex-1">
              <ShellHeader />
              {fullHeight ? (
                <main data-app-scroller className="shell-full-height flex w-full flex-col overflow-hidden">
                  {children}
                </main>
              ) : (
                <main data-app-scroller className="w-full px-4 pb-6 pt-2 md:px-6 lg:px-8 lg:pt-4">
                  {children}
                  <BottomClearance />
                </main>
              )}
            </div>
          </div>
          <FlowBar />
          <PillNav />
        </div>
      </ShellContextProvider>
    </ThemeProvider>
  )
}
