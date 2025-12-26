'use client'

import React from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '../shared-utils'
import { Button } from '../forms/Button'

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
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1F1F1F] border-2 border-[#D03739] rounded-2xl p-6 max-w-md w-full">
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

        <div className="flex gap-3">
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
  )
}
