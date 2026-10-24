'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { NewJournalEntryForm, type MapJournalLink } from '@/components/journal/NewJournalEntryForm'
import { cn } from '@/lib/utils'
import { OverlayPortal } from '@/lib/design-system/components/overlays/OverlayPortal'
import { GLASS_SHEET, SCRIM } from '@/lib/app-shell/glass'

export interface MapJournalReflectModalProps {
  isOpen: boolean
  mapLink: MapJournalLink
  onClose: () => void
  onSuccess: () => void | Promise<void>
}

export function MapJournalReflectModal({
  isOpen,
  mapLink,
  onClose,
  onSuccess,
}: MapJournalReflectModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <OverlayPortal>
    <div
      className={cn('fixed inset-0 z-[200] flex items-start md:items-center justify-center overflow-y-auto px-3 pt-14 pb-[calc(2.5rem+env(safe-area-inset-bottom))] md:p-4', SCRIM)}
      role="dialog"
      aria-modal="true"
      aria-label="Reflect in journal"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="fixed top-3 right-3 z-[201] rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative flex w-full max-w-[700px] md:max-w-none justify-center">
        <div
          className={cn(GLASS_SHEET, 'relative w-full max-w-3xl max-h-[calc(100dvh-2rem)] overflow-y-auto px-3 pb-2 sm:px-4')}
          onClick={e => e.stopPropagation()}
        >
          <NewJournalEntryForm
            key={mapLink.occurrenceId}
            mapLink={mapLink}
            showRecoverableBanner={false}
            onCancel={onClose}
            onSuccess={async () => {
              await onSuccess()
              onClose()
            }}
            cardClassName="!rounded-2xl !bg-transparent !border-transparent !shadow-none !p-3 !pb-8 md:!p-4"
            categoryGridBleedClass="-mx-3 md:-mx-4"
          />
        </div>
      </div>
    </div>
    </OverlayPortal>
  )
}
