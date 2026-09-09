'use client'

import { Lightbulb } from 'lucide-react'

export function WalkthroughToggle({
  active,
  onToggle,
}: {
  active: boolean
  onToggle: () => void
  pending?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label="Walkthrough"
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-white/20 bg-white/[0.06] font-semibold text-white'
          : 'border-white/10 bg-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
      }`}
    >
      <Lightbulb className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
      Walkthrough
    </button>
  )
}
