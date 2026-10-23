'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import { useShellNavStore } from '@/lib/stores/shell-nav-store'
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
  // Collapsed, the player shares the bottom row with the plus button.
  const collapsed = useShellNavStore((s) => s.collapsedSide !== null)
  return (
    <div
      aria-hidden
      className={cn('lg:h-[var(--shell-player-h)]', hasPlayer && !collapsed ? 'h-[calc(var(--shell-nav-height)+5rem+env(safe-area-inset-bottom,0px)+24px)]' : 'h-[calc(var(--shell-nav-height)+env(safe-area-inset-bottom,0px)+24px)]')}
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
  const hasPlayer = useGlobalAudioStore((s) => s.tracks.length > 0)
  const navCollapsed = useShellNavStore((s) => s.collapsedSide !== null)
  const hydrateNav = useShellNavStore((s) => s.hydrate)

  React.useEffect(() => {
    hydrateNav()
  }, [hydrateNav])

  React.useEffect(() => {
    const pill = document.querySelector<HTMLElement>('[data-shell-pill]')
    if (pill) pill.dataset.keyboard = keyboardOpen ? 'open' : 'closed'
  }, [keyboardOpen, navCollapsed])

  // VIVA scrolls its own thread, so its column is pinned to the viewport height.
  const fullHeight = section.id === 'viva'

  return (
    <ThemeProvider>
      <ShellContextProvider>
        <div
          data-app-shell
          data-section={section.accent === 'viva' ? 'viva' : undefined}
          // `isolate` keeps the -z-10 backdrop inside this stacking context, above the body's black.
          className="relative isolate min-h-dvh text-white"
          // Everything that clears the pill reads --shell-nav-height. Expanded it
          // uses the :root value, which the mini player (rendered outside this
          // tree) also reads, so the two never disagree. Collapsed it is the
          // plus button's size.
          // On desktop the player is a full-width bar along the bottom; the
          // sidebar and content stop above it.
          style={{ ...(navCollapsed ? { '--shell-nav-height': '60px' } : {}), '--shell-player-h': hasPlayer ? '84px' : '0px' } as React.CSSProperties}
        >
          <ThemeBackdrop />
          <div className="flex min-h-dvh">
            {/* The member sidebar members already know, regrouped and in glass. Desktop only. */}
            <div className="shell-sidebar hidden lg:flex lg:sticky lg:top-0 lg:h-[calc(100dvh-var(--shell-player-h))] lg:shrink-0 lg:py-3 lg:pl-3">
              <ShellUserSidebar />
            </div>
            <div className="min-w-0 flex-1">
              <ShellHeader />
              {fullHeight ? (
                <main data-app-scroller className="shell-full-height flex w-full flex-col overflow-hidden lg:pb-[var(--shell-player-h)]">
                  {children}
                </main>
              ) : (
                <main data-app-scroller className="w-full px-4 pb-6 pt-2 md:px-6 lg:px-8 lg:pt-4 max-md:[&_main]:px-0">
                  {/* Studio layouts wrap pages in their own <main> with phone gutters;
                      the shell already gives those, so drop the second set. */}
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
