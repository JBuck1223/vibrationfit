'use client'

import React from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '../shared-utils'
import { Button } from '../forms/Button'
import { OverlayPortal } from './OverlayPortal'

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  itemName?: string
  itemType?: string
  isDeleting?: boolean
  isLoading?: boolean
  loadingText?: string
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemName,
  itemType,
  isDeleting = false,
  isLoading,
  loadingText
}) => {
  const loading = isLoading ?? isDeleting
  if (!isOpen) return null

  return (
    <OverlayPortal>
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="vf-glass rounded-[24px] border bg-[rgba(28,22,38,0.97)] shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-2xl border-[#D03739]/60 p-4 sm:p-6 max-w-md w-full">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#D03739]/20 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-6 h-6 text-[#D03739]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-neutral-400 text-sm">
              {message}
              {itemName && (
                <span className="block mt-2 text-white font-medium">
                  "{itemName}"
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
            className="flex-1"
          >
            {loading ? (loadingText || 'Deleting...') : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
    </OverlayPortal>
  )
}
