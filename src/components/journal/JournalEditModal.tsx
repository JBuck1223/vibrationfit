'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { JournalEditForm, type JournalEditEntry } from './JournalEditForm'

export interface JournalEditModalProps {
  isOpen: boolean
  entry: JournalEditEntry | null
  onClose: () => void
  onSuccess: () => void
}

export function JournalEditModal({
  isOpen,
  entry,
  onClose,
  onSuccess,
}: JournalEditModalProps) {
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

  if (!isOpen || !entry) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start md:items-center justify-center overflow-y-auto bg-black/95 px-3 pt-14 pb-[calc(2.5rem+env(safe-area-inset-bottom))] md:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit journal entry"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="fixed top-3 right-3 z-[201] p-2 rounded-full bg-neutral-800/80 text-white backdrop-blur-sm hover:bg-neutral-700 transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative flex w-full max-w-[700px] md:max-w-none justify-center">
        <div
          className="relative w-full max-w-2xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[96vh] overflow-y-auto px-3 pb-2 sm:px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <JournalEditForm
            key={entry.id}
            entry={entry}
            onCancel={onClose}
            onSuccess={() => {
              onSuccess()
              onClose()
            }}
            cardClassName="!rounded-2xl !bg-[#101010] !border-[#1F1F1F] !p-3 !pb-8 md:!p-4"
            categoryGridWrapOnDesktop
            categoryGridBleedClass="-mx-3 md:-mx-4"
          />
        </div>
      </div>
    </div>
  )
}
