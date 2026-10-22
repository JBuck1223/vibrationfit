'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWalkthroughChrome } from '@/components/tool-walkthrough'

/**
 * The studio walkthrough toggle in the app shell (the old area bars carried
 * it in their menu). It sits in the top bar beside search, so studio
 * headers stay centered. Renders nothing where a page has no walkthrough.
 */
export function ShellWalkthroughButton({
  walkthrough,
}: {
  /** For pages that run their own walkthrough instead of a studio host (VIVA). */
  walkthrough?: { active: boolean; onToggle: () => void; available?: boolean }
} = {}) {
  const context = useWalkthroughChrome()
  const chrome = walkthrough ? { available: walkthrough.available ?? true, ...walkthrough } : context
  const [slot, setSlot] = React.useState<HTMLElement | null>(null)
  React.useEffect(() => setSlot(document.getElementById('shell-header-actions')), [])
  if (!chrome?.available || !slot) return null
  return createPortal(
    <button
      type="button"
      onClick={chrome.onToggle}
      aria-pressed={chrome.active}
      aria-label="Walkthrough"
      title="Walkthrough"
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
        chrome.active ? 'bg-[rgba(57,255,20,0.16)] text-[#39FF14]' : 'text-white/80 hover:bg-white/10',
      )}
    >
      <Lightbulb className="h-5 w-5" strokeWidth={2.1} />
    </button>,
    slot,
  )
}
