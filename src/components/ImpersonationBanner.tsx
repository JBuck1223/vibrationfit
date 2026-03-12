'use client'

import { useEffect } from 'react'
import { useImpersonation } from '@/hooks/useImpersonation'
import { Eye, X } from 'lucide-react'

const BANNER_HEIGHT = '40px'

export function ImpersonationBanner() {
  const { isImpersonating, targetUserName, targetUserEmail, stopImpersonating } = useImpersonation()

  useEffect(() => {
    if (isImpersonating) {
      document.body.style.paddingTop = BANNER_HEIGHT
    } else {
      document.body.style.paddingTop = ''
    }
    return () => { document.body.style.paddingTop = '' }
  }, [isImpersonating])

  if (!isImpersonating) return null

  const display = targetUserName || targetUserEmail || 'Unknown user'

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-accent-500 text-black px-4 flex items-center justify-between gap-3 text-sm font-semibold shadow-lg"
      style={{ height: BANNER_HEIGHT }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">
          Viewing as: <span className="font-bold">{display}</span>
        </span>
      </div>
      <button
        onClick={stopImpersonating}
        className="flex items-center gap-1 px-3 py-1 bg-black/20 hover:bg-black/30 rounded-full transition-colors flex-shrink-0"
      >
        <X className="w-3 h-3" />
        Exit
      </button>
    </div>
  )
}
