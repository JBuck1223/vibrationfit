'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { AbundanceEditForm } from './AbundanceEditForm'

export interface AbundanceEditModalProps {
  isOpen: boolean
  eventId: string | null
  onClose: () => void
  onSuccess: () => void
}

export function AbundanceEditModal({
  isOpen,
  eventId,
  onClose,
  onSuccess,
}: AbundanceEditModalProps) {
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

  if (!isOpen || !eventId) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start md:items-center justify-center overflow-y-auto bg-black/95 px-3 pt-14 pb-[calc(2.5rem+env(safe-area-inset-bottom))] md:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit abundance entry"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="fixed top-3 right-3 z-[201] rounded-full bg-neutral-800/80 p-2 text-white backdrop-blur-sm transition-colors hover:bg-neutral-700"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative flex w-full max-w-[700px] justify-center md:max-w-none">
        <div
          className="relative w-full max-w-2xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[96vh] overflow-y-auto px-3 pb-2 sm:px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <AbundanceEditForm
            key={eventId}
            eventId={eventId}
            onCancel={onClose}
            onSuccess={() => {
              onSuccess()
              onClose()
            }}
            cardClassName="!rounded-2xl !bg-[#101010] !border-[#1F1F1F] !p-3 !pb-8 md:!p-4"
            categoryGridBleedClass="-mx-3 md:mx-0"
          />
        </div>
      </div>
    </div>
  )
}
