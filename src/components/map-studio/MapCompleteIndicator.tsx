'use client'

import { CheckCircle2 } from 'lucide-react'

/** Read-only complete state for system MAP rows (auto-verified via activity). */
export function MapCompleteIndicator({ compact = false }: { compact?: boolean }) {
  const iconSize = compact ? 'w-[16px] h-[16px]' : 'w-[18px] h-[18px]'
  return (
    <span className="inline-flex items-center gap-1 shrink-0 text-primary-500 font-medium text-[11px]">
      <span>Complete</span>
      <CheckCircle2 className={iconSize} strokeWidth={2} aria-hidden />
    </span>
  )
}
