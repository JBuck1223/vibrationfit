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
import { RailNav } from './RailNav'
import { useKeyboardOpen } from './useKeyboardOpen'

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

  return (
    <ThemeProvider>
      <div
        data-app-shell
        data-section={section.accent === 'viva' ? 'viva' : undefined}
        className="relative min-h-dvh text-white"
      >
        <ThemeBackdrop />
        <RailNav />
        <div className="lg:pl-[72px]">
          <ShellHeader />
          <main data-app-scroller className="mx-auto w-full max-w-[1200px] px-4 pb-6 pt-2 md:px-6 lg:px-8 lg:pt-4">
            {children}
            <BottomClearance />
          </main>
        </div>
        <PillNav />
      </div>
    </ThemeProvider>
  )
}
